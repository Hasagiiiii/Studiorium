const EMAIL_IN_TEXT = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function containsEmail(value) {
  return EMAIL_IN_TEXT.test(String(value || '').trim());
}

function safePublicName(...candidates) {
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (value && !containsEmail(value)) return value.slice(0, 100);
  }
  return 'Membro do Studiorium';
}

module.exports = { containsEmail, safePublicName };
