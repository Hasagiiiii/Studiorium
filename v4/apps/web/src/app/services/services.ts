import {
  ApiClient,
  AuthService,
  BootstrapService,
  CommunitiesService,
  InteractionsService,
  ModerationService,
  NotificationsService,
  PostsService,
  ProfilesService,
  ProjectsService,
  SocialService,
} from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  auth: new AuthService(client),
  bootstrap: new BootstrapService(client),
  communities: new CommunitiesService(client),
  interactions: new InteractionsService(client),
  moderation: new ModerationService(client),
  notifications: new NotificationsService(client),
  posts: new PostsService(client),
  profiles: new ProfilesService(client),
  projects: new ProjectsService(client),
  social: new SocialService(client),
};
