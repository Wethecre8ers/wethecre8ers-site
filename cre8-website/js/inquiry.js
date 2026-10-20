/* Contact / inquiry form handler — shared by index.html and contact.html.
   Posts to /api/send-inquiry. Expects the form's field ids: inqName,
   inqEmail, inqType, inqMessage, inquiryError, inquirySubmitBtn. */
async function handleInquiry(e){
  e.preventDefault();
  const btn = document.getElementById('inquirySubmitBtn');
  const errBox = document.getElementById('inquiryError');
  const payload = {
    name: document.getElementById('inqName').value.trim(),
    email: document.getElementById('inqEmail').value.trim(),
    type: document.getElementById('inqType').value,
    message: document.getElementById('inqMessage').value.trim()
  };
  if (!payload.name || !payload.email || !payload.message) {
    errBox.textContent = 'Please fill in your name, email, and a message.';
    return;
  }
  errBox.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const resp = await fetch('/api/send-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error((await resp.json()).error || 'Could not send your message.');
    showToast('Inquiry sent — we\'ll be in touch soon');
    e.target.reset();
  } catch (err) {
    errBox.textContent = err.message || 'Something went wrong. Please try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Inquiry';
  }
}
