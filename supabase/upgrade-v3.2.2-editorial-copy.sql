-- Studiorium v3.2.2 — corrige texto institucional legado da redação.
-- A moderação atual usa triagem automática local + decisão editorial humana,
-- portanto o conteúdo inicial não deve afirmar que a triagem depende de IA.

update public.news_articles
set
  summary = concat(
    'A nova redação colaborativa combina fontes declaradas, ',
    'triagem automática local e revisão editorial humana.'
  ),
  body = concat(
    'O Studiorium passa a receber propostas de matérias de estudantes de Jornalismo, ',
    'Comunicação e áreas relacionadas. O credenciamento do colaborador é analisado pela administração. ',
    'Cada texto precisa indicar suas fontes, passa por uma triagem automática local de riscos ',
    'e só recebe o selo editorial depois da revisão humana. A triagem orienta a equipe, ',
    'mas não substitui a conferência das informações.'
  ),
  updated_at = now()
where id = 'news-redacao-studiorium';
