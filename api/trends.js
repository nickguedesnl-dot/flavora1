const cache = { data: null, ts: 0 }; // v3-unsplash
const TTL = 24 * 60 * 60 * 1000;

const RECIPES = [
  { rank:1, name:'Hot Honey Pasta', origin:'🇺🇸 USA → Global', searches:'2.4M', pct:98, query:'honey pasta food' },
  { rank:2, name:'Cottage Cheese Recipes', origin:'🌍 Global', searches:'1.8M', pct:85, query:'cottage cheese bowl healthy food' },
  { rank:3, name:'Sleepy Girl Mocktail', origin:'🇺🇸 TikTok', searches:'980K', pct:72, query:'cherry mocktail drink' },
  { rank:4, name:'Marry Me Chicken', origin:'🇮🇹 Italy-inspired', searches:'1.2M', pct:78, query:'creamy chicken pasta dinner' },
  { rank:5, name:'Dubai Pistachio Chocolate', origin:'🇦🇪 UAE → Global', searches:'860K', pct:65, query:'pistachio chocolate dessert' },
  { rank:6, name:'Baked Oats', origin:'🇬🇧 UK → Global', searches:'720K', pct:58, query:'baked oats breakfast' },
  { rank:7, name:'Birria Tacos', origin:'🇲🇽 Mexico → Global', searches:'650K', pct:52, query:'birria tacos mexican food' },
  { rank:8, name:'Gut Health Bowl', origin:'🌍 Wellness', searches:'590K', pct:48, query:'fermented food healthy bowl' },
  { rank:9, name:'Japanese Breakfast Bowl', origin:'🇯🇵 Japan → Global', searches:'480K', pct:40, query:'japanese breakfast bowl' },
];

const WORKOUTS = [
  { rank:1, name:'Hot Girl Walk', origin:'🇺🇸 TikTok → Global', searches:'3.1M', pct:97, query:'woman walking outdoor fitness' },
  { rank:2, name:'75 Hard Challenge', origin:'🇺🇸 USA → Global', searches:'2.2M', pct:88, query:'workout challenge fitness gym' },
  { rank:3, name:'Reformer Pilates', origin:'🌍 Global', searches:'1.9M', pct:82, query:'pilates reformer studio' },
  { rank:4, name:'Zone 2 Cardio', origin:'🔬 Science-backed', searches:'1.4M', pct:74, query:'running cardio fitness outdoor' },
  { rank:5, name:'Couch to 5K', origin:'🇬🇧 UK → Global', searches:'1.1M', pct:68, query:'running beginner jogging' },
  { rank:6, name:'Rucking', origin:'🪖 Military → Mainstream', searches:'890K', pct:60, query:'hiking backpack outdoor trail' },
  { rank:7, name:'Somatic Workouts', origin:'🧘 Wellness Trend', searches:'740K', pct:53, query:'yoga stretching wellness' },
  { rank:8, name:'Dance Fitness', origin:'💃 TikTok → Global', searches:'620K', pct:45, query:'dance fitness workout' },
  { rank:9, name:'Wall Pilates', origin:'📱 TikTok → Global', searches:'540K', pct:38, query:'pilates exercise wall workout' },
];

async function getUnsplashImage(query, key) {
  try {
    const url = 'https://api.unsplash.com/search/photos?query=' +
      encodeURIComponent(query) +
      '&per_page=1&orientation=landscape&client_id=' + key;

    const r = await fetch(url);
    if (!r.ok) {
      console.error('Unsplash error:', r.status, await r.text());
      return null;
    }
    const d = await r.json();
    return d.results?.[0]?.urls?.regular || null;
  } catch (e) {
    console.error('Unsplash fetch error:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json({ ...cache.data, fromCache: true });
  }

  const key = process.env.UNSPLASH_KEY;
  if (!key) {
    console.error('UNSPLASH_KEY not set');
    return res.status(200).json({
      recipes: RECIPES.map(r => ({ ...r, image: null })),
      workouts: WORKOUTS.map(w => ({ ...w, image: null })),
      updatedAt: new Date().toISOString(),
      debug: 'UNSPLASH_KEY missing'
    });
  }

  try {
    const recipes = [];
    for (const item of RECIPES) {
      const image = await getUnsplashImage(item.query, key);
      recipes.push({ ...item, image });
      console.log(item.name, '->', image ? 'OK' : 'null');
    }

    const workouts = [];
    for (const item of WORKOUTS) {
      const image = await getUnsplashImage(item.query, key);
      workouts.push({ ...item, image });
      console.log(item.name, '->', image ? 'OK' : 'null');
    }

    const result = { recipes, workouts, updatedAt: new Date().toISOString() };
    cache.data = result;
    cache.ts = Date.now();

    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(200).json({
      recipes: RECIPES.map(r => ({ ...r, image: null })),
      workouts: WORKOUTS.map(w => ({ ...w, image: null })),
      updatedAt: new Date().toISOString(),
      debug: err.message
    });
  }
}
