// Vercel serverless function: POST /api/send-inquiry
//
// Receives the "Get in Touch" contact form submission and emails it to
// the shop owner via Resend. Uses the same Resend account already set
// up for order notifications (see stripe-webhook.js).

const NOTIFY_EMAIL = 'support@wethecre8ers.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // swap for a verified wethecre8ers.com address once set up in Resend

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, type, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const html = `
      <h2>New Inquiry — WeTheCre8ers</h2>
      <p><b>From:</b> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p><b>Type:</b> ${escapeHtml(type || 'Not specified')}</p>
      <p><b>Message:</b></p>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
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
        reply_to: email, // lets you hit "Reply" and answer the customer directly
        subject: `New Inquiry from ${name}`,
        html
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend API error: ${resp.status} ${text}`);
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('send-inquiry error:', err);
    return res.status(500).json({ error: 'Could not send your message. Please try again.' });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
