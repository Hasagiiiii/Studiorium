const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'vercel.json',
  'api/index.js',
  'src/server/router.js',
  'src/server/db.js',
  'src/server/auth.js',
  'public/index.html',
  'public/style.css',
  'public/js/main.js',
  'public/js/runtime.js',
  'public/js/router.js',
  'public/js/views.js',
  'public/js/events.js',
  'supabase/schema.sql',
  'supabase/seed.sql',
  'supabase/upgrade-v2.7-security-events.sql',
  '.prettierrc.json',
  '.env.example',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Arquivo obrigatório ausente: ${rel}`);
}

function walkFiles(dir, extensions) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, extensions));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

const serverFiles = walkFiles(path.join(root, 'src/server'), new Set(['.js']));
serverFiles.push(path.join(root, 'api/index.js'));
for (const file of serverFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

const publicJs = walkFiles(path.join(root, 'public/js'), new Set(['.js']));
for (const file of publicJs) {
  const source = fs.readFileSync(file, 'utf8');
  execFileSync(process.execPath, ['--input-type=module', '--check'], {
    input: source,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

const scanFiles = [...serverFiles, ...publicJs, path.join(root, 'public/index.html')];
const readableFiles = walkFiles(path.join(root, 'public'), new Set(['.js', '.css', '.html']));
const maintenanceFiles = [
  ...walkFiles(path.join(root, 'scripts'), new Set(['.js'])),
  ...walkFiles(path.join(root, 'tests'), new Set(['.js'])),
];
const databaseFiles = walkFiles(path.join(root, 'supabase'), new Set(['.sql'])).filter(
  (file) => path.basename(file) !== 'seed.sql',
);
const forbidden = [
  [/server\.listen\s*\(/i, 'servidor HTTP persistente no aplicativo'],
  [/STUDIORIUM_DB/i, 'configuração de banco em arquivo'],
  [/STUDIORIUM_UPLOAD_DIR/i, 'configuração de uploads em disco'],
];
for (const file of scanFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [pattern, label] of forbidden) {
    if (pattern.test(source)) {
      throw new Error(`${label} em ${path.relative(root, file)}`);
    }
  }
}

const maxLineLength = 140;
for (const file of [...serverFiles, ...readableFiles, ...maintenanceFiles, ...databaseFiles]) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.length > maxLineLength) {
      throw new Error(
        `Linha com ${line.length} caracteres em ${path.relative(root, file)}:${index + 1}. ` +
          `Máximo permitido: ${maxLineLength}.`,
      );
    }
  });
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lockfile = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
void vercel;

if (manifest.version !== lockfile.version || manifest.version !== lockfile.packages?.['']?.version) {
  throw new Error('Versão divergente entre package.json e package-lock.json.');
}

const supabaseVersion = manifest.dependencies?.['@supabase/supabase-js'];
const lockedSupabaseVersion = lockfile.packages?.['']?.dependencies?.['@supabase/supabase-js'];
const installedSupabaseVersion = lockfile.packages?.['node_modules/@supabase/supabase-js']?.version;
if (!supabaseVersion || supabaseVersion !== lockedSupabaseVersion || supabaseVersion !== installedSupabaseVersion) {
  throw new Error('Versão do @supabase/supabase-js divergente entre manifesto e lockfile.');
}

if (lockfile.packages?.['node_modules/@supabase/node-fetch']) {
  throw new Error('Lockfile voltou a incluir @supabase/node-fetch legado.');
}

const styleSource = fs.readFileSync(path.join(root, 'public/style.css'), 'utf8');
const styleImports = [...styleSource.matchAll(/@import\s+url\(['"]([^'"]+)['"]\);/g)].map(
  (match) => match[1],
);
if (new Set(styleImports).size !== styleImports.length) {
  throw new Error('public/style.css contém imports CSS duplicados.');
}
if (styleImports.at(-1) !== '/css/layout-hardening-v328.css') {
  throw new Error('layout-hardening-v328.css deve permanecer como última camada CSS.');
}

console.log(
  `OK — ${serverFiles.length} módulos de servidor, ${publicJs.length} módulos de interface ` +
    `e ${readableFiles.length} arquivos legíveis verificados.`,
);
