export const ARC_RANGES = {
  'East Blue': [1, 52], 
  'Entering the Grand Line': [53, 76], 
  'Drum Island (Snow Island)': [77, 92], 
  'Alabasta': [93, 132], 
  'Rainbow Arc (Filler)': [133, 144], 
  'Skypiea (Sky Island)': [145, 196], 
  'G-8 & Davy Back Fight': [197, 228], 
  'Water Seven': [229, 264], 
  'Enies Lobby': [265, 336],
  'Thriller Bark': [337, 384], 
  'Sabaody Archipelago': [385, 404], 
  'Amazon Lily': [405, 420], 
  'Impel Down': [421, 456], 
  'Marineford War': [457, 516], 
  'Fish-Man Island': [517, 578], 
  'Punk Hazard': [579, 628], 
  'Dressrosa': [629, 750], 
  'Zou': [751, 782], 
  'Whole Cake Island': [783, 892], 
  'Wano Country': [893, 1100], 
  'Egghead Island (Future Island Arc)': [1101, 1165],
  'Egghead Incident / CP0': [1166, 1210], 
  'World in Chaos (Reverie Aftermath)': [1211, 1240], 
  'Yonko & Final Saga Setup': [1241, 1280]
} as const;

export type ArcName = keyof typeof ARC_RANGES;