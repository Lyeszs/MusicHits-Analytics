document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('dataset_final.json');
        const data = await response.json();

        const regionSelect = document.getElementById('regionSelect');
        const yearSelect = document.getElementById('yearSelect');

        // --- CONFIGURATION ---
        const GREEN_GRADIENT = [
            '#022c22', '#064e3b', '#065f46', '#047857', '#059669', 
            '#10b981', '#22c55e', '#4ade80', '#5eead4', '#6ee7b7'
        ];

        // Remplissage Filtres
        const regions = [...new Set(data.map(d => d.region))].filter(r => r && r !== "Inconnu" && r !== "Reste du Monde").sort();
        const years = [...new Set(data.map(d => parseInt(d.year)))].filter(y => y >= 1980 && y <= 2022).sort((a,b) => b-a);

        regions.forEach(r => regionSelect.add(new Option(r, r)));
        years.forEach(y => yearSelect.add(new Option(y, y)));

        let avgChart, hitsChart;

        // --- MOTEUR DE RENDU ---
        const render = () => {
            const selRegion = regionSelect.value;
            const selYear = yearSelect.value;

            // Filtrage
            const filtered = data.filter(d => {
                const yr = parseInt(d.year);
                const matchRegion = (selRegion === 'all' || d.region === selRegion);
                const matchYear = (selYear === 'all' ? (yr >= 1980 && yr <= 2022) : yr.toString() === selYear);
                return matchRegion && matchYear && d.track_genre;
            });

            if (filtered.length === 0) return;

            // Calculs
            const genres = {};
            filtered.forEach(d => {
                const g = d.track_genre;
                if (!genres[g]) genres[g] = { count: 0, hits: 0, popSum: 0 };
                genres[g].count++;
                genres[g].popSum += d.popularity;
                if (d.popularity > 75) genres[g].hits++;
            });

            const genreArr = Object.keys(genres).map(key => ({
                name: key,
                count: genres[key].count,
                hits: genres[key].hits,
                avgPop: genres[key].popSum / genres[key].count
            })).filter(g => g.count > 5);

            // 1. CHART AVG (Barres Horizontales)
            const topAvg = [...genreArr].sort((a, b) => b.avgPop - a.avgPop).slice(0, 10);
            const avgOpts = {
                series: [{ name: 'Score', data: topAvg.map(g => parseFloat(g.avgPop.toFixed(1))) }],
                chart: { type: 'bar', height: 350, toolbar: {show:false}, fontFamily: 'Inter' },
                plotOptions: { bar: { horizontal: true, barHeight: '65%', distributed: true, borderRadius: 3, dataLabels: { position: 'right' } } },
                colors: GREEN_GRADIENT, 
                dataLabels: { enabled: true, textAnchor: 'start', style: { fontSize: '12px', colors: ['#fff'] }, formatter: (val) => val + "/100", offsetX: 5 },
                xaxis: { categories: topAvg.map(g => g.name), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: '#fff', fontSize: '13px', fontWeight: 'bold' }, maxWidth: 180 } },
                legend: { show: false }, theme: { mode: 'dark' }, grid: { show: false }
            };
            if(avgChart) avgChart.destroy();
            if(document.querySelector("#genreAvgChart")) {
                avgChart = new ApexCharts(document.querySelector("#genreAvgChart"), avgOpts);
                avgChart.render();
            }

            // 2. CHART HITS (Barres Horizontales)
            const topHits = [...genreArr].sort((a, b) => b.hits - a.hits).slice(0, 10);
            const hitsOpts = {
                series: [{ name: 'Hits', data: topHits.map(g => g.hits) }],
                chart: { type: 'bar', height: 350, toolbar: {show:false}, fontFamily: 'Inter' },
                plotOptions: { bar: { horizontal: true, barHeight: '65%', distributed: true, borderRadius: 3, dataLabels: { position: 'right' } } },
                colors: GREEN_GRADIENT,
                dataLabels: { enabled: true, textAnchor: 'start', style: { fontSize: '12px', colors: ['#fff'] }, offsetX: 5 },
                xaxis: { categories: topHits.map(g => g.name), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: '#fff', fontSize: '13px', fontWeight: 'bold' }, maxWidth: 180 } },
                legend: { show: false }, theme: { mode: 'dark' }, grid: { show: false }
            };
            if(hitsChart) hitsChart.destroy();
            if(document.querySelector("#genreHitsChart")) {
                hitsChart = new ApexCharts(document.querySelector("#genreHitsChart"), hitsOpts);
                hitsChart.render();
            }
        };

        [regionSelect, yearSelect].forEach(s => s.addEventListener('change', render));
        render();

    } catch (err) {
        console.error("Erreur JS:", err);
    }
});