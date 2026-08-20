const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const targets = [
  ['public/js/events/communities.js', 'events-communities.js'],
  ['public/js/views/communities.js', 'views-communities.js'],
  ['src/server/community-catalog.js', 'community-catalog.js'],
  ['src/server/router.js', 'server-router.js'],
  ['src/server/routes/communities.js', 'server-communities.js'],
  ['vercel.json', 'vercel.json'],
];

execFileSync(path.join(root, 'node_modules/.bin/prettier'), ['--write', '.'], {
  cwd: root,
  stdio: 'inherit',
});

const outDir = path.join(root, 'public', '__fmt');
fs.mkdirSync(outDir, { recursive: true });
for (const [source, output] of targets) {
  fs.copyFileSync(path.join(root, source), path.join(outDir, output));
}
