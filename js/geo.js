document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('dataset_final.json');
        const data = await response.json();

        // 1. FILTRAGE ET NETTOYAGE
        const cleanData = data.filter(d => 
            d.year >= 1980 && 
            d.year <= 2022 && 
            d.region && 
            d.region !== "Inconnu" &&
            d.region !== "Reste du Monde" &&
            d.region !== "Océanie" // <--- ON VIRE L'OCEANIE ICI
        );

        // 2. IDENTIFIER LES REGIONS MAJEURES (Top 4 restant pour que ce soit lisible)
        const regionCounts = {};
        cleanData.forEach(d => {
            regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
        });
        const topRegions = Object.keys(regionCounts)
            .sort((a, b) => regionCounts[b] - regionCounts[a])
            .slice(0, 4); // On garde les 4 plus gros blocs (ex: Nord, Europe, Asie, Latine)

        // =========================================================
        // GRAPHIQUE 1 : EVOLUTION POPULARITÉ (LINE CHART)
        // =========================================================
        
        const years = [...new Set(cleanData.map(d => parseInt(d.year)))].sort((a,b) => a-b);
        const seriesData = [];

        topRegions.forEach(region => {
            const regionPoints = years.map(year => {
                const songs = cleanData.filter(d => d.region === region && parseInt(d.year) === year);
                if (songs.length === 0) return null; 
                const avg = songs.reduce((sum, s) => sum + (s.popularity || 0), 0) / songs.length;
                return parseFloat(avg.toFixed(1));
            });

            seriesData.push({
                name: region,
                data: regionPoints
            });
        });

        const optionsTrend = {
            series: seriesData,
            chart: {
                type: 'line',
                height: 350,
                toolbar: { show: false },
                fontFamily: 'Inter, sans-serif',
                zoom: { enabled: false }
            },
            colors: ['#1db954', '#2196f3', '#ff4560', '#ffc107'], // Vert, Bleu, Rouge, Jaune
            stroke: { curve: 'smooth', width: 3 },
            xaxis: {
                categories: years,
                labels: { style: { colors: '#b3b3b3' } },
                tickAmount: 8
            },
            yaxis: {
                title: { text: 'Popularité Moyenne', style: { color: '#b3b3b3' } },
                labels: { style: { colors: '#fff' } },
                min: 40, max: 100
            },
            legend: { position: 'top', labels: { colors: '#fff' } },
            grid: { borderColor: '#333' },
            theme: { mode: 'dark' },
            tooltip: { theme: 'dark' }
        };

        new ApexCharts(document.querySelector("#geoTrendChart"), optionsTrend).render();


        // =========================================================
        // GRAPHIQUE 2 : PROFIL AUDIO (BAR CHART GROUPÉ)
        // =========================================================
        
        // On prépare les données : Une série par Région
        const barSeries = [];

        topRegions.forEach(region => {
            // On prend les Top Hits (>60 pop) pour avoir la "recette"
            const songs = cleanData.filter(d => d.region === region && d.popularity > 60);
            
            if (songs.length > 0) {
                const avgDance = songs.reduce((sum, s) => sum + (s.danceability || 0), 0) / songs.length;
                const avgEnergy = songs.reduce((sum, s) => sum + (s.energy || 0), 0) / songs.length;
                const avgTempo = songs.reduce((sum, s) => sum + (s.tempo || 0), 0) / songs.length;

                barSeries.push({
                    name: region,
                    data: [
                        parseFloat((avgDance * 100).toFixed(1)), // Dance %
                        parseFloat((avgEnergy * 100).toFixed(1)), // Energy %
                        parseFloat(avgTempo.toFixed(1))            // Tempo BPM
                    ]
                });
            }
        });

        const optionsBar = {
            series: barSeries,
            chart: {
                type: 'bar',
                height: 380,
                toolbar: { show: false },
                fontFamily: 'Inter, sans-serif'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded',
                    dataLabels: { position: 'top' }
                },
            },
            dataLabels: {
                enabled: true,
                style: { fontSize: '10px', colors: ['#fff'] },
                offsetY: -20,
                formatter: function (val) { return val.toFixed(0); }
            },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: {
                categories: ['Dansabilité (0-100)', 'Énergie (0-100)', 'Tempo (BPM)'],
                labels: {
                    style: { colors: '#fff', fontSize: '13px', fontWeight: 'bold' }
                }
            },
            yaxis: {
                title: { text: 'Valeur', style: { color: '#b3b3b3' } },
                labels: { style: { colors: '#b3b3b3' } }
            },
            fill: { opacity: 1 },
            colors: ['#1db954', '#2196f3', '#ff4560', '#ffc107'],
            legend: { position: 'bottom', labels: { colors: '#fff' } },
            theme: { mode: 'dark' },
            grid: { borderColor: '#333' },
            tooltip: {
                theme: 'dark',
                y: { formatter: function (val) { return val } }
            }
        };

        new ApexCharts(document.querySelector("#geoBarChart"), optionsBar).render();

    } catch (err) {
        console.error("Erreur Geo JS:", err);
    }
});