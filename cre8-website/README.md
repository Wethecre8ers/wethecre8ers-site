# WeTheCre8ers / Cre8 Website — Setup Guide

This is a single project containing both the storefront (`index.html`) and
the small backend it needs to accept real Stripe payments (the `api/`
folder). Deploying this one folder to Vercel puts both live at once, on the
same domain — no separate backend project to manage.

You do not need to write any code to deploy this — just follow the steps
below. It should take about 20–30 minutes the first time, including your
domain.

## 1. Create a Stripe account

1. Go to https://dashboard.stripe.com/register and create an account.
2. Make sure you're in **Test mode** (toggle top right) while setting up —
   this lets you test with fake cards before taking real payments.
3. Go to **Developers → API keys**. You'll see:
   - **Publishable key** (starts `pk_test_...`) — goes in the website code.
   - **Secret key** (starts `sk_test_...`) — never goes in the website;
     only in Vercel's environment variables (step 3 below).

## 2. Get this project onto Vercel

The simplest path:
1. Create a free GitHub account if you don't have one, and a new repository
   (e.g. `wethecre8ers-site`).
2. Upload everything in this folder (`index.html`, the `api/` folder, and
   `package.json`) to that repository.
3. Go to https://vercel.com, sign up (signing in with GitHub is easiest),
   click **Add New → Project**, and import that repository.
4. Vercel will detect `index.html` as your site and the `api/` folder as
   serverless functions automatically — no configuration needed.

(If you'd rather skip GitHub, I can walk you through the Vercel CLI instead,
which deploys straight from your computer.)

## 3. Add your Stripe secret key

In your new Vercel project: **Settings → Environment Variables**, add:
- Name: `STRIPE_SECRET_KEY`
- Value: your `sk_test_...` key from step 1

Redeploy after adding it (Vercel usually prompts you to).

## 4. Connect the site to Stripe

Open `index.html`, find this near the top of the `<script>` section:

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY';
```

Replace it with your real `pk_test_...` key. `BACKEND_URL` is already set
correctly (`/api/create-payment-intent`) since everything lives on the same
domain now. Save, and redeploy (or just re-upload to GitHub — Vercel
redeploys automatically on a new commit).

## 5. Test it

On your live Vercel URL (something like `wethecre8ers.vercel.app`), add an
item to cart and check out with a Stripe test card:

- Card number: `4242 4242 4242 4242`
- Any future expiry date, any 3-digit CVC, any ZIP

Confirm the payment shows up in your Stripe dashboard under **Payments**.

## 6. Point wethecre8ers.com at it

You own the domain through GoDaddy — you don't need to move it, just point
it at Vercel:

1. In the Vercel project, go to **Settings → Domains**, add `wethecre8ers.com`.
2. Vercel shows you the exact DNS records needed (usually an A record for
   the root domain and a CNAME for `www`).
3. In GoDaddy: **My Products → your domain → DNS → Manage DNS**, replace the
   default parked A record with Vercel's, and add the CNAME for `www`
   pointing to `cname.vercel-dns.com`.
4. DNS changes typically take a few minutes to a few hours to propagate.
   Vercel's Domains page shows a green checkmark once it's live.
5. Vercel automatically issues a free SSL certificate — no extra steps for
   `https://`.

## 7. Go live with real payments

1. In Stripe, switch from Test mode to **Live mode** and copy your live
   `pk_live_...` and `sk_live_...` keys.
2. Update `STRIPE_PUBLISHABLE_KEY` in `index.html` with the live publishable
   key, and redeploy.
3. Update the `STRIPE_SECRET_KEY` environment variable in Vercel with the
   live secret key, and redeploy again.

## Where the money goes

Stripe deposits payments directly into your Stripe balance, then pays out
to a bank account you connect in Stripe under **Settings → Bank accounts
and scheduling** (default payout schedule is every 2 business days for most
US accounts). Stripe deducts its processing fee (2.9% + $0.30 per
successful US card charge, standard pricing — worth double-checking current
rates) before the payout. Vercel and GitHub never touch the money — they
only host the code.

## Where orders actually go

When a customer completes checkout, everything about that order lands in one
place: **your Stripe Dashboard, under Payments.** Click into any payment and
you'll see:
- The amount charged and card used
- The customer's shipping name, address, city, and ZIP
- Which products, quantities, materials, and colors they ordered (attached
  as order details on the payment)
