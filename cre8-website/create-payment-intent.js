// Vercel serverless function: POST /api/create-payment-intent
//
// Receives the cart (product ids + quantities) from the front end,
// looks up real prices from catalog.json (never trusts a price sent
// by the browser), and creates a Stripe PaymentIntent for the total.
// Returns a client secret that the front end uses to confirm the
// card payment directly with Stripe.

const Stripe = require('stripe');
const catalog = require('./catalog.json');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const FLAT_SHIPPING_CENTS = 650; // $6.50 — adjust or replace with real shipping logic

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, shipping } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!shipping || !shipping.firstName || !shipping.address || !shipping.city || !shipping.zip) {
      return res.status(400).json({ error: 'Shipping details are incomplete.' });
    }

    let amount = 0;
    for (const item of items) {
      const product = catalog.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${item.productId}` });
      }
      const qty = Number(item.qty) || 0;
      if (qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${item.productId}` });
      }
      amount += Math.round(product.price * 100) * qty;
    }
    amount += FLAT_SHIPPING_CENTS;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: shipping.email,
      shipping: {
        name: `${shipping.firstName} ${shipping.lastName}`,
        address: {
          line1: shipping.address,
          city: shipping.city,
          postal_code: shipping.zip,
          country: 'US'
        }
      },
      metadata: {
        // Handy for looking orders up in the Stripe dashboard later
        items: JSON.stringify(items).slice(0, 490)
      }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    console.error('create-payment-intent error:', err);
    return res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
};
