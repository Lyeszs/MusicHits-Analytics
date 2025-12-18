MusicHits-Analytics
Ce projet est une plateforme d'analyse de données musicales permettant de visualiser l'évolution des hits mondiaux de 1980 à 2022. Il combine un pipeline ETL (Python/Gemini), des notebooks d'analyse avancée et un dashboard interactif multi-pages.

Comment lancer le projet
1. Configuration des variables d'environnement
Sur Windows (PowerShell), définis tes accès localement pour permettre aux scripts d'interroger les API :

PowerShell

$env:SPOTIFY_CLIENT_ID="votre_client_id_ici"
$env:SPOTIFY_CLIENT_SECRET="votre_client_secret_ici"
$env:GEMINI_API_KEY="votre_cle_gemini_ici"
2. Exécution du pipeline de données (ETL)
Lance les scripts dans cet ordre pour générer le fichier dataset_final.json complet :

python etl2.py : Analyse et enrichissement des données via l'IA Gemini.

python etl.py : Extraction finale et consolidation via l'API Spotify.

neamoins vous trouverez dans le dossier archives toutes les données nécessaires

3. Notebooks d'analyse et de prédiction
Le projet inclut deux notebooks Jupyter pour approfondir l'étude des données :

pipeline.ipynb : Ce notebook détaille l'intégralité du flux de traitement, du nettoyage des données brutes à la structuration finale du dataset.

prediction.ipynb : Ce fichier contient les modèles et les analyses prédictives basés sur les caractéristiques audio pour anticiper les tendances futures du marché.

4. Lancement de l'interface
L'utilisation de la fonction fetch() pour charger les données JSON impose l'utilisation d'un serveur local :

Utilise l'extension LiveServer sur VS Code.
Ou lance la commande suivante à la racine du projet : python -m http.server 8000.

Technologies & Bibliothèques
Visualisation & Dashboard
ApexCharts.js : Bibliothèque utilisée pour tous les graphiques de données, notamment les radars ADN, les courbes d'évolution et les histogrammes de genres.

Vanilla JavaScript (ES6+) : Coeur de la logique pour le chargement des données, le filtrage croisé (année/région) et le calcul des indicateurs clés (KPI).

Tailwind CSS : Framework utilisé pour le stylisage moderne et la mise en page en mode sombre.

Backend, IA & Data Science
Spotipy : Bibliothèque Python utilisée pour l'extraction des métadonnées et des caractéristiques audio depuis l'API Spotify.

Google Generative AI (Gemini) : Intégrée au pipeline ETL pour l'analyse, la classification ou l'enrichissement des données musicales.

Jupyter Notebook : Environnement utilisé pour le prototypage du pipeline et les analyses prédictives.

Analyse : Réponse à la Problématique
Problématique : "Comment le profil commercial du 'Hit' a-t-il évolué entre les années 1980 et 2022, et quels sont les indicateurs clés de succès qui ont persisté ?"

1. Géographie : D'où vient le son ?
Question : La légende Américaine est-elle toujours absolue ou assiste-t-on à une diversification des origines musicales ?

Hypothèse : La numérisation de la distribution (streaming) réduit les barrières à l'entrée pour les marchés non-anglophones.

Analyse des données : Nos visualisations montrent qu'après une domination totale des USA dans les années 80 et 90, on observe une percée significative des artistes européens et sud-américains (Reggaeton) depuis 2015.

Lien historique : Ce phénomène coïncide avec l'explosion mondiale de titres comme "Despacito", prouvant que la barrière de la langue n'est plus un obstacle majeur au succès commercial global.

2. Durée et Émotion : Le Temps & L'Émotion
Question : La musique est-elle devenue plus rapide ou plus triste face aux crises mondiales ?

Hypothèse : Le format des chansons se réduit pour s'adapter aux algorithmes de replay, tandis que les tonalités deviennent plus mélancoliques.

Analyse des données : Le dashboard met en évidence une hausse du tempo moyen (BPM), mais une chute de la "Valence" (positivité) sur les dernières années. Parallèlement, nos KPIs indiquent que la durée moyenne chute souvent sous les 3 minutes.

Lien historique : Le streaming rémunérant à l'écoute (après 30 secondes), les structures de chansons avec de longues introductions disparaissent au profit de refrains immédiats et de morceaux courts, facilitant la viralité sur des plateformes comme TikTok.

3. Genres : La Guerre des Styles
Question : La Pop conserve-t-elle son trône face à l'émergence des musiques urbaines ?

Hypothèse : Les genres "Urbains" (Hip-Hop, Trap) sont devenus la nouvelle Pop mondiale.

Analyse des données : Les histogrammes de répartition des genres montrent un déclin relatif de la Pop traditionnelle au profit du Hip-Hop et de la Dance music qui saturent désormais les charts.

Lien historique : Depuis les années 2010, les codes du Hip-Hop (rythmiques trap, auto-tune) ont été absorbés par l'industrie mainstream, rendant la frontière entre "Pop" et "Musique Urbaine" de plus en plus floue dans le dataset final.

4. Synthèse Prédictive (Notebook Prediction)
Analyse : En utilisant les modèles du fichier prediction.ipynb, nous observons que les variables "Danceability" et "Energy" sont devenues les prédicteurs les plus fiables d'un Hit moderne par rapport à l'instrumentalisation complexe des décennies précédentes.

Conclusion : Le hit moderne est un produit optimisé techniquement pour l'efficacité (court, énergétique, répétitif) mais qui porte une charge émotionnelle plus sombre, reflétant une société ultra-connectée mais anxieuse.


Dictionnaire des Données (dataset_final.json)
popularity : Indice de succès actuel calculé par Spotify selon le volume et la récence des écoutes.

danceability : Score mesurant si un morceau est adapté à la danse selon son rythme et sa régularité.

energy : Mesure de l'intensité, du volume perçu et de l'activité sonore.

tempo : Vitesse globale du morceau mesurée en battements par minute (BPM).

duration_fmt : Durée du titre formatée en minutes et secondes.

region / country_code : Localisation géographique associée à la production du titre ou à l'artiste.