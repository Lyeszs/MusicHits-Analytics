import pandas as pd

# 1. Charger les données
try:
    df = pd.read_json('dataset_final.json')
    print("✅ Fichier chargé avec succès.")
except ValueError:
    print("❌ Erreur : Impossible de lire dataset_final.json")
    exit()

# 2. Configuration de la recherche
# Copie exactement le nom qui apparaît dans tes filtres, attention aux espaces !
TARGET_REGION = "Amérique Latine/ Amérique du Sud"
SEUIL_POPULARITE = 75

# 3. Filtrage
# On regarde ce qui existe vraiment pour cette région entre 1980 et 2022
subset = df[
    (df['region'] == TARGET_REGION) & 
    (df['year'] >= 1980) & 
    (df['year'] <= 2022)
]

print(f"\n📊 ANALYSE POUR : {TARGET_REGION} (1980-2022)")
print(f"Nombre total de titres trouvés dans le dataset : {len(subset)}")

if len(subset) == 0:
    print("⚠️ ATTENTION : Aucun titre trouvé pour cette région. Vérifie l'orthographe exacte dans le JSON :")
    print(df['region'].unique())
else:
    # 4. Statistiques de popularité
    max_pop = subset['popularity'].max()
    avg_pop = subset['popularity'].mean()
    
    print(f"Popularité Maximum atteinte : {max_pop}/100")
    print(f"Popularité Moyenne : {avg_pop:.2f}/100")

    # 5. Recherche des Hits > 75
    hits = subset[subset['popularity'] > SEUIL_POPULARITE]
    
    print(f"\n🏆 Nombre de titres au-dessus de {SEUIL_POPULARITE} : {len(hits)}")
    
    if len(hits) > 0:
        print("\n--- Voici les Hits trouvés ---")
        print(hits[['track_name', 'artists', 'year', 'popularity']].sort_values(by='popularity', ascending=False).to_string(index=False))
    else:
        print(f"\n❌ Aucun titre ne dépasse {SEUIL_POPULARITE}.")
        print("--- Voici le Top 10 réel de cette région (pour calibrer ton seuil) ---")
        print(subset[['track_name', 'artists', 'year', 'popularity']].sort_values(by='popularity', ascending=False).head(10).to_string(index=False))