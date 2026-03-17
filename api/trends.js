const cache = { data: null, ts: 0 };
const TTL = 24 * 60 * 60 * 1000;

const RECIPES = [
  { rank:1, name:'Hot Honey Pasta', origin:'🇺🇸 USA → Global', searches:'2.4M', pct:98 },
  { rank:2, name:'Cottage Cheese Recipes', origin:'🌍 Global', searches:'1.8M', pct:85 },
  { rank:3, name:'Sleepy Girl Mocktail', origin:'🇺🇸 TikTok', searches:'980K', pct:72 },
  { rank:4, name:'Marry Me Chicken', origin:'🇮🇹 Italy-inspired', searches:'1.2M', pct:78 },
  { rank:5, name:'Dubai Pistachio Chocolate', origin:'🇦🇪 UAE → Global', searches:'860K', pct:65 },
  { rank:6, name:'Baked Oats', origin:'🇬🇧 UK → Global', searches:'720K', pct:58 },
  { rank:7, name:'Birria Tacos', origin:'🇲🇽 Mexico → Global', searches:'650K', pct:52 },
  { rank:8, name:'Gut Health Bowl', origin:'🌍 Wellness', searches:'590K', pct:48 },
  { rank:9, name:'Japanese Breakfast Bowl', origin:'🇯🇵 Japan → Global', searches:'480K', pct:40 },
];

const WORKOUTS = [
  { rank:1, name:'Hot Girl Walk', origin:'🇺🇸 TikTok → Global', searches:'3.1M', pct:97 },
  { rank:2, name:'75 Hard Challenge', origin:'🇺🇸 USA → Global', searches:'2.2M', pct:88 },
  { rank:3, name:'Reformer Pilates', origin:'🌍 Global', searches:'1.9M', pct:82 },
  { rank:4, name:'Zone 2 Cardio', origin:'🔬 Science-backed', searches:'1.4M', pct:74 },
  { rank:5, name:'Couch to 5K', origin:'🇬🇧 UK → Global', searches:'1.1M', pct:68 },
  { rank:6, name:'Rucking', origin:'🪖 Military → Mainstream', searches:'890K', pct:60 },
  { rank:7, name:'Somatic Workouts', origin:'🧘 Wellness Trend', searches:'740K', pct:53 },
  { rank:8, name:'Dance Fitness', origin:'💃 TikTok → Global', searches:'620K', pct:45 },
  { rank:9, name:'Wall Pilates', origin:'📱 TikTok → Global', searches:'540K', pct:38 },
];

async function getImage(query, key, cx) {
  try {
    const r = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1&safe=active`);
    const d = await r.json();
    return d.items?.[0]?.link || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json(cache.data);
  }

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  try {
    let recipes = RECIPES.map(r => ({ ...r, image: null }));
    let workouts = WORKOUTS.map(w => ({ ...w, image: null }));

    if (key && cx) {
      const [ri, wi] = await Promise.all([
        Promise.all(RECIPES.map(r => getImage(r.name + ' food photo', key, cx))),
        Promise.all(WORKOUTS.map(w => getImage(w.name + ' fitness workout photo', key, cx))),
      ]);
      recipes = RECIPES.map((r, i) => ({ ...r, image: ri[i] }));
      workouts = WORKOUTS.map((w, i) => ({ ...w, image: wi[i] }));
    }

    const result = { recipes, workouts, updatedAt: new Date().toISOString() };
    cache.data = result;
    cache.ts = Date.now();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ recipes: RECIPES, workouts: WORKOUTS, updatedAt: new Date().toISOString() });
  }
}
