const blockedPatterns = [
  /pornografia\s+infantil/i,
  /conte[uú]do\s+sexual\s+com\s+menor/i,
  /explorar\s+(uma\s+)?crian[cç]a/i,
  /aliciar\s+(uma\s+)?crian[cç]a/i,
  /amea[cç]ar\s+algu[eé]m/i,
  /vender\s+dados\s+pessoais/i,
];

function moderate(text) {
  const normalized = String(text || '').trim();
  if (!normalized)
    return { ok: false, category: 'vazio', message: 'O conteúdo não pode ficar vazio.' };
  if (normalized.length > 80_000)
    return { ok: false, category: 'limite', message: 'O texto ultrapassa o limite permitido.' };
  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      ok: false,
      category: 'risco',
      message: 'O conteúdo foi bloqueado e precisa de revisão.',
    };
  }
  return { ok: true, category: 'normal' };
}

module.exports = { moderate };
