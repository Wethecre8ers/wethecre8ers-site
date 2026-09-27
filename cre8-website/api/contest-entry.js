// Vercel serverless function: POST /api/contest-entry
//
// Receives an entry from the gummy shark contest page and emails it to the
// shop owner via Resend (same account and approach as send-inquiry.js).

const NOTIFY_EMAIL = 'motiv8@wethecre8ers.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // swap for a verified wethecre8ers.com address once set up in Resend

// 11:59:59 PM Eastern on Oct 31, 2026 (Halloween). Keep in sync with CONTEST.endsAt in js/layout.js.
const CONTEST_ENDS_AT = Date.parse('2026-11-01T03:59:59Z');

const LIMITS = { name: 100, email: 200, favorite: 300, where: 300, comments: 1500 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (Date.now() >= CONTEST_ENDS_AT) {
      return res.status(410).json({ error: 'The contest has ended. Thanks for playing!' });
    }

    const body = req.body || {};

    // Bot traps: a hidden field real visitors never fill in, and a form that
    // was "submitted" faster than a person could. Pretend success so bots move on.
    if (body.website || Number(body.elapsed) < 2500) {
      return res.status(200).json({ sent: true });
    }

    const entry = {
      name: clean(body.name),
      email: clean(body.email),
      favorite: clean(body.favorite),
      where: clean(body.where),
      comments: clean(body.comments)
    };

    if (!entry.name || !entry.email || !entry.favorite || !entry.where) {
      return res.status(400).json({ error: 'Please fill in your name, email, favorite gummy sharks, and where you got them.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
      return res.status(400).json({ error: 'That email address doesn\'t look right. Check it and try again.' });
    }
    for (const key of Object.keys(LIMITS)) {
      if (entry[key].length > LIMITS[key]) {
        return res.status(400).json({ error: 'One of your answers is too long. Please shorten it and try again.' });
      }
    }
    if (body.agree !== true) {
      return res.status(400).json({ error: 'Please agree to the contest rules to enter.' });
    }

    const html = `
      <h2>New Gummy Shark Contest Entry — WeTheCre8ers</h2>
      <p><b>From:</b> ${escapeHtml(entry.name)} (${escapeHtml(entry.email)})</p>
      <p><b>Favorite tasting gummy sharks:</b><br>${escapeHtml(entry.favorite)}</p>
      <p><b>Where they got them:</b><br>${escapeHtml(entry.where)}</p>
      <p><b>Anything else:</b></p>
      <p style="white-space:pre-wrap;">${escapeHtml(entry.comments || '(nothing added)')}</p>
      <p style="color:#666;font-size:12px;">Agreed to the contest rules. Received ${new Date().toISOString()}.</p>
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
        reply_to: entry.email,
        subject: `Gummy shark contest entry from ${entry.name.replace(/[\r\n]+/g, ' ')}`,
        html
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend API error: ${resp.status} ${text}`);
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('contest-entry error:', err);
    return res.status(500).json({ error: 'Could not send your entry. Please try again.' });
  }
};

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
