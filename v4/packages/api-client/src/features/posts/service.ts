import {
  postMediaSchema,
  socialPostSchema,
  type CreatePostInput,
  type PostMedia,
  type SocialPost,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export type PostMediaUploadMeta = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

export class PostsService {
  constructor(private readonly client: ApiClient) {}

  uploadMedia(file: Blob, meta: PostMediaUploadMeta): Promise<PostMedia> {
    return this.client.upload('/api/v4/posts/media', postMediaSchema, file, {
      'x-media-width': meta.width === null ? '' : String(meta.width),
      'x-media-height': meta.height === null ? '' : String(meta.height),
      'x-media-duration': meta.durationSeconds === null ? '' : String(meta.durationSeconds),
    });
  }

  create(input: CreatePostInput): Promise<SocialPost> {
    return this.client.request('/api/v4/posts', socialPostSchema, {
      method: 'POST',
      body: input,
    });
  }
}
