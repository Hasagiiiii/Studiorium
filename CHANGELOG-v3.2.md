# Studiorium v3.2 — Armarium Librorum

## Estante comunitária

- remove os seis livros de demonstração da versão 3.1;
- o catálogo passa a nascer de leituras reais adicionadas por membros autenticados;
- cada novo livro exige nota e review do primeiro leitor;
- usuários podem marcar livros como **Quero ler**, **Lendo** ou **Lido**;
- reviews posteriores recalculam média, número de avaliações e recomendações;
- a Escrivaninha continua exibindo somente os livros guardados pelo próprio usuário.

## Capas e compra

- ISBN pode gerar automaticamente uma capa através do serviço de capas do Open Library;
- também é possível informar uma URL HTTPS de capa;
- o membro pode indicar um link HTTPS de edição ou compra;
- quando nenhum link é informado, o sistema cria uma busca na Amazon Brasil;
- `STUDIORIUM_AMAZON_AFFILIATE_TAG` é opcional e só deve ser ativado de acordo com os termos do programa de afiliados;
- links comerciais são apresentados como externos e usam `nofollow sponsored`.

## Segurança e moderação

- título, autor, descrição e review passam pela moderação local antes de publicação;
- URLs aceitas precisam usar HTTPS e não podem conter credenciais embutidas;
- reviews são gravadas pelo backend com autoria resolvida pela conta, sem confiar em nome enviado pelo navegador;
- nomes de menores não são publicados na review: aparece **Membro da comunidade**;
- `book_reviews` usa RLS e não concede acesso direto a `anon` ou `authenticated`;
- o navegador continua acessando o banco somente por meio da API do Studiorium.

## Identidade visual

- restaura a nomenclatura acadêmica como camada principal da interface;
- Biblioteca → **Bibliotheca**;
- Colóquio → **Colloquium**;
- Escrivaninha → **Scriptorium**;
- Oficina → **Officina**;
- Laboratório → **Laboratorium**;
- Notícias → **Nuntii**;
- Redação → **Redactio**;
- Acervo → **Tabularium**;
- Autores → **Auctores**;
- a função em português permanece como subtítulo para não prejudicar usabilidade.
