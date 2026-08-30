// Vercel serverless function: POST /api/calculate-tax
//
// Used for a LIVE preview of tax while the customer is still filling in
// the checkout form — it calculates tax via Stripe Tax but does NOT
// create a PaymentIntent or charge anything. The actual charge (and a
// final, authoritative tax calculation) happens separately in
// create-payment-intent.js when the customer clicks Pay.
//
// Called once the customer finishes typing their ZIP code, not on every
// keystroke — Stripe Tax bills per calculation, so this keeps costs
// reasonable while still feeling instant to the customer.

const Stripe = require('stripe');
const catalog = require('./catalog.json');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const FLAT_SHIPPING_CENTS = 650; // keep in sync with create-payment-intent.js

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, shipping } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!shipping || !shipping.state || !shipping.zip) {
      return res.status(400).json({ error: 'Shipping state and ZIP are required.' });
    }

    const taxLineItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = catalog.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${item.productId}` });
      }
      const qty = Number(item.qty) || 0;
      if (qty <= 0) continue;
      const lineAmount = Math.round(product.price * 100) * qty;
      subtotal += lineAmount;
      taxLineItems.push({
        amount: lineAmount,
        reference: item.productId,
        tax_behavior: 'exclusive',
        tax_code: 'txcd_99999999'
      });
    }
    taxLineItems.push({
      amount: FLAT_SHIPPING_CENTS,
      reference: 'shipping',
      tax_behavior: 'exclusive',
      tax_code: 'txcd_92010001'
    });

    // If Stripe Tax isn't activated yet, fall back to $0 tax instead of
    // erroring — the front end just shows $0 until it's activated.
    let taxAmount = 0;
    let total = subtotal + FLAT_SHIPPING_CENTS;
    try {
      const calculation = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: taxLineItems,
        customer_details: {
          address: {
            line1: shipping.address || '',
            city: shipping.city || '',
            state: shipping.state,
            postal_code: shipping.zip,
            country: 'US'
          },
          address_source: 'shipping'
        }
      });
      taxAmount = calculation.tax_amount_exclusive;
      total = calculation.amount_total;
    } catch (taxErr) {
      console.error('Tax preview skipped (Stripe Tax not active yet):', taxErr.message);
    }

    return res.status(200).json({
      subtotal,
      shipping: FLAT_SHIPPING_CENTS,
      taxAmount,
      total
    });
  } catch (err) {
    console.error('calculate-tax error:', err);
    // Fail quietly for the preview — the real calculation still runs at
    // payment time, so a preview hiccup shouldn't block checkout.
    return res.status(500).json({ error: 'Could not calculate tax preview.' });
  }
};
