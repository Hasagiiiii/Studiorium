import {
  socialPostSchema,
  type CreatePostInput,
  type SocialPost,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class PostsService {
  constructor(private readonly client: ApiClient) {}

  create(input: CreatePostInput): Promise<SocialPost> {
    return this.client.request('/api/v4/posts', socialPostSchema, {
      method: 'POST',
      body: input,
    });
  }
}
