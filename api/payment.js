export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return res.status(500).json({ error: 'MP_ACCESS_TOKEN not set' });

  try {
    const { plan } = req.body;
    const plans = {
      monthly: { title: 'Flavora Pro — Mensal', price: 35.00 },
      annual:  { title: 'Flavora Pro — Anual',  price: 350.00 },
    };
    const selected = plans[plan] || plans.monthly;
    const baseUrl = req.headers.origin || 'https://flavora1-nickguedesnl-2166s-projects.vercel.app';

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
      },
      body: JSON.stringify({
        items: [{
          title: selected.title,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: selected.price,
        }],
        back_urls: {
          success: baseUrl + '?payment=success&plan=' + plan,
          failure: baseUrl + '?payment=failure',
          pending: baseUrl + '?payment=pending',
        },
        auto_return: 'approved',
        external_reference: 'flavora_' + plan + '_' + Date.now(),
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'MP error' });

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
