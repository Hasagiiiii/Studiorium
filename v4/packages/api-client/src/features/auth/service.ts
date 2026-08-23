import {
  authUserResponseSchema,
  okResponseSchema,
  type AuthUserResponse,
  type OkResponse,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class AuthService {
  constructor(private readonly client: ApiClient) {}

  login(email: string, password: string): Promise<AuthUserResponse> {
    return this.client.request('/api/v4/auth/login', authUserResponseSchema, {
      method: 'POST',
      body: { email, password },
    });
  }

  register(input: {
    email: string;
    password: string;
    displayName: string;
    birthYear: number;
  }): Promise<AuthUserResponse> {
    return this.client.request('/api/v4/auth/register', authUserResponseSchema, {
      method: 'POST',
      body: input,
    });
  }

  logout(): Promise<OkResponse> {
    return this.client.request('/api/v4/auth/logout', okResponseSchema, { method: 'POST' });
  }
}