- Their email (used for Stripe's automatic email receipt)

There's no separate "orders" database — Stripe's dashboard is your permanent
order record. Once the notification setup below is turned on, you'll also
get an email the moment each order comes in, so you don't have to check
Stripe manually.

## Order notifications by email

A webhook (`api/stripe-webhook.js`) emails **support@wethecre8ers.com** the
moment a payment succeeds, with the customer's shipping info and what they
ordered — so you don't have to check Stripe manually. Here's how to turn it on:

### 1. Create a free Resend account (the email-sending service)

1. Go to https://resend.com and sign up (free tier covers this easily).
2. Go to **API Keys**, create one, and copy it.

### 2. Add the Resend key to Vercel

In your Vercel project: **Settings → Environment → Production**, add:
- Name: `RESEND_API_KEY`
- Value: the key you just copied

### 3. Register the webhook with Stripe

1. In the Stripe dashboard, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://wethecre8ers.com/api/stripe-webhook`
3. Select the event: `payment_intent.succeeded`
4. Click **Add endpoint**. Stripe will show you a **Signing secret**
   (starts with `whsec_...`) — copy it.

### 4. Add the webhook secret to Vercel

Same place as before (**Settings → Environment → Production**), add:
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: the `whsec_...` secret from step 3

### 5. Redeploy and test

Redeploy the project (Deployments → "..." → Redeploy), then place a test
order with card `4242 4242 4242 4242`. Within a few seconds, an order
notification email should land at support@wethecre8ers.com.

**Note on the "from" address:** emails currently send from
`orders@resend.dev` (Resend's shared testing address), which works
immediately with no setup — but looks less polished than your own domain.
Once you're ready, you can verify `wethecre8ers.com` with Resend (a couple
more DNS records in GoDaddy) and the sender can switch to something like
`orders@wethecre8ers.com`.

## Sales tax

Checkout now calculates real sales tax via **Stripe Tax**, based on the
shipping address, and includes it in the final charge. It only charges tax
in states you tell Stripe you're registered to collect in — for every other
state, tax comes back as $0 automatically, so this is safe to leave on.

**One-time setup in Stripe:**
1. In the Stripe dashboard, go to **Tax → Registrations**.
2. Add each state you're actually registered to collect sales tax in (this
   is a real legal registration with that state, not just a dashboard
   toggle — check with an accountant if you're not sure which states apply
   to you).
3. That's it — no code changes needed when you add or remove a state later.

Successful orders are also automatically "recorded" in Stripe Tax
(`stripe.tax.transactions.createFromCalculation`), which is what feeds
Stripe's tax reporting/filing tools if you use them.

## Payment methods (Apple Pay, Google Pay, PayPal)

Checkout uses Stripe's **Payment Element**, which automatically shows
whichever methods are turned on in your Stripe Dashboard and supported by
the shopper's device — card, Apple Pay, Google Pay, and PayPal. Because
that element needs a live PaymentIntent to render, checkout creates the
PaymentIntent as soon as the shipping address is complete (the same
moment the tax preview runs), and updates that same intent if the address
changes (`api/update-payment-intent.js`).

**One-time setup in Stripe:**

1. **PayPal:** Dashboard → Settings → Payment methods → enable **PayPal**.
   (Card, Apple Pay, and Google Pay are on by default.)
2. **Apple Pay domain:** Dashboard → Settings → Payment methods → Apple Pay
   → **Add new domain**, and add `wethecre8ers.com`. If Stripe hands you a
   verification file to host, put it in the repo at
   `cre8-website/.well-known/apple-developer-merchantid-domain-association`
   (Vercel serves it at the domain root automatically) and redeploy.
3. No code changes are needed — methods appear as you enable them.

Apple Pay and Google Pay only render over HTTPS on a supporting
device/browser, so you won't see them on `localhost` — test wallets on the
deployed Vercel URL.

## Keeping prices in sync

`api/catalog.json` is a second copy of your product prices, used only to
verify charges server-side (so a customer's browser can never pay less than
it should). **If you change a price or add a product in `index.html`'s
`PRODUCTS` list, update `api/catalog.json` too** — otherwise checkout will
fail for anything missing, or charge the old price for anything out of sync.

## Still separate: the contact form

The inquiry form on the site doesn't send anywhere yet — that's a small,
separate piece (e.g. connecting it to Formspree) whenever you're ready for it.
