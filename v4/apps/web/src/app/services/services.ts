import { ApiClient, BootstrapService, SocialService } from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  bootstrap: new BootstrapService(client),
  social: new SocialService(client),
};
