import { ApiClient, AuthService, BootstrapService, SocialService } from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  auth: new AuthService(client),
  bootstrap: new BootstrapService(client),
  social: new SocialService(client),
};
