// js/temporalite.js

// --- CONFIGURATION ---
// Assure-toi que ce fichier est bien à la racine du site
const CSV_URL = 'GLOBAL_HIT_1980_2023_MMSS.csv';

// --- VARIABLES GLOBALES ---
let globalCleanData = [];
let lineChart = null;
let scatterChart = null;
let isFixedScale = false;

// --- CONFIG PERFORMANCE ---
const TRIGGER_THRESHOLD = 2000;
const TARGET_POINTS = 1000;
const PROTECTED_YEAR = 2000;
const RECENT_POINTS_QUOTA = 1500;

// --- ÉVÉNEMENTS HISTORIQUES ---
const HISTORY_EVENTS = [
    { year: 1982, label: 'CD (74min)' },
    { year: 1999, label: 'Napster' },
    { year: 2008, label: 'Spotify' }
];

// --- UTILS ---
function parseDuration(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return null;
    const parts = durationStr.split(':');
    if (parts.length !== 2) return null;
    return parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
}
function formatTime(val) {
    if(val === null || isNaN(val)) return "--:--";
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}

// --- INITIALISATION (Attendre que le DOM soit chargé) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // CHARGEMENT DATA
    Papa.parse(CSV_URL, {
        download: true, header: true, skipEmptyLines: true,
        complete: function(results) {
            globalCleanData = results.data.map(row => ({
                year: parseInt(row.year),
                popularity: parseInt(row.popularity),
                duration: parseDuration(row.duration),
                track: row.track_name,
                artist: row.artists,
                genre: row.track_genre ? row.track_genre.trim() : "Unknown"
            })).filter(d => !isNaN(d.year) && !isNaN(d.popularity) && d.duration !== null && d.year <= 2022);

            // Init UI
            updateDualSliderVisual(); 
            updateLineWrapper();
            updateScatterWrapper();
        },
        error: (err) => console.error("Erreur chargement CSV : ", err)
    });

    // --- EVENTS LISTENERS ---
    
    // Graphe 1
    const sLine = document.getElementById('sliderLinePop');
    if(sLine) sLine.addEventListener('input', updateLineWrapper);
    
    const btnScale = document.getElementById('scaleBtn');
    if(btnScale) btnScale.addEventListener('click', function() {
        isFixedScale = !isFixedScale;
        this.textContent = isFixedScale ? "ÉCHELLE FIXE (0-6)" : "ZOOM AUTO";
        this.classList.toggle('active');
        if(isFixedScale && lineChart) { lineChart.options.scales.y.min=0; lineChart.options.scales.y.max=6; }
        else if(lineChart) { delete lineChart.options.scales.y.min; delete lineChart.options.scales.y.max; }
        if(lineChart) lineChart.update();
    });

    // Graphe 2
    const sScat = document.getElementById('sliderScatterPop');
    if(sScat) sScat.addEventListener('input', updateScatterWrapper);
    
    const optCheck = document.getElementById('optCheck');
    if(optCheck) optCheck.addEventListener('change', updateScatterWrapper);
    
    const rMin = document.getElementById('rangeMin');
    const rMax = document.getElementById('rangeMax');
    
    if(rMin && rMax) {
        rMin.addEventListener('input', updateDualSliderVisual);
        rMax.addEventListener('input', updateDualSliderVisual);
    }
});


// --- FONCTIONS GRAPHIQUES ---

// Plugin Lignes Verticales
const eventLinesPlugin = {
    id: 'eventLines',
    afterDatasetsDraw(chart, args, options) {
        const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
        ctx.save();
        HISTORY_EVENTS.forEach(event => {
            const xPos = x.getPixelForValue(event.year);
            if (xPos < x.left || xPos > x.right) return;

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FEB019';
            ctx.setLineDash([6, 6]);
            ctx.moveTo(xPos, top);
            ctx.lineTo(xPos, bottom);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(event.label, xPos, top + 15); 
            ctx.fillStyle = '#FEB019';
            ctx.fillText(event.year, xPos, top + 30);
        });
        ctx.restore();
    }
};

function updateLineWrapper() {
    const el = document.getElementById('sliderLinePop');
    if(!el) return;
    const lineThresh = parseInt(el.value);
    document.getElementById('dispLinePop').textContent = lineThresh;
    updateLineChart(globalCleanData, lineThresh);
}

function updateLineChart(data, threshold) {
    const yearsData = {};
    data.forEach(row => {
        if (!yearsData[row.year]) yearsData[row.year] = { hS:0, hC:0, lS:0, lC:0 };
        if (row.popularity > threshold) {
            yearsData[row.year].hS += row.duration; yearsData[row.year].hC++;
        } else {
            yearsData[row.year].lS += row.duration; yearsData[row.year].lC++;
        }
    });

    const years = Object.keys(yearsData).sort((a,b)=>a-b);
    const dH = years.map(y => yearsData[y].hC>0 ? yearsData[y].hS/yearsData[y].hC : null);
    const dL = years.map(y => yearsData[y].lC>0 ? yearsData[y].lS/yearsData[y].lC : null);

    const ctxEl = document.getElementById('lineChart');
    if(!ctxEl) return;
    const ctx = ctxEl.getContext('2d');
    
    const COLOR_HIGH = '#00E396'; const COLOR_LOW = '#FF4560';

    if(lineChart) {
        lineChart.data.datasets[0].data = dH;
        lineChart.data.datasets[0].label = `Popularité > ${threshold}`; 
        lineChart.data.datasets[1].data = dL;
        lineChart.data.datasets[1].label = `Popularité <= ${threshold}`; 
        lineChart.update();
    } else {
        Chart.defaults.color = '#888'; Chart.defaults.borderColor = '#444';
        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    { label: `Popularité > ${threshold}`, data: dH, borderColor: COLOR_HIGH, backgroundColor: COLOR_HIGH, borderWidth:2, tension:0, pointRadius:0 },
                    { label: `Popularité <= ${threshold}`, data: dL, borderColor: COLOR_LOW, backgroundColor: COLOR_LOW, borderWidth:2, tension:0, pointRadius:0 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: { y: { ticks: { callback: v => formatTime(v) } } }
            },
            plugins: [eventLinesPlugin]
        });
    }
}

