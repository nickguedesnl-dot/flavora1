export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { type, data } = req.body;
    if (type === 'payment' && data?.id) {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      const r = await fetch('https://api.mercadopago.com/v1/payments/' + data.id, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const payment = await r.json();
      if (payment.status === 'approved') {
        console.log('Pagamento aprovado:', payment.external_reference, payment.payer?.email);
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
