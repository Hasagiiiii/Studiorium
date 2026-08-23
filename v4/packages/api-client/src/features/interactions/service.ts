import {
  commentDeleteSchema,
  commentMutationSchema,
  likeMutationSchema,
  postDetailSchema,
  type CommentDelete,
  type CommentMutation,
  type CreateCommentInput,
  type LikeMutation,
  type PostDetail,
  type UpdateCommentInput,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class InteractionsService {
  constructor(private readonly client: ApiClient) {}

  postDetail(contentId: string): Promise<PostDetail> {
    return this.client.request(
      `/api/v4/posts/${encodeURIComponent(contentId)}/detail`,
      postDetailSchema,
    );
  }

  like(contentId: string): Promise<LikeMutation> {
    return this.client.request(
      `/api/v4/content/${encodeURIComponent(contentId)}/like`,
      likeMutationSchema,
      { method: 'POST' },
    );
  }

  unlike(contentId: string): Promise<LikeMutation> {
    return this.client.request(
      `/api/v4/content/${encodeURIComponent(contentId)}/like`,
      likeMutationSchema,
      { method: 'DELETE' },
    );
  }

  comment(contentId: string, input: CreateCommentInput): Promise<CommentMutation> {
    return this.client.request(
      `/api/v4/content/${encodeURIComponent(contentId)}/comments`,
      commentMutationSchema,
      { method: 'POST', body: input },
    );
  }

  updateComment(
    contentId: string,
    commentId: string,
    input: UpdateCommentInput,
  ): Promise<CommentMutation> {
    return this.client.request(
      `/api/v4/content/${encodeURIComponent(contentId)}/comments/${encodeURIComponent(commentId)}`,
      commentMutationSchema,
      { method: 'PATCH', body: input },
    );
  }

  deleteComment(contentId: string, commentId: string): Promise<CommentDelete> {
    return this.client.request(
      `/api/v4/content/${encodeURIComponent(contentId)}/comments/${encodeURIComponent(commentId)}`,
      commentDeleteSchema,
      { method: 'DELETE' },
    );
  }
}
