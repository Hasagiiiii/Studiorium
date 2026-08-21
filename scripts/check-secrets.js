const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const allowedEnvFiles = new Set(['.env.example']);
const blockedEnvPattern = /(^|\/)\.env(?:\.|$)/;

const secretPatterns = [
  {
    label: 'chave secreta moderna do Supabase',
    pattern: /sb_secret_[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: 'service role do Supabase',
    pattern: /SUPABASE_(?:SERVICE_ROLE_KEY|SECRET_KEY)\s*=\s*eyJ[A-Za-z0-9._-]{20,}/gi,
  },
  {
    label: 'chave da Resend',
    pattern: /\bre_[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    label: 'token do GitHub',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  },
  {
    label: 'chave privada',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    label: 'chave de API da OpenAI',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    label: 'URL de banco com senha embutida',
    pattern: /(?:DATABASE_URL|POSTGRES_URL)\s*=\s*postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/gi,
  },
];

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function normalizedSource(source) {
  return source
    .replaceAll('sb_secret_COLE_SUA_CHAVE_SECRETA_AQUI', '')
    .replaceAll('re_...', '')
    .replaceAll('sk-proj-...', '');
}

function assertNoSecrets(source, location) {
  const normalized = normalizedSource(source);
  for (const { label, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) {
      throw new Error(
        `Possível ${label} detectada em ${location}. Remova e rotacione a credencial.`,
      );
    }
  }
}

const trackedFiles = git(['ls-files'])
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

for (const file of trackedFiles) {
  const basename = path.basename(file);
  if (blockedEnvPattern.test(file) && !allowedEnvFiles.has(basename)) {
    throw new Error(`Arquivo de ambiente não pode ser versionado: ${file}`);
  }

  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;

  const buffer = fs.readFileSync(fullPath);
  if (buffer.includes(0)) continue;
  assertNoSecrets(buffer.toString('utf8'), file);
}

let history = '';
try {
  history = git(['log', '-p', '--all', '--no-ext-diff', '--no-color']);
} catch {
  history = '';
}

if (history) assertNoSecrets(history, 'histórico Git disponível');

console.log(`OK — ${trackedFiles.length} arquivos rastreados verificados contra segredos.`);
