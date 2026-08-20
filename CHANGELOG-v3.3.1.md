# Studiorium v3.3.1

Revisão de manutenção, consistência e observabilidade da plataforma.

- sincroniza `package.json` e `package-lock.json` na versão 3.3.1;
- atualiza `@supabase/supabase-js` de 2.57.0 para 2.112.3;
- remove a cadeia legada de `@supabase/node-fetch` do lockfile;
- torna `npm run check` somente leitura com `prettier --check`;
- adiciona validações contra divergência de versão e imports CSS duplicados;
- separa falhas 5xx de respostas esperadas 4xx nos logs da API;
- inicia a consolidação dos módulos de runtime removendo sufixos de versão dos recursos mais recentes;
- organiza a ordem dos imports CSS por responsabilidade sem alterar o hardening responsivo final;
- mantém migrações e changelogs anteriores como histórico, sem carregá-los no runtime.
