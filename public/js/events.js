import { toast } from './runtime.js';
import { render } from './router.js';
import { syncPoster } from './views.js';
import { handleAccountSubmit } from './events/account.js';
import { handleAdminChange, handleAdminClick, handleAdminSubmit } from './events/admin.js';
import {
  handleCommunityChange,
  handleCommunityClick,
  handleCommunityInput,
  handleCommunitySubmit,
} from './events/community.js';
import { handleFilterSubmit } from './events/filters.js';
import { handleNavigationClick } from './events/navigation.js';
import { handleNotificationClick } from './events/notifications.js';
import { handleBookClick } from './events/books.js';
import { handleOwnedContentClick } from './events/owned-content-v329.js';
import { handlePublicationClick } from './events/publications.js';
import {
  handleLabMessage,
  handleProjectChange,
  handleProjectClick,
  handleProjectInput,
} from './events/projects.js';
import { handleNewsClick, handleNewsSubmit } from './events/news.js';
import { handleTemplateClick, handleTemplateChange } from './events/template-studio.js';

const clickHandlers = [
  handleNavigationClick,
  handleNotificationClick,
  handleBookClick,
  handleOwnedContentClick,
  handlePublicationClick,
  handleProjectClick,
  handleCommunityClick,
  handleAdminClick,
  handleNewsClick,
  handleTemplateClick,
];

const submitHandlers = [
  handleFilterSubmit,
  handleAdminSubmit,
  handleAccountSubmit,
  handleCommunitySubmit,
  handleNewsSubmit,
];

async function dispatch(event, handlers) {
  for (const handler of handlers) {
    if (await handler(event)) return;
  }
}

function reportFailure(error) {
  const message = error instanceof Error ? error.message : 'Não foi possível concluir a ação.';

  toast(message, true);
}

function preventAccidentalActionSubmit(event) {
  const button = event.target.closest?.('button');
  if (!button || !Object.keys(button.dataset).length) return;
  event.preventDefault();
}

export function bindEvents() {
  addEventListener('click', (event) => {
    preventAccidentalActionSubmit(event);
    void dispatch(event, clickHandlers).catch(reportFailure);
  });

  addEventListener('submit', (event) => {
    void dispatch(event, submitHandlers).catch(reportFailure);
  });

  addEventListener('input', (event) => {
    if (event.target.closest('[data-poster-form]')) syncPoster();
    handleCommunityInput(event);
    handleProjectInput(event);
  });

  addEventListener('change', (event) => {
    handleCommunityChange(event);
    handleProjectChange(event);
    void handleTemplateChange(event).catch(reportFailure);
    void handleAdminChange(event).catch(reportFailure);
  });

  addEventListener('message', (event) => {
    handleLabMessage(event);
  });

  addEventListener('popstate', () => {
    void render().catch(reportFailure);
  });
}
