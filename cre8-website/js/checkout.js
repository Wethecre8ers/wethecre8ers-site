/* ============================================================
   STRIPE CONFIG — the backend now lives at /api on this same
   site, so BACKEND_URL is just a relative path. Only the
   publishable key needs to be filled in once you have it.
   See README.md for step-by-step setup.
   ============================================================ */
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51U9t0ERp3lZfQQuPKMYlgFbLskDdCjFQ7Uz7GSxYrd0z5796iiw9ZuostFJVw8OY3kLGHLViV9Peu3Dum8tLS7gv00x3nDpoyI';
const BACKEND_URL = '/api/create-payment-intent';
const STRIPE_CONFIGURED = !STRIPE_PUBLISHABLE_KEY.includes('REPLACE');
let stripeClient = null, stripeElements = null, paymentElement = null;
let paymentIntentId = null;           // current PaymentIntent, for in-place updates
let paymentIntentClientSecret = null; // needed to mount the Payment Element and confirm
let lastShippingKey = null;           // cart+address fingerprint of the last sync, to skip no-op updates
let syncingPaymentIntent = false;     // guard against overlapping create/update calls
if (STRIPE_CONFIGURED && window.Stripe) {
  stripeClient = Stripe(STRIPE_PUBLISHABLE_KEY);
}

