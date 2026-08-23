import {
  profileDetailSchema,
  profileSchema,
  type Profile,
  type ProfileDetail,
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

  updateBookshelfPrivacy(bookshelfPublic: boolean): Promise<Profile> {
    return this.client.request('/api/v4/profiles/me/bookshelf-privacy', profileSchema, {
      method: 'PATCH',
      body: { bookshelfPublic },
    });
  }
}
