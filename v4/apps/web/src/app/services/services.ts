import {
  AdminService,
  ApiClient,
  AuthService,
  BootstrapService,
  CommunitiesService,
  InteractionsService,
  LibraryService,
  ModerationService,
  NewsService,
  NotificationsService,
  PostsService,
  ProfilesService,
  ProjectsService,
  ResearchService,
  SocialService,
} from '@lorion/api-client';

const client = new ApiClient();

export const services = {
  admin: new AdminService(client),
  auth: new AuthService(client),
  bootstrap: new BootstrapService(client),
  communities: new CommunitiesService(client),
  interactions: new InteractionsService(client),
  library: new LibraryService(client),
  moderation: new ModerationService(client),
  news: new NewsService(client),
  notifications: new NotificationsService(client),
  posts: new PostsService(client),
  profiles: new ProfilesService(client),
  projects: new ProjectsService(client),
  research: new ResearchService(client),
  social: new SocialService(client),
};