/* ---------------- Checkout (Stripe Payment Element) ---------------- */
/*
  HOW THIS WORKS:
  - The SECRET key never lives here. The serverless functions in /api do
    everything that needs it: create-payment-intent.js and
    update-payment-intent.js build/adjust the PaymentIntent (with real
    Stripe Tax), and stripe-webhook.js emails the order + records tax.
  - As soon as the shipping address is complete, syncPaymentIntent()
    creates the PaymentIntent and mounts Stripe's Payment Element, which
    renders card, Apple Pay, Google Pay, and PayPal (whatever is enabled
    in the Stripe Dashboard and supported by the browser).
  - placeOrder() finishes with stripe.confirmPayment(); redirect methods
    (PayPal) come back to return_url and are picked up by
    handleCheckoutReturn() on the next page load.
  - If STRIPE_PUBLISHABLE_KEY isn't set, everything below falls back to a
    safe no-charge demo confirmation.
*/
function openCheckout(){
  if(cart.length===0) return;
  closeCart();
  const sub = cartTotal();
  const shipping = 6.5;
  const total = sub + shipping;
  const modal = document.getElementById('checkoutModal');
  modal.innerHTML = `
    <button class="modalClose" onclick="closeModal('checkoutModalOverlay')">&times;</button>
    <div class="checkoutGrid">
      <div class="coLeft">
        <div class="coStep">
          <h4><span class="n">1</span>Shipping Details</h4>
          <div class="fieldRow" style="margin-bottom:14px;">
            <div class="field"><label>First Name</label><input type="text" id="shipFirstName" required></div>
            <div class="field"><label>Last Name</label><input type="text" id="shipLastName" required></div>
          </div>
          <div class="field" style="margin-bottom:14px;"><label>Email</label><input type="email" id="shipEmail" required></div>
          <div class="field" style="margin-bottom:14px;"><label>Shipping Address</label><input type="text" id="shipAddress" required placeholder="Street address"></div>
          <div class="fieldRow">
            <div class="field"><label>City</label><input type="text" id="shipCity" required></div>
            <div class="field"><label>State</label><input type="text" id="shipState" required placeholder="e.g. FL" maxlength="2" style="text-transform:uppercase;"></div>
          </div>
          <div class="field" style="margin-bottom:14px;"><label>ZIP</label><input type="text" id="shipZip" required></div>
        </div>
        <div class="coStep">
          <h4><span class="n">2</span>Payment</h4>
          <div id="payment-element" style="min-height:44px;"></div>
          <div id="payment-placeholder" style="font-size:12.5px; color:var(--silver); padding:12px 0; line-height:1.6;">Enter your shipping address above to choose a payment method — Apple&nbsp;Pay, Google&nbsp;Pay, PayPal, or card.</div>
          <div id="payment-errors" style="color:#e07a5f; font-size:12.5px; min-height:16px; margin-top:6px;"></div>
          <div class="stripeMark">${STRIPE_CONFIGURED ? 'Secured by Stripe' : 'Stripe not connected yet — see note below'}</div>
        </div>
      </div>
      <div class="coRight">
        <h4 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin:0 0 18px;">Order Summary</h4>
        ${cart.map(c=>{
          const p = PRODUCTS.find(x=>x.id===c.productId);
          const variant = c.material === 'As-is' ? 'Ships as shown' : `${c.material} · ${c.color}`;
          const olThumb = p.images && p.images.length ? `<img src="${p.images[0]}" alt="${p.name}">` : ICONS[p.icon];
          return `<div class="orderLine"><span class="olItem"><span class="olThumb">${olThumb}</span><span>${p.name}<br><span style="font-size:11.5px;">${variant} × ${c.qty}</span></span></span><b>${money(p.price*c.qty)}</b></div>`;
        }).join('')}
        <div class="orderLine"><span>Subtotal</span><b>${money(sub)}</b></div>
        <div class="orderLine"><span>Shipping</span><b>${money(shipping)}</b></div>
        <div class="orderLine" id="taxLine"><span>Tax</span><b id="taxAmount" style="color:var(--silver);">calculated at payment</b></div>
        <div class="orderLine" id="totalLine" style="border-bottom:none; font-size:16px; padding-top:16px;"><span style="color:var(--white);">Total</span><b id="totalAmount" style="color:var(--gold);">${money(total)}+ tax</b></div>
        <button class="btn btn-gold btn-block" style="margin-top:22px;" id="payBtn" onclick="placeOrder()">Pay</button>
        ${STRIPE_CONFIGURED ? '' : `<p style="font-size:11px; color:var(--silver); margin-top:14px; line-height:1.6;">This checkout is wired for real Stripe payments, but the site hasn't been connected to a live Stripe account yet. Add your publishable key and backend URL near the top of the script, and deploy the included backend — see /backend/README.md. Until then, this button runs a safe demo flow with no charge.</p>`}
      </div>
    </div>
  `;
  openModal('checkoutModalOverlay');
  window._checkoutSubtotal = sub;
  window._checkoutShipping = shipping;

  // Each time checkout opens we start a fresh PaymentIntent — clear any
  // Payment Element / intent left over from a previous open.
  resetPaymentState();

  const payBtn = document.getElementById('payBtn');
  if (!STRIPE_CONFIGURED) {
    // Demo mode (no Stripe keys) — the Pay button runs the safe no-charge
    // confirmation flow in placeOrder().
    payBtn.disabled = false;
    payBtn.textContent = 'Pay';
  } else {
    // The Payment Element can't render until a PaymentIntent exists, and
    // that needs the shipping address — so Pay stays disabled until the
    // address is filled in and syncPaymentIntent() has run.
    payBtn.disabled = true;
    payBtn.textContent = 'Enter shipping details';
  }

  // Finishing State or ZIP is the trigger to preview tax and, once the
  // whole address is present, create/update the PaymentIntent and mount
  // the Payment Element (Apple Pay / Google Pay / PayPal / card).
  const onAddressBlur = () => syncPaymentIntent();
  document.getElementById('shipState').addEventListener('blur', onAddressBlur);
  document.getElementById('shipZip').addEventListener('blur', onAddressBlur);
}

async function previewTax(){
  if (!STRIPE_CONFIGURED) return;
  if (paymentIntentId) return; // a PaymentIntent exists — syncPaymentIntent() owns the totals now
  const state = checkoutFieldVal('shipState');
  const zip = checkoutFieldVal('shipZip');
  const address = checkoutFieldVal('shipAddress');
  const city = checkoutFieldVal('shipCity');
  if (!state || !zip) return; // wait until both are filled in

  const taxAmountEl = document.getElementById('taxAmount');
  const totalAmountEl = document.getElementById('totalAmount');
  taxAmountEl.textContent = 'calculating…';

  try {
    const resp = await fetch(BACKEND_URL.replace('create-payment-intent', 'calculate-tax'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, shipping: { state, zip, address, city } })
    });
    if (!resp.ok) throw new Error('preview failed');
    const { taxAmount, total } = await resp.json();
    taxAmountEl.textContent = money(taxAmount / 100);
    taxAmountEl.style.color = 'var(--ivory)';
    totalAmountEl.textContent = money(total / 100);
  } catch (err) {
    // Silent fail on the preview — the real calculation still runs at
    // payment time, so this is just a nice-to-have, not required.
    taxAmountEl.textContent = 'calculated at payment';
  }
}

/* Reset Payment Element / PaymentIntent state for a fresh checkout. */
function resetPaymentState(){
  if (paymentElement) { try { paymentElement.unmount(); } catch (_) {} }
  paymentElement = null;
  stripeElements = null;
  paymentIntentId = null;
  paymentIntentClientSecret = null;
  lastShippingKey = null;
  syncingPaymentIntent = false;
  window._checkoutTotalCents = 0;
}

function checkoutFieldVal(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function readShippingForm(){
  return {
    firstName: checkoutFieldVal('shipFirstName'),
    lastName:  checkoutFieldVal('shipLastName'),
    email:     checkoutFieldVal('shipEmail'),
    address:   checkoutFieldVal('shipAddress'),
    city:      checkoutFieldVal('shipCity'),
    state:     checkoutFieldVal('shipState'),
    zip:       checkoutFieldVal('shipZip')
  };
}
function shippingComplete(s){
  return !!(s.firstName && s.lastName && s.email && s.address && s.city && s.state && s.zip);
}

/* Push the latest tax + total into the order summary and the Pay button. */
function updateCheckoutTotals(amountCents, taxCents){
  window._checkoutTotalCents = amountCents;
  const taxEl = document.getElementById('taxAmount');
  const totalEl = document.getElementById('totalAmount');
  if (taxEl){ taxEl.textContent = money(taxCents / 100); taxEl.style.color = 'var(--ivory)'; }
  if (totalEl){ totalEl.textContent = money(amountCents / 100); }
  const payBtn = document.getElementById('payBtn');
  if (payBtn && !payBtn.disabled) payBtn.textContent = `Pay ${money(amountCents / 100)}`;
}

/* Create the PaymentIntent for the current cart + shipping address (and
   mount the Payment Element), or update it in place if it already exists
   and the address changed. Called when the customer finishes State / ZIP,
   and once more just before payment so the charged amount always matches
   what's on screen. */
async function syncPaymentIntent(){
  if (!STRIPE_CONFIGURED || !stripeClient) return;

  const shipping = readShippingForm();
  if (!shipping.state || !shipping.zip) return;

  // Not enough yet for a PaymentIntent (needs the whole address) — fall
  // back to the tax-only preview so the number still updates.
  if (!shippingComplete(shipping)) { previewTax(); return; }

  const key = JSON.stringify({ items: cart, shipping });
  if (key === lastShippingKey && paymentIntentId) return; // nothing changed
  if (syncingPaymentIntent) return;
  syncingPaymentIntent = true;

  const taxEl = document.getElementById('taxAmount');
  if (taxEl) taxEl.textContent = 'calculating…';

  try {
    if (!paymentIntentId) {
      // First time — create the PaymentIntent and mount the Payment Element.
      const resp = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, shipping })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Could not start payment.');
      const data = await resp.json();
      paymentIntentClientSecret = data.clientSecret;
      paymentIntentId = data.paymentIntentId || null;
      lastShippingKey = key;
      mountPaymentElement(data.clientSecret);
      updateCheckoutTotals(data.amount, data.taxAmount);
    } else {
      // Address changed after the intent existed — update it in place
      // rather than creating a duplicate.
      const resp = await fetch(BACKEND_URL.replace('create-payment-intent', 'update-payment-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, items: cart, shipping })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Could not update payment.');
      const data = await resp.json();
      lastShippingKey = key;
      if (stripeElements) { try { await stripeElements.fetchUpdates(); } catch (_) {} }
      updateCheckoutTotals(data.amount, data.taxAmount);
    }
  } catch (err) {
    // Non-fatal: the authoritative amount is recalculated at payment time,
    // so a hiccup here shouldn't block checkout.
    if (taxEl) taxEl.textContent = 'calculated at payment';
  } finally {
    syncingPaymentIntent = false;
  }
}

/* Mount Stripe's Payment Element — it renders whichever methods are
   enabled in the Stripe Dashboard and supported by this browser: Apple
   Pay, Google Pay, PayPal, and card. */
function mountPaymentElement(clientSecret){
  stripeElements = stripeClient.elements({
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#C8953D',
        colorBackground: '#1c1c1e',
        colorText: '#F5F1E8',
        colorDanger: '#e07a5f',
        fontFamily: 'Montserrat, sans-serif',
        borderRadius: '4px'
      }
    }
  });
  // Name and email are collected in the Shipping Details form above, so
  // hide them here — they're passed in at confirmPayment() instead.
  paymentElement = stripeElements.create('payment', {
    layout: 'tabs',
    fields: { billingDetails: { name: 'never', email: 'never' } }
  });
  paymentElement.mount('#payment-element');
  paymentElement.on('change', () => {
    const errBox = document.getElementById('payment-errors');
    if (errBox) errBox.textContent = '';
  });

  const placeholder = document.getElementById('payment-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = false;
  payBtn.textContent = window._checkoutTotalCents ? `Pay ${money(window._checkoutTotalCents / 100)}` : 'Pay';
}

/* Shared success handling for inline payments (card / Apple Pay / Google
   Pay) and for redirect returns (PayPal). */
function completeOrder(paymentIntent){
  let pending = {};
  try { pending = JSON.parse(sessionStorage.getItem('cre8_pending_order') || '{}'); } catch (_) {}
  sessionStorage.removeItem('cre8_pending_order');
  sessionStorage.removeItem('cre8_pending_cart');

  const amountCents = (paymentIntent && paymentIntent.amount) || pending.totalCents || window._checkoutTotalCents || 0;
  const processing = paymentIntent && paymentIntent.status === 'processing';
  let msg = `Payment ${processing ? 'is processing' : 'confirmed'} — a receipt has been sent to your email. Order total: ${money(amountCents / 100)} (including tax).`;

  const photoNames = (pending.needsPhotoNames && pending.needsPhotoNames.length)
    ? pending.needsPhotoNames
    : cart.filter(c => PRODUCTS.find(p => p.id === c.productId)?.needsPhoto)
          .map(c => PRODUCTS.find(p => p.id === c.productId).name);
  if (photoNames.length) {
    msg += ` One more step: please email the details we need for ${photoNames.join(', ')} to support@wethecre8ers.com along with this order confirmation.`;
  }
  showThankYou(msg);
}

/* When a redirect payment method (PayPal) sends the customer back, Stripe
   appends the PaymentIntent details to the URL. Check its status on load
   and show the right screen. */
async function handleCheckoutReturn(){
  const params = new URLSearchParams(window.location.search);
  const clientSecret = params.get('payment_intent_client_secret');
  if (!clientSecret || !STRIPE_CONFIGURED || !stripeClient) return;

  // Clean the query string so a refresh doesn't re-trigger this.
  window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);

  let paymentIntent;
  try {
    ({ paymentIntent } = await stripeClient.retrievePaymentIntent(clientSecret));
  } catch (_) { return; }
  if (!paymentIntent) return;

  if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
    openModal('checkoutModalOverlay');
    completeOrder(paymentIntent);
    cart = [];
    updateCartUI();
  } else {
    // Payment didn't go through (e.g. cancelled at PayPal) — restore the
    // cart stashed before the redirect and reopen checkout.
    try {
      const savedCart = JSON.parse(sessionStorage.getItem('cre8_pending_cart') || 'null');
      if (Array.isArray(savedCart) && savedCart.length) { cart = savedCart; updateCartUI(); }
    } catch (_) {}
    sessionStorage.removeItem('cre8_pending_order');
    sessionStorage.removeItem('cre8_pending_cart');
    if (cart.length) {
      openCheckout();
      const errBox = document.getElementById('payment-errors');
      if (errBox) errBox.textContent = 'Your payment was not completed. Please try again.';
    }
  }
}

async function placeOrder(){
  const payBtn = document.getElementById('payBtn');
  const errBox = document.getElementById('payment-errors');

  // Gather shipping details the customer typed in
  const shipping = readShippingForm();
  if (!shippingComplete(shipping)) {
    errBox.textContent = 'Please fill in all shipping fields before paying.';
    return;
  }

  // Demo fallback — used until STRIPE_PUBLISHABLE_KEY / BACKEND_URL are configured
  if (!STRIPE_CONFIGURED) {
    showThankYou('This is a demo confirmation — no payment was actually processed. Connect Stripe (see the note below the Pay button) to accept real payments.');
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = 'Processing…';
  errBox.textContent = '';

  const resetPayBtn = () => {
    payBtn.disabled = false;
    payBtn.textContent = window._checkoutTotalCents ? `Pay ${money(window._checkoutTotalCents / 100)}` : 'Pay';
  };

  // Stripe requires elements.submit() before stripe.confirmPayment(), and
  // it has to run before any other async work (creating/updating the
  // PaymentIntent, confirming). It validates the Payment Element and
  // gathers the payment details up front — if it fails, show the error
  // and stop, same as any other checkout error.
  if (!stripeElements) {
    errBox.textContent = 'Add your shipping address so a payment method can load, then try again.';
    resetPayBtn();
    return;
  }
  const { error: submitError } = await stripeElements.submit();
  if (submitError) {
    errBox.textContent = submitError.message || 'Please check your payment details and try again.';
    resetPayBtn();
    return;
  }

  try {
    // 1. Make sure a PaymentIntent exists and its amount matches the
    //    current cart + address (creates it if the customer clicked Pay
    //    before the blur handler ran; updates it if they changed the
    //    address). Tax and prices are always re-derived server-side from a
    //    trusted catalog — a total sent from the browser is never used.
    await syncPaymentIntent();
    if (!paymentIntentClientSecret || !stripeElements) {
      throw new Error('Could not start payment. Please check your shipping details and try again.');
    }

    const amountCents = window._checkoutTotalCents || 0;
    payBtn.textContent = amountCents ? `Processing ${money(amountCents / 100)}…` : 'Processing…';

    // Stash what's needed to finish the order if this payment method sends
    // the customer off-site (PayPal) and brings them back on a fresh page.
    const needsPhotoNames = cart
      .filter(c => PRODUCTS.find(p => p.id === c.productId)?.needsPhoto)
      .map(c => PRODUCTS.find(p => p.id === c.productId).name);
    try {
      sessionStorage.setItem('cre8_pending_order', JSON.stringify({ needsPhotoNames, totalCents: amountCents }));
      sessionStorage.setItem('cre8_pending_cart', JSON.stringify(cart));
    } catch (_) {}

    // 2. Confirm with the Payment Element. `redirect: 'if_required'` keeps
    //    card / Apple Pay / Google Pay inline and only redirects for
    //    methods that need it (PayPal), which return to return_url.
    const { error, paymentIntent } = await stripeClient.confirmPayment({
      elements: stripeElements,
      clientSecret: paymentIntentClientSecret,
      confirmParams: {
        return_url: window.location.origin + window.location.pathname,
        payment_method_data: {
          billing_details: {
            name: `${shipping.firstName} ${shipping.lastName}`,
            email: shipping.email
          }
        }
      },
      redirect: 'if_required'
    });

    if (error) {
      errBox.textContent = error.message || 'Payment could not be completed.';
      resetPayBtn();
      sessionStorage.removeItem('cre8_pending_order');
      sessionStorage.removeItem('cre8_pending_cart');
      return;
    }

    // No redirect happened — the payment finished right here.
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      completeOrder(paymentIntent);
    }
  } catch (err) {
    errBox.textContent = err.message || 'Something went wrong. Please try again.';
    resetPayBtn();
  }
}

function showThankYou(message){
  const modal = document.getElementById('checkoutModal');
  modal.innerHTML = `
    <button class="modalClose" onclick="closeModal('checkoutModalOverlay')">&times;</button>
    <div class="thankYou">
      <svg viewBox="0 0 24 24" fill="none" stroke="#C8953D" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
      <h3>Order Received</h3>
      <p>${message}</p>
      <button class="btn btn-gold" onclick="closeThankYou()">Close</button>
    </div>
  `;
}
function closeThankYou(){
  cart = [];
  updateCartUI();
  closeModal('checkoutModalOverlay');
  showToast('Order complete — cart cleared');
}
