const { db, fail } = require('../src/server/db');
const { hashPassword, id, now, slugify } = require('../src/server/security');

function requiredEnvironment(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

async function availableUsername(email) {
  const base = slugify(email.split('@')[0]).replace(/-/g, '').slice(0, 20) || 'administrador';

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const username = suffix === 0 ? base : `${base}${suffix + 1}`;
    const result = await db()
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();
    fail(result.error);
    if (!result.data) return username;
  }

  throw new Error('Não foi possível reservar um nome de usuário administrativo.');
}

async function provisionAdmin() {
  const email = requiredEnvironment('STUDIORIUM_ADMIN_EMAIL').toLowerCase();
  const password = requiredEnvironment('STUDIORIUM_ADMIN_PASSWORD');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('STUDIORIUM_ADMIN_EMAIL é inválido.');
  if (password.length < 12 || password.length > 128) {
    throw new Error('STUDIORIUM_ADMIN_PASSWORD precisa ter entre 12 e 128 caracteres.');
  }

  const existing = await db().from('users').select('id,role').eq('email', email).maybeSingle();
  fail(existing.error);
  if (existing.data) {
    if (existing.data.role !== 'admin') {
      throw new Error('O e-mail administrativo já pertence a uma conta comum.');
    }
    console.log('Conta administradora já provisionada; nenhuma alteração foi feita.');
    return;
  }

  const userId = id('usr');
  const createdAt = now();
  const user = {
    id: userId,
    email,
    password_hash: hashPassword(password),
    role: 'admin',
    status: 'active',
    is_minor: false,
    birth_year: null,
    created_at: createdAt,
  };
  const insertedUser = await db().from('users').insert(user);
  fail(insertedUser.error);

  try {
    const profile = {
      user_id: userId,
      username: await availableUsername(email),
      display_name: 'Administrador Studiorium',
      bio: '',
      profile_type: 'instituicao',
      is_public: false,
      created_at: createdAt,
    };
    const insertedProfile = await db().from('profiles').insert(profile);
    fail(insertedProfile.error);

    const audit = await db()
      .from('admin_audit_log')
      .insert({
        admin_id: userId,
        action: 'admin.provisioned',
        target_type: 'user',
        target_id: userId,
        details: { source: 'scripts/provision-admin.js' },
        created_at: createdAt,
      });
    fail(audit.error);
  } catch (error) {
    await db().from('profiles').delete().eq('user_id', userId);
    await db().from('users').delete().eq('id', userId);
    throw error;
  }

  console.log('Conta administradora provisionada com sucesso.');
}

provisionAdmin().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
