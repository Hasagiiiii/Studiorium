import {
  ApiClient,
  AuthService,
  BootstrapService,
  CommunitiesService,
  NotificationsService,
  ProfilesService,
  ProjectsService,
  SocialService,
} from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  auth: new AuthService(client),
  bootstrap: new BootstrapService(client),
  communities: new CommunitiesService(client),
  notifications: new NotificationsService(client),
  profiles: new ProfilesService(client),
  projects: new ProjectsService(client),
  social: new SocialService(client),
};
