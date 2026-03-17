const cache = { data: null, ts: 0 }; // cache-clear
```
5. **Commit changes**

Aguarda o deploy terminar (~1 min) e abre:
```
https://flavora1-teste.vercel.app/api/trends
const TTL = 24 * 60 * 60 * 1000;

const RECIPES = [
  { rank:1, name:'Hot Honey Pasta', origin:'🇺🇸 USA → Global', searches:'2.4M', pct:98, query:'hot honey pasta food' },
  { rank:2, name:'Cottage Cheese Recipes', origin:'🌍 Global', searches:'1.8M', pct:85, query:'cottage cheese bowl recipe food' },
  { rank:3, name:'Sleepy Girl Mocktail', origin:'🇺🇸 TikTok', searches:'980K', pct:72, query:'sleepy girl mocktail drink' },
  { rank:4, name:'Marry Me Chicken', origin:'🇮🇹 Italy-inspired', searches:'1.2M', pct:78, query:'marry me chicken creamy recipe' },
  { rank:5, name:'Dubai Pistachio Chocolate', origin:'🇦🇪 UAE → Global', searches:'860K', pct:65, query:'dubai pistachio chocolate bar' },
  { rank:6, name:'Baked Oats', origin:'🇬🇧 UK → Global', searches:'720K', pct:58, query:'baked oats breakfast recipe' },
  { rank:7, name:'Birria Tacos', origin:'🇲🇽 Mexico → Global', searches:'650K', pct:52, query:'birria tacos mexican food' },
  { rank:8, name:'Gut Health Bowl', origin:'🌍 Wellness', searches:'590K', pct:48, query:'gut health fermented food bowl' },
  { rank:9, name:'Japanese Breakfast Bowl', origin:'🇯🇵 Japan → Global', searches:'480K', pct:40, query:'japanese breakfast bowl food' },
];

const WORKOUTS = [
  { rank:1, name:'Hot Girl Walk', origin:'🇺🇸 TikTok → Global', searches:'3.1M', pct:97, query:'hot girl walk outdoor fitness' },
  { rank:2, name:'75 Hard Challenge', origin:'🇺🇸 USA → Global', searches:'2.2M', pct:88, query:'75 hard challenge workout fitness' },
  { rank:3, name:'Reformer Pilates', origin:'🌍 Global', searches:'1.9M', pct:82, query:'reformer pilates studio workout' },
  { rank:4, name:'Zone 2 Cardio', origin:'🔬 Science-backed', searches:'1.4M', pct:74, query:'zone 2 cardio running cycling' },
  { rank:5, name:'Couch to 5K', origin:'🇬🇧 UK → Global', searches:'1.1M', pct:68, query:'couch to 5k running beginner' },
  { rank:6, name:'Rucking', origin:'🪖 Military → Mainstream', searches:'890K', pct:60, query:'rucking backpack hiking fitness' },
  { rank:7, name:'Somatic Workouts', origin:'🧘 Wellness Trend', searches:'740K', pct:53, query:'somatic workout yoga stretching' },
  { rank:8, name:'Dance Fitness', origin:'💃 TikTok → Global', searches:'620K', pct:45, query:'dance fitness zumba workout' },
  { rank:9, name:'Wall Pilates', origin:'📱 TikTok → Global', searches:'540K', pct:38, query:'wall pilates exercise fitness' },
];

async function getImage(query, key, cx) {
  try {
    const url = 'https://www.googleapis.com/customsearch/v1?key=' + key +
      '&cx=' + cx +
      '&q=' + encodeURIComponent(query) +
      '&searchType=image&num=1&safe=active&imgType=photo&imgSize=large';

    const r = await fetch(url);
    const d = await r.json();

    // Log para debug no Vercel
    if (d.error) {
      console.error('Google API error:', JSON.stringify(d.error));
      return null;
    }

    return d.items?.[0]?.link || null;
  } catch (e) {
    console.error('Image fetch error:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Retorna cache se válido
  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json({ ...cache.data, fromCache: true });
  }

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  // Diagnóstico das variáveis
  if (!key) {
    console.error('GOOGLE_API_KEY not set');
    return res.status(200).json({
      recipes: RECIPES.map(r => ({ ...r, image: null })),
      workouts: WORKOUTS.map(w => ({ ...w, image: null })),
      updatedAt: new Date().toISOString(),
      debug: 'GOOGLE_API_KEY missing'
    });
  }
  if (!cx) {
    console.error('GOOGLE_CX not set');
    return res.status(200).json({
      recipes: RECIPES.map(r => ({ ...r, image: null })),
      workouts: WORKOUTS.map(w => ({ ...w, image: null })),
      updatedAt: new Date().toISOString(),
      debug: 'GOOGLE_CX missing'
    });
  }

  console.log('Fetching images with CX:', cx.substring(0, 8) + '...');

  try {
    // Busca imagens uma a uma para não estourar cota
    const recipes = [];
    for (const item of RECIPES) {
      const image = await getImage(item.query, key, cx);
      recipes.push({ ...item, image });
    }

    const workouts = [];
    for (const item of WORKOUTS) {
      const image = await getImage(item.query, key, cx);
      workouts.push({ ...item, image });
    }

    const result = { recipes, workouts, updatedAt: new Date().toISOString() };
    cache.data = result;
    cache.ts = Date.now();

    return res.status(200).json(result);

  } catch (err) {
    console.error('Trends handler error:', err.message);
    return res.status(200).json({
      recipes: RECIPES.map(r => ({ ...r, image: null })),
      workouts: WORKOUTS.map(w => ({ ...w, image: null })),
      updatedAt: new Date().toISOString(),
      debug: err.message
    });
  }
}
