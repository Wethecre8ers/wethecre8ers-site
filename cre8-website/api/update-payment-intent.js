// Vercel serverless function: POST /api/update-payment-intent
//
// Stripe's Payment Element needs a PaymentIntent (and its client secret)
// to render, so one is created by create-payment-intent.js as soon as the
// customer finishes their shipping address. If they then change that
// address, this endpoint updates the amount, tax, and shipping on that
// SAME PaymentIntent — via stripe.paymentIntents.update — rather than
// creating a second one.
//
// Prices and tax are always re-derived server-side from the trusted
// catalog; a total sent by the browser is never used.
//
// Keep the pricing / tax logic below in sync with create-payment-intent.js.

const Stripe = require('stripe');
const catalog = require('./catalog.json');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const FLAT_SHIPPING_CENTS = 650; // keep in sync with create-payment-intent.js

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { paymentIntentId, items, shipping } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing payment reference.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!shipping || !shipping.firstName || !shipping.address || !shipping.city || !shipping.state || !shipping.zip || !shipping.email) {
      return res.status(400).json({ error: 'Shipping details are incomplete.' });
    }

    // Only touch an intent that's still waiting to be paid. If it's
    // already processing/succeeded, hand back what it was charged for.
    const existing = await stripe.paymentIntents.retrieve(paymentIntentId);
    const updatable = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
    if (!updatable.includes(existing.status)) {
      return res.status(200).json({
        amount: existing.amount,
        taxAmount: Number(existing.metadata?.tax_cents) || 0,
        subtotal: Number(existing.metadata?.subtotal_cents) || 0,
        locked: true
      });
    }

    // Build tax-calculation line items from the trusted catalog
    const taxLineItems = [];
    let subtotal = 0;
    const needsPhotoNames = [];
    for (const item of items) {
      const product = catalog.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${item.productId}` });
      }
      const qty = Number(item.qty) || 0;
      if (qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${item.productId}` });
      }
      const lineAmount = Math.round(product.price * 100) * qty;
      subtotal += lineAmount;
      if (product.needsPhoto) needsPhotoNames.push(product.name);
      taxLineItems.push({
        amount: lineAmount,
        reference: item.productId,
        tax_behavior: 'exclusive',
        tax_code: 'txcd_99999999' // general tangible goods — adjust per product if you need different tax treatment
      });
    }
    // Shipping is its own taxable line — many states tax shipping charges
    taxLineItems.push({
      amount: FLAT_SHIPPING_CENTS,
      reference: 'shipping',
      tax_behavior: 'exclusive',
      tax_code: 'txcd_92010001' // standard shipping tax code
    });

    // Ask Stripe Tax to recalculate for the new address. Same $0 fallback
    // as create-payment-intent.js if Stripe Tax isn't activated yet.
    let amount = subtotal + FLAT_SHIPPING_CENTS;
    let taxAmount = 0;
    let calculationId = null;
    try {
      const calculation = await stripe.tax.calculations.create({
        currency: 'usd',
        line_items: taxLineItems,
        customer_details: {
          address: {
            line1: shipping.address,
            city: shipping.city,
            state: shipping.state,
            postal_code: shipping.zip,
            country: 'US'
          },
          address_source: 'shipping'
        }
      });
      amount = calculation.amount_total; // subtotal + shipping + tax, in cents
      taxAmount = calculation.tax_amount_exclusive;
      calculationId = calculation.id;
    } catch (taxErr) {
      console.error('Stripe Tax calculation skipped (charging $0 tax):', taxErr.message);
    }

    const updated = await stripe.paymentIntents.update(paymentIntentId, {
      amount,
      receipt_email: shipping.email || undefined,
      shipping: {
        name: `${shipping.firstName} ${shipping.lastName}`,
        address: {
          line1: shipping.address,
          city: shipping.city,
          state: shipping.state,
          postal_code: shipping.zip,
          country: 'US'
        }
      },
      metadata: {
        // Same set of keys create-payment-intent.js writes, refreshed for
        // the new address. metadata updates merge, so this overwrites the
        // originals (including tax_calculation_id, which the webhook uses
        // to record the tax transaction).
        items: JSON.stringify(items).slice(0, 490),
        ship_name: `${shipping.firstName} ${shipping.lastName}`.slice(0, 490),
        ship_email: (shipping.email || '').slice(0, 490),
        ship_address: shipping.address.slice(0, 490),
        ship_city: shipping.city.slice(0, 490),
        ship_state: shipping.state.slice(0, 490),
        ship_zip: shipping.zip.slice(0, 490),
        subtotal_cents: String(subtotal),
        shipping_cents: String(FLAT_SHIPPING_CENTS),
        tax_cents: String(taxAmount),
        ...(calculationId ? { tax_calculation_id: calculationId } : {}),
        ...(needsPhotoNames.length ? { needs_photo: needsPhotoNames.join(', ').slice(0, 490) } : {})
      }
    });

    return res.status(200).json({ amount: updated.amount, taxAmount, subtotal });
  } catch (err) {
    console.error('update-payment-intent error:', err);
    return res.status(500).json({ error: 'Could not update payment. Please try again.' });
  }
};
