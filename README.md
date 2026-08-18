# Studiorium Online 2.6

Plataforma acadêmica online em estética dark academia, com Biblioteca, Acervo de modelos, pesquisas/autoria, Colóquio, Oficina de Tecnologia, Studiorium Lab e painel administrativo.

## Arquitetura atual

- `public/` — SPA e interface do Studiorium.
- `src/server/` + `api/index.js` — backend Node compatível com Vercel.
- `supabase/functions/studiorium-api-web/` — proxy web para a implantação GitHub Pages + Supabase Edge.
- `supabase/` — schema, seed e migrações do banco PostgreSQL.
- `.github/workflows/deploy-pages.yml` — build/deploy da interface no GitHub Pages quando Pages estiver habilitado nas configurações do repositório.
- `scripts/build-pages.js` — gera a versão estática para Pages, com navegação SPA por hash e API Edge.

## Banco e backend

O banco é Supabase/PostgreSQL. A API de produção usa Supabase Edge e mantém a secret key somente no servidor. Há também o backend Node original para Vercel.

Recursos principais:

- cadastro, login, sessões e troca de senha;
- `scrypt` + salt para senha e SHA-256 para token de sessão;
- proteção persistente contra tentativas excessivas de login;
- eventos de segurança com identificadores em hash;
- perfis, projetos acadêmicos e laboratório HTML/CSS/JS;
- publicações com arquivos privados e URLs assinadas;
- comunidade/Colóquio, denúncias e moderação;
- Oficina de Tecnologia, Jogos, PC & Hardware, Carros e Motos;
- painel ADM, auditoria e configurações do site.

## Administrador principal

O e-mail administrativo padrão desta instalação é `umaduplagamer@gmail.com`. O cadastro público não pode assumir esse endereço nem ganhar privilégio ADM apenas por coincidência de e-mail. A conta principal deve ser provisionada diretamente no banco/migração e a senha não deve ser colocada no GitHub.

## Segurança

- RLS habilitado nas tabelas de aplicação; o navegador não recebe a secret key.
- Bucket `publications` privado, com limite de 5 MB.
- Arquivos aceitos: PDF, DOCX, PPTX, ODT e TXT.
- Sessões com expiração e invalidação ao suspender usuário/trocar senha.
- Área ADM protegida por função `admin`.
- Ações administrativas em `admin_audit_log`.
- Conteúdo de menores usa perfil/autoria pública protegidos por padrão.
- Funções temporárias de diagnóstico não fazem parte do fluxo de produção.

## Banco — ordem de instalação

Consulte `supabase/README.md`. Para uma instalação já existente, aplique as migrações em ordem até a v2.6.

## Publicação

### GitHub Pages + Supabase Edge

O workflow `.github/workflows/deploy-pages.yml` publica a interface após GitHub Pages ser habilitado em **Settings → Pages → Source: GitHub Actions**. A versão Pages conversa com a API Edge por um proxy CORS restrito ao domínio `hasagiiiii.github.io`.

### Vercel + Supabase

O projeto também mantém `vercel.json`, `api/index.js` e o backend Node. Configure `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `STUDIORIUM_ADMIN_EMAIL` como variáveis privadas de produção.

## Validação

```bash
npm run check
npm test
```

Não versionar `.env`, secret keys ou senhas.
