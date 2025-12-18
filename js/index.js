document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('dataset_final.json');
        const data = await response.json();

        calculerKPIs(data);
        initInteractiveGenreRace(data); // Version ECharts Fluide
        
      
        if(typeof afficherDuelADN === 'function') afficherDuelADN(data);
        if(typeof afficherTrajectoirePopularite === 'function') afficherTrajectoirePopularite(data);

    } catch (error) {
        console.error("Erreur de chargement :", error);
    }
});

// --- KPIs  ---
function calculerKPIs(data) {
    document.getElementById('total-songs').innerText = data.length.toLocaleString();
    const sacArtistes = new Set();
    data.forEach(item => {
        if (item.artists) {
            item.artists.split(/,|;| feat\. | & /).forEach(nom => sacArtistes.add(nom.trim()));
        }
    });
    document.getElementById('total-artists').innerText = sacArtistes.size.toLocaleString();
    const regions = data.map(item => item.region).filter(r => r);
    const counts = {};
    regions.forEach(r => counts[r] = (counts[r] || 0) + 1);
    document.getElementById('top-region').innerText = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    let totalSec = 0;
    data.forEach(item => {
        if (item.duration_fmt && item.duration_fmt.includes(':')) {
            const parts = item.duration_fmt.split(':');
            totalSec += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        }
    });
    const moy = totalSec / data.length;
    document.getElementById('avg-duration').innerText = `${Math.floor(moy/60)}:${Math.round(moy%60).toString().padStart(2,'0')}`;
}

// --- COURSE DYNAMIQUE ---
function initInteractiveGenreRace(data) {
    const chartDom = document.getElementById('genre-race-chart');
    const myChart = echarts.init(chartDom);
    
    const slider = document.getElementById('yearRange');
    const yearText = document.getElementById('yearValue');
    const yearBg = document.getElementById('current-year-bg');
    const playBtn = document.getElementById('playBtn');

    // 1. Préparer les données
    const statsByYear = {};
    for (let yr = 1980; yr <= 2023; yr++) {
        const yearHits = data.filter(d => parseInt(d.year) === yr);
        const genreSums = {};
        const genreCounts = {};

        yearHits.forEach(d => {
            if (d.track_genre) {
                genreSums[d.track_genre] = (genreSums[d.track_genre] || 0) + (d.popularity || 0);
                genreCounts[d.track_genre] = (genreCounts[d.track_genre] || 0) + 1;
            }
        });

        // Top 10 pour ECharts
        statsByYear[yr] = Object.keys(genreSums)
            .map(genre => ({
                name: genre,
                value: parseFloat((genreSums[genre] / genreCounts[genre]).toFixed(1))
            }))
            .sort((a, b) => a.value - b.value) // ECharts veut l'ordre inverse pour afficher le top en haut
            .slice(-10); // Garder les 10 meilleurs
    }

    // 2. Configuration ECharts
    const updateDuration = 3000; // Vitesse de transition

    const option = {
        grid: { top: 10, bottom: 30, left: 150, right: 50 },
        xAxis: {
            max: 'dataMax',
            axisLabel: { color: '#888' },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'category',
            inverse: true, // Le premier en haut
            animationDuration: 300,
            animationDurationUpdate: 300,
            axisLabel: {
                show: true,
                color: '#fff',
                fontSize: 13,
                fontWeight: 'bold'
            },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: [{
            realtimeSort: true, // C'est ça qui fait l'animation fluide
            name: 'Popularité',
            type: 'bar',
            data: [], // Sera rempli par update
            label: {
                show: true,
                position: 'right',
                valueAnimation: true,
                color: '#fff',
                fontWeight: 'bold'
            },
            itemStyle: {
                color: function(param) {
                    
                    const colors = [
                        '#b8e2cc', '#96d8b0', '#72ce93', '#4bc475', '#1db954',
                        '#248e48', '#1f7b3e', '#1a6835', '#15552b', '#104222'
                    ];
                    // On mappe l'index inversé car ECharts dessine de bas en haut
                    return colors[param.dataIndex] || '#1db954';
                },
                borderRadius: [0, 6, 6, 0]
            },
            barWidth: '70%'
        }],
        animationDuration: 0,
        animationDurationUpdate: updateDuration,
        animationEasing: 'linear',
        animationEasingUpdate: 'linear'
    };

    myChart.setOption(option);

    // 3. Mise à jour
    const update = (yr) => {
        const source = statsByYear[yr] || [];
        
        myChart.setOption({
            yAxis: {
                data: source.map(item => item.name)
            },
            series: [{
                data: source.map(item => item.value)
            }]
        });

        yearText.innerText = yr;
        yearBg.innerText = yr;
        slider.value = yr;
    };

    // Premier affichage
    update(1980);

    // 4. Contrôles
    let isPlaying = false;
    let playInterval;

    slider.addEventListener('input', (e) => {
        if(isPlaying) stopAutoPlay();
        update(parseInt(e.target.value));
    });

    const stopAutoPlay = () => { 
        clearInterval(playInterval); 
        isPlaying = false; 
        playBtn.innerText = "▶"; 
    };

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopAutoPlay();
        } else {
            isPlaying = true;
            playBtn.innerText = "⏸";
            let curr = parseInt(slider.value);
            
            playInterval = setInterval(() => {
                if (curr >= 2023) {
                    curr = 1980; // Boucle
                } else {
                    curr++;
                }
                update(curr);
            }, updateDuration);
        }
    });

    // Responsive
    window.addEventListener('resize', () => myChart.resize());
}