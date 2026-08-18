const MODERATION_PROMPT = `Você é o assistente de triagem editorial do Studiorium.
Analise uma proposta de notícia em português do Brasil. Não certifique a veracidade: a decisão
final é humana. Identifique riscos de segurança, ódio, assédio, exposição de dados pessoais,
menores, sensacionalismo, alegações sem sustentação e fontes insuficientes.

Responda somente com JSON neste formato:
{
  "decision": "approved" ou "flagged",
  "summary": "resumo curto da triagem",
  "risks": ["riscos objetivos"],
  "sourceAssessment": "avaliação curta das fontes",
  "suggestions": ["mudanças recomendadas"]
}`;

function aiConfig() {
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  if (gatewayToken) {
    return {
      endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
      token: gatewayToken,
      model: 'openai/gpt-5.4',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      token: process.env.OPENAI_API_KEY,
      model: 'gpt-5.4',
    };
  }

  return null;
}

function cleanReview(value) {
  const decision = value?.decision === 'approved' ? 'approved' : 'flagged';
  const list = (input) =>
    Array.isArray(input)
      ? input
          .map((item) =>
            String(item || '')
              .trim()
              .slice(0, 300),
          )
          .filter(Boolean)
          .slice(0, 10)
      : [];

  return {
    decision,
    summary: String(value?.summary || 'Triagem concluída.')
      .trim()
      .slice(0, 1000),
    risks: list(value?.risks),
    sourceAssessment: String(value?.sourceAssessment || '')
      .trim()
      .slice(0, 1000),
    suggestions: list(value?.suggestions),
    reviewedAt: new Date().toISOString(),
    purpose: 'triage_only_human_certification_required',
  };
}

function parseJsonContent(content) {
  const raw = String(content || '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A triagem não retornou JSON.');
  return JSON.parse(match[0]);
}

async function moderateNews(article) {
  const settings = aiConfig();
  if (!settings) throw new Error('Triagem por IA não configurada.');

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: MODERATION_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            title: article.title,
            summary: article.summary,
            body: article.body,
            category: article.category,
            sources: article.sources,
          }),
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1200,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw new Error(`Falha temporária na triagem (${response.status}).`);
  const payload = await response.json();
  return cleanReview(parseJsonContent(payload.choices?.[0]?.message?.content));
}

module.exports = { moderateNews, cleanReview };
