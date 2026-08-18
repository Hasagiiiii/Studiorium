const { hashPassword } = require('../src/server/security');
const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Uso: npm run hash-password -- "sua-senha-com-8-ou-mais-caracteres"');
  process.exit(1);
}
console.log(hashPassword(password));
