const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'vercel.json','api/index.js','src/server/router.js','src/server/db.js','src/server/auth.js',
  'public/index.html','public/style.css','public/js/main.js','public/js/runtime.js','public/js/router.js','public/js/views.js','public/js/events.js',
  'supabase/schema.sql','supabase/seed.sql','.env.example'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Arquivo obrigatório ausente: ${rel}`);
}

const serverFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) serverFiles.push(full);
  }
}
walk(path.join(root, 'src/server'));
serverFiles.push(path.join(root, 'api/index.js'));
for (const file of serverFiles) execFileSync(process.execPath, ['--check', file], { stdio:'pipe' });

const publicJs = fs.readdirSync(path.join(root, 'public/js')).filter(x=>x.endsWith('.js')).map(x=>path.join(root,'public/js',x));
for (const file of publicJs) {
  const source = fs.readFileSync(file, 'utf8');
  execFileSync(process.execPath, ['--input-type=module','--check'], { input:source, stdio:['pipe','pipe','pipe'] });
}

const scanFiles = [...serverFiles, ...publicJs, path.join(root,'public/index.html')];
const forbidden = [
  [/server\.listen\s*\(/i, 'servidor HTTP persistente no aplicativo'],
  [/STUDIORIUM_DB/i, 'configuração de banco em arquivo'],
  [/STUDIORIUM_UPLOAD_DIR/i, 'configuração de uploads em disco'],
];
for (const file of scanFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [pattern, label] of forbidden) if (pattern.test(source)) throw new Error(`${label} em ${path.relative(root,file)}`);
}

JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
console.log(`OK — ${serverFiles.length} módulos de servidor e ${publicJs.length} módulos de interface verificados.`);
