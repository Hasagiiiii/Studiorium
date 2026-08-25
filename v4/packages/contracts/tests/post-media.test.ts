import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_POST_MEDIA,
  MAX_POST_VIDEO_DURATION_SECONDS,
  postMediaCollectionSchema,
  postMediaSchema,
  socialPostSchema,
} from '../src/index.js';

test('post social mantém mídia vazia por padrão para compatibilidade', () => {
  const post = socialPostSchema.parse({
    id: 'pst_1',
    authorId: 'usr_1',
    authorUsername: 'pessoa',
    authorName: 'Pessoa',
    body: 'Legenda da publicação',
    visibility: 'public',
    moderationStatus: 'clear',
    createdAt: null,
    updatedAt: null,
  });

  assert.deepEqual(post.media, []);
});

test('foto aceita legenda própria e dimensões', () => {
  const media = postMediaSchema.parse({
    id: 'med_1',
    type: 'image',
    url: '/media/foto.webp',
    caption: 'Legenda acessível da foto',
    width: 1080,
    height: 1350,
    position: 0,
  });

  assert.equal(media.caption, 'Legenda acessível da foto');
  assert.equal(media.durationSeconds, null);
});

test('vídeo exige duração e respeita limite de um minuto', () => {
  const valid = postMediaSchema.parse({
    id: 'med_2',
    type: 'video',
    url: '/media/video.mp4',
    previewUrl: '/media/video-poster.webp',
    durationSeconds: MAX_POST_VIDEO_DURATION_SECONDS,
  });

  assert.equal(valid.durationSeconds, 60);
  assert.throws(() =>
    postMediaSchema.parse({
      id: 'med_3',
      type: 'video',
      url: '/media/sem-duracao.mp4',
    }),
  );
  assert.throws(() =>
    postMediaSchema.parse({
      id: 'med_4',
      type: 'video',
      url: '/media/longo.mp4',
      durationSeconds: MAX_POST_VIDEO_DURATION_SECONDS + 0.1,
    }),
  );
});

test('carrossel limita quantidade de mídias por publicação', () => {
  const media = Array.from({ length: MAX_POST_MEDIA }, (_, index) => ({
    id: `med_${index}`,
    type: 'image' as const,
    url: `/media/${index}.webp`,
    position: index,
  }));

  assert.equal(postMediaCollectionSchema.parse(media).length, MAX_POST_MEDIA);
  assert.throws(() =>
    postMediaCollectionSchema.parse([
      ...media,
      { id: 'med_extra', type: 'image', url: '/media/extra.webp', position: MAX_POST_MEDIA },
    ]),
  );
});
