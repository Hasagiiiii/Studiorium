const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const changed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

for (const file of changed) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const content = fs.readFileSync(file).toString('base64');
  console.log(`FORMAT_FILE_START:${file}`);
  console.log(content);
  console.log(`FORMAT_FILE_END:${file}`);
}
