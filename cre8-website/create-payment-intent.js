// Vercel serverless function: POST /api/create-payment-intent
//
// Receives the cart (product ids + quantities) from the front end,
// looks up real prices from catalog.json (never trusts a price sent
// by the browser), calculates sales tax via Stripe Tax based on the
// shipping address, and creates a Stripe PaymentIntent for the full,
// tax-inclusive total. Returns a client secret that the front end
// uses to confirm the card payment directly with Stripe.
//
// IMPORTANT: Stripe Tax only charges tax in states you've told Stripe
// you're registered in (Stripe Dashboard → Tax → Registrations). If
// no registration matches the shipping state, tax_amount_exclusive
// comes back as 0 — so this is safe to leave on for every order.

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
    if (!shipping || !shipping.firstName || !shipping.address || !shipping.city || !shipping.state || !shipping.zip) {
      return res.status(400).json({ error: 'Shipping details are incomplete.' });
    }

    // Build tax-calculation line items from the trusted catalog
    const taxLineItems = [];
    let subtotal = 0;
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

    // Ask Stripe Tax to calculate the correct tax for this address.
    // If Stripe Tax isn't activated yet on this account (a real setup
    // step involving your business's tax registrations), fall back to
    // $0 tax rather than blocking checkout entirely — the moment Stripe
    // Tax is activated, this starts calculating real tax automatically.
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
          state: shipping.state,
          postal_code: shipping.zip,
          country: 'US'
        }
      },
      metadata: {
        // Handy for looking orders up in the Stripe dashboard later.
        // Shipping is duplicated here (not just in the `shipping` field
        // above) because metadata reliably persists and displays,
        // regardless of any edge cases with the `shipping` parameter.
        items: JSON.stringify(items).slice(0, 490),
        ship_name: `${shipping.firstName} ${shipping.lastName}`.slice(0, 490),
        ship_email: shipping.email.slice(0, 490),
        ship_address: shipping.address.slice(0, 490),
        ship_city: shipping.city.slice(0, 490),
        ship_state: shipping.state.slice(0, 490),
        ship_zip: shipping.zip.slice(0, 490),
        subtotal_cents: String(subtotal),
        shipping_cents: String(FLAT_SHIPPING_CENTS),
        tax_cents: String(taxAmount),
        ...(calculationId ? { tax_calculation_id: calculationId } : {})
      }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, amount, taxAmount, subtotal });
  } catch (err) {
    console.error('create-payment-intent error:', err);
    return res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
};
