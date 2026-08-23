function escapeHtml(value: string): string {
  return String(value || '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character,
  );
}

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.STUDIORIUM_EMAIL_FROM);
}

export function passwordResetSiteUrl(): string {
  const explicit = String(process.env.STUDIORIUM_SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const productionHost = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (productionHost) return `https://${productionHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'https://studiorium.vercel.app';
}

function resetEmailHtml(resetUrl: string): string {
  const safeUrl = escapeHtml(resetUrl);
  return `
    <div style="background:#100e0c;padding:32px;font-family:Arial,sans-serif;color:#eee4d3">
      <div style="max-width:560px;margin:auto;border:1px solid #5f4a32;padding:28px">
        <p style="color:#c79b60;text-transform:uppercase;letter-spacing:.12em;font-size:12px">
          Lorion · Segurança
        </p>
        <h1 style="font-family:Georgia,serif;font-weight:500">Redefinir sua senha</h1>
        <p style="line-height:1.65;color:#c9bfaf">
          Recebemos uma solicitação para redefinir a senha da sua conta. O link vale por 30
          minutos e só pode ser usado uma vez.
        </p>
        <p style="margin:28px 0">
          <a href="${safeUrl}"
             style="background:#b89059;color:#100e0c;padding:13px 18px;text-decoration:none">
            Criar nova senha
          </a>
        </p>
        <p style="font-size:12px;line-height:1.6;color:#948a7a">
          Se você não pediu essa alteração, ignore este e-mail. Sua senha atual continuará válida.
        </p>
      </div>
    </div>`;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.STUDIORIUM_EMAIL_FROM;

  if (!isPasswordResetEmailConfigured() || !apiKey || !from) {
    const error = new Error('O envio de e-mail ainda não está configurado.');
    Object.assign(error, { code: 'EMAIL_NOT_CONFIGURED' });
    throw error;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: 'Redefina sua senha do Lorion',
      html: resetEmailHtml(input.resetUrl),
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const error = new Error('O provedor de e-mail não aceitou a mensagem.');
    Object.assign(error, { code: 'EMAIL_PROVIDER_ERROR', status: response.status });
    throw error;
  }
}
