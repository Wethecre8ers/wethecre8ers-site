// Vercel serverless function: POST /api/stripe-webhook
//
// Stripe calls this endpoint automatically whenever a payment event
// happens. We listen for "payment_intent.succeeded" and email an
// order notification to the shop owner via Resend (a simple email API).
//
// IMPORTANT: this function needs the raw, unparsed request body to
// verify that the request genuinely came from Stripe (not an
// impersonator) — so bodyParser is disabled below and we read the
// raw bytes ourselves.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const NOTIFY_EMAIL = 'motiv8@wethecre8ers.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend's reserved test sender — swap for a verified wethecre8ers.com address once set up in Resend

module.exports.config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    try {
      await sendOrderEmail(pi);
    } catch (err) {
      // Don't fail the webhook just because the email failed — Stripe
      // will retry the webhook otherwise, and the payment already
      // succeeded regardless of whether the email goes out.
      console.error('Failed to send order notification email:', err.message);
    }
    try {
      await recordTaxTransaction(pi);
    } catch (err) {
      // Same reasoning — a failed tax record shouldn't block the webhook.
      // But this one matters for your books, so it's worth checking these
      // logs occasionally if you're relying on Stripe Tax for filing.
      console.error('Failed to record tax transaction:', err.message);
    }
  }

  res.status(200).json({ received: true });
};

// Finalizes the earlier tax calculation into an official recorded
// transaction in Stripe Tax — this is what makes it show up correctly
// in Stripe's tax reporting/filing tools. Without this step, the tax
// was calculated and charged, but not "booked" for reporting purposes.
async function recordTaxTransaction(paymentIntent) {
  const calculationId = paymentIntent.metadata?.tax_calculation_id;
  if (!calculationId) return; // order predates the tax feature, nothing to record
  await stripe.tax.transactions.createFromCalculation({
    calculation: calculationId,
    reference: paymentIntent.id
  });
}

async function sendOrderEmail(paymentIntent) {
  const amount = (paymentIntent.amount / 100).toFixed(2);
  const meta = paymentIntent.metadata || {};
  const shipping = paymentIntent.shipping || {};
  const address = shipping.address || {};

  // Prefer metadata (reliably set and persisted) over the top-level
  // `shipping` field, which has been inconsistent in testing.
  const customerName = meta.ship_name || shipping.name || 'N/A';
  const customerEmail = meta.ship_email || paymentIntent.receipt_email || 'no email on file';
  const shipAddress = meta.ship_address || address.line1 || '';
  const shipCity = meta.ship_city || address.city || '';
  const shipState = meta.ship_state || address.state || '';
  const shipZip = meta.ship_zip || address.postal_code || '';
  const subtotalDisplay = meta.subtotal_cents ? `$${(Number(meta.subtotal_cents) / 100).toFixed(2)}` : 'N/A';
  const shippingDisplay = meta.shipping_cents ? `$${(Number(meta.shipping_cents) / 100).toFixed(2)}` : 'N/A';
  const taxDisplay = meta.tax_cents ? `$${(Number(meta.tax_cents) / 100).toFixed(2)}` : '$0.00';

  let items = [];
  try {
    items = JSON.parse(meta.items || '[]');
  } catch (_) { /* ignore parse issues, show raw below */ }

  const itemsHtml = items.length
    ? items.map(i => `<li>${i.qty} × ${i.productId} (${i.material || ''} ${i.color || ''})</li>`).join('')
    : '<li>(item details unavailable)</li>';

  const html = `
    <h2>New order — $${amount}</h2>
    <p><b>Customer:</b> ${customerName} (${customerEmail})</p>
    <p><b>Ship to:</b><br>
      ${shipAddress}<br>
      ${shipCity}, ${shipState} ${shipZip}
    </p>
    <p><b>Items:</b></p>
    <ul>${itemsHtml}</ul>
    <p><b>Subtotal:</b> ${subtotalDisplay} &nbsp; <b>Shipping:</b> ${shippingDisplay} &nbsp; <b>Tax:</b> ${taxDisplay}</p>
    <p style="color:#888;font-size:12px;">Stripe payment ID: ${paymentIntent.id}</p>
  `;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Cre8 order — $${amount}`,
      html
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend API error: ${resp.status} ${text}`);
  }
}
