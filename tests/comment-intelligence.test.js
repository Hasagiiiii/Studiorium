const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildReplyMap,
  isQuestion,
  rankRelatedDiscussions,
} = require('../src/server/comment-intelligence');

function reply(id, body) {
  return {
    id,
    body,
    authorName: 'Pessoa leitora',
    createdAt: '2026-08-18T12:00:00.000Z',
  };
}

test('reconhece perguntas explícitas e dúvidas escritas sem interrogação', () => {
  assert.equal(isQuestion('Como adiciono uma imagem no modelo?'), true);
  assert.equal(isQuestion('Não entendi a etapa de revisão'), true);
  assert.equal(isQuestion('A revisão editorial foi concluída.'), false);
  assert.equal(isQuestion('É importante declarar quando a ferramenta foi usada.'), false);
});

test('cria filtros somente a partir de dúvidas semelhantes presentes nos comentários', () => {
  const map = buildReplyMap([
    reply('one', 'Como adiciono uma foto ao template do meu projeto?'),
    reply('two', 'Onde posso colocar imagens no template do projeto?'),
    reply('three', 'Qual fonte bibliográfica devo usar no artigo?'),
    reply('four', 'A discussão sobre cronograma foi muito útil.'),
  ]);

  assert.equal(map.total, 4);
  assert.equal(map.questionCount, 3);
  assert.equal(map.clusters.length, 1);
  assert.deepEqual(new Set(map.clusters[0].replyIds), new Set(['one', 'two']));
  assert.match(map.clusters[0].label.toLowerCase(), /imagem|template|projeto/);
  assert.equal(map.replies.find((item) => item.id === 'one').insight.similarCount, 1);
  assert.equal(map.replies.find((item) => item.id === 'three').insight.clusterId, null);
});

test('ordena discussões relacionadas pelo vocabulário real do conteúdo', () => {
  const reference = {
    title: 'Como verificar fontes em uma notícia científica?',
    body: 'Quero conferir referências antes de publicar.',
  };
  const candidates = [
    {
      id: 'unrelated',
      title: 'Organização do cronograma escolar',
      body: 'Datas e entregas do semestre.',
    },
    {
      id: 'related',
      title: 'Referências confiáveis para notícias',
      body: 'Métodos de verificação de fontes científicas.',
    },
  ];

  const result = rankRelatedDiscussions(reference, candidates);

  assert.deepEqual(
    result.map((item) => item.id),
    ['related'],
  );
});
