import {
  profileDetailSchema,
  profileSchema,
  type Profile,
  type ProfileDetail,
  type ProfileMediaKind,
  type ProfileMediaUploadInput,
  type UpdateProfileInput,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class ProfilesService {
  constructor(private readonly client: ApiClient) {}

  detail(username: string): Promise<ProfileDetail> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/detail`,
      profileDetailSchema,
    );
  }

  update(input: UpdateProfileInput): Promise<Profile> {
    return this.client.request('/api/v4/profiles/me', profileSchema, {
      method: 'PATCH',
      body: input,
    });
  }

  updateBookshelfPrivacy(bookshelfPublic: boolean): Promise<Profile> {
    return this.client.request('/api/v4/profiles/me/bookshelf-privacy', profileSchema, {
      method: 'PATCH',
      body: { bookshelfPublic },
    });
  }

  uploadMedia(input: ProfileMediaUploadInput): Promise<Profile> {
    return this.client.request('/api/v4/profiles/me/media', profileSchema, {
      method: 'POST',
      body: input,
    });
  }

  removeMedia(kind: ProfileMediaKind): Promise<Profile> {
    return this.client.request(`/api/v4/profiles/me/media/${kind}`, profileSchema, {
      method: 'DELETE',
    });
  }

  mediaUrl(username: string, kind: ProfileMediaKind): string {
    return `/api/v4/profiles/${encodeURIComponent(username)}/media/${kind}`;
  }
}