function updateStats(filteredData) {
    if (!filteredData || filteredData.length === 0) {
        document.getElementById('statAvg').textContent = "--:--";
        return;
    }
    const totalDur = filteredData.reduce((sum, d) => sum + d.duration, 0);
    const avg = totalDur / filteredData.length;
    document.getElementById('statAvg').textContent = formatTime(avg);
}

function updateScatterWrapper() {
    const el = document.getElementById('sliderScatterPop');
    if(!el) return;
    
    const scatPop = parseInt(el.value);
    document.getElementById('dispScatterPop').textContent = scatPop;

    const isOpt = document.getElementById('optCheck').checked;
    let minD = parseFloat(document.getElementById('rangeMin').value);
    let maxD = parseFloat(document.getElementById('rangeMax').value);
    if(minD > maxD) [minD, maxD] = [maxD, minD];

    updateScatterChart(globalCleanData, scatPop, minD, maxD, isOpt);
}

function updateScatterChart(data, popThreshold, minDur, maxDur, isOptActive) {
    let filteredData = data.filter(d => d.duration >= minDur && d.duration <= maxDur);
    updateStats(filteredData);

    const totalPoints = filteredData.length;
    const perfInfo = document.getElementById('perfInfo');

    if (totalPoints > TRIGGER_THRESHOLD && isOptActive) {
        const oldData = filteredData.filter(d => d.year < PROTECTED_YEAR);
        let recentData = filteredData.filter(d => d.year >= PROTECTED_YEAR);

        if (recentData.length > RECENT_POINTS_QUOTA) {
            const ratio = RECENT_POINTS_QUOTA / recentData.length;
            recentData = recentData.filter(() => Math.random() < ratio);
        }
        filteredData = [...oldData, ...recentData];
        perfInfo.innerHTML = `<span style='color:#00E396'>Optimisation Intelligente :</span> Données <${PROTECTED_YEAR} intactes. Total affiché : ${filteredData.length}`;
    } else if (totalPoints > TRIGGER_THRESHOLD && !isOptActive) {
        perfInfo.innerHTML = `<span style='color:#FF4560'>ATTENTION :</span> ${totalPoints} points.`;
    } else {
        perfInfo.innerHTML = `<span style='color:#555'>${totalPoints} chansons.</span>`;
    }

    const scatterData = filteredData.map(d => ({
        x: d.year + (Math.random()-0.5)*0.7, 
        y: d.popularity,
        rawDuration: d.duration, track: d.track, artist: d.artist, genre: d.genre
    }));
    const colors = scatterData.map(d => d.y > popThreshold ? '#00E396' : '#FF4560');
    
    const ctxEl = document.getElementById('scatterChart');
    if(!ctxEl) return;
    const ctx = ctxEl.getContext('2d');
    
    if(scatterChart) {
        scatterChart.data.datasets[0].data = scatterData;
        scatterChart.data.datasets[0].pointBackgroundColor = colors;
        scatterChart.data.datasets[0].pointBorderColor = colors;
        scatterChart.update();
    } else {
        scatterChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: [{ label: 'Chansons', data: scatterData, pointBackgroundColor: colors, pointBorderColor: colors, pointRadius: 3, pointHoverRadius: 6 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                onClick: (e) => {
                    const points = scatterChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                    if (points.length) {
                        const r = scatterChart.data.datasets[points[0].datasetIndex].data[points[0].index];
                        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(r.artist + ' ' + r.track)}`, '_blank');
                    }
                },
                plugins: { legend: {display:false}, tooltip: { callbacks: { label: c => `[${c.raw.genre}] ${c.raw.artist} - ${c.raw.track} (${formatTime(c.raw.rawDuration)})` } } },
                scales: { x: { type: 'linear', min: 1979, max: 2023, ticks:{stepSize:1, callback:Math.floor} }, y: { min:0, max:100 } },
                animation: { duration: 0 }
            }
        });
    }
}

function updateDualSliderVisual() {
    const rangeMin = document.getElementById('rangeMin');
    const rangeMax = document.getElementById('rangeMax');
    if(!rangeMin || !rangeMax) return;

    let min = parseFloat(rangeMin.value);
    let max = parseFloat(rangeMax.value);
    if(min > max) { const temp = min; min = max; max = temp; }
    
    document.getElementById('dispScatterRange').textContent = `${formatTime(min)} - ${formatTime(max)}`;
    
    const trackFill = document.getElementById('trackFill');
    const percentMin = (min / 10) * 100;
    const percentMax = (max / 10) * 100;
    
    if(trackFill) {
        trackFill.style.left = percentMin + "%";
        trackFill.style.width = (percentMax - percentMin) + "%";
    }
    
    updateScatterWrapper();
}