document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('dataset_final.json');
        const data = await response.json();

        const regionSelect = document.getElementById('regionSelect');
        const yearSelect = document.getElementById('yearSelect');

        // --- 1. FILTRES ---
        const regions = [...new Set(data.map(d => d.region))].filter(r => r && r !== "Inconnu").sort();
        const years = [...new Set(data.map(d => parseInt(d.year)))]
            .filter(y => y >= 1980 && y <= 2022)
            .sort((a,b) => b-a);

        regions.forEach(r => regionSelect.add(new Option(r, r)));
        years.forEach(y => yearSelect.add(new Option(y, y)));

        let radarChart, efficiencyChart, treemapChart;

        // --- 2. RENDER ---
        const render = () => {
            const selRegion = regionSelect.value;
            const selYear = yearSelect.value;

            const filtered = data.filter(d => {
                const yr = parseInt(d.year);
                const matchRegion = (selRegion === 'all' || d.region === selRegion);
                const matchYear = (selYear === 'all' ? (yr >= 1980 && yr <= 2022) : yr.toString() === selYear);
                return matchRegion && matchYear && d.track_genre;
            });

            if (filtered.length === 0) return;

            // Agrégation
            const genres = {};
            filtered.forEach(d => {
                const g = d.track_genre;
                if (!genres[g]) genres[g] = { count: 0, hits: 0, dance: 0, energy: 0, popSum: 0 };
                
                genres[g].count++;
                genres[g].popSum += d.popularity;
                genres[g].dance += (d.danceability || 0);
                genres[g].energy += (d.energy || 0);
                
                // DEFINITION D'UN HIT : > 75 de popularité
                if (d.popularity > 75) genres[g].hits++;
            });

            const genreArr = Object.keys(genres).map(key => {
                const obj = genres[key];
                return {
                    name: key,
                    count: obj.count,
                    hits: obj.hits, // ON GARDE JUSTE LE NOMBRE
                    avgPop: obj.popSum / obj.count,
                    dance: (obj.dance / obj.count).toFixed(2),
                    energy: (obj.energy / obj.count).toFixed(2)
                };
            }).filter(g => g.count > 10); 

            // --- GRAPHE 1 : RADAR (Top 3 Volume) ---
            const top3Volume = [...genreArr].sort((a, b) => b.count - a.count).slice(0, 3);
            const radarOpts = {
                series: top3Volume.map(g => ({
                    name: g.name,
                    data: [g.dance * 100, g.energy * 100, g.avgPop] 
                })),
                chart: { type: 'radar', height: 350, toolbar: {show:false}, fontFamily: 'Inter' },
                xaxis: { categories: ['Dansabilité', 'Énergie', 'Popularité Moyenne'] },
                stroke: { width: 2 },
                fill: { opacity: 0.2 },
                markers: { size: 4 },
                colors: ['#1db954', '#ffffff', '#b3b3b3'], 
                theme: { mode: 'dark' }
            };
            if(radarChart) radarChart.destroy();
            radarChart = new ApexCharts(document.querySelector("#radarGenre"), radarOpts);
            radarChart.render();

            // --- GRAPHE 2 : VOLUME HITS (Plus de %) ---
            // On trie par nombre de HITS
            const topHits = [...genreArr].sort((a, b) => b.hits - a.hits).slice(0, 10);
            
            const efficiencyOpts = {
                series: [{ name: 'Nombre de Hits', data: topHits.map(g => g.hits) }],
                chart: { type: 'bar', height: 350, toolbar: {show:false}, fontFamily: 'Inter' },
                plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%', distributed: true } },
                colors: ['#052e16', '#0a4a22', '#0f662e', '#14823a', '#1db954', '#40c26e', '#63cb88', '#85d4a2', '#a8ddbc', '#cae6d6'],
                dataLabels: {
                    enabled: true,
                    formatter: (val) => val + " titres", // Affiche "XX titres"
                    style: { colors: ['#fff'] }
                },
                xaxis: { categories: topHits.map(g => g.name), labels: { style: { colors: '#b3b3b3' } } },
                yaxis: { labels: { style: { colors: '#fff', fontSize: '13px', fontWeight: 600 } } },
                tooltip: { theme: 'dark', y: { formatter: (val) => val + " titres classés Hits" } },
                theme: { mode: 'dark' },
                grid: { show: false }
            };
            if(efficiencyChart) efficiencyChart.destroy();
            efficiencyChart = new ApexCharts(document.querySelector("#heatmapGenre"), efficiencyOpts);
            efficiencyChart.render();

            // --- GRAPHE 3 : TREEMAP (Sans pourcentage) ---
            const topMarket = [...genreArr].sort((a, b) => b.count - a.count).slice(0, 20);
            const treemapOpts = {
                series: [{ 
                    data: topMarket.map(g => ({ x: g.name, y: g.count })) 
                }],
                chart: { type: 'treemap', height: 350, toolbar: {show:false}, fontFamily: 'Inter' },
                colors: ['#1db954'],
                theme: { mode: 'dark' },
                dataLabels: {
                    style: { fontSize: '14px', fontWeight: 'bold' },
                    formatter: function(text, op) {
                        return [text, op.value]; // Nom + Volume
                    }
                },
                plotOptions: { treemap: { distributed: true, enableShades: true } }
            };
            if(treemapChart) treemapChart.destroy();
            treemapChart = new ApexCharts(document.querySelector("#treemapGenre"), treemapOpts);
            treemapChart.render();
        };

        [regionSelect, yearSelect].forEach(s => s.addEventListener('change', render));
        render();

    } catch (err) {
        console.error("Erreur JS:", err);
    }
});