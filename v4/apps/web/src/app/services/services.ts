import {
  ApiClient,
  AuthService,
  BootstrapService,
  NotificationsService,
  SocialService,
} from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  auth: new AuthService(client),
  bootstrap: new BootstrapService(client),
  notifications: new NotificationsService(client),
  social: new SocialService(client),
};
