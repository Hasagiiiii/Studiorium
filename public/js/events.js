import { toast } from './runtime.js';
import { render } from './router.js';
import { syncPoster } from './views.js';
import { handleAccountSubmit } from './events/account.js';
import { handleAdminClick, handleAdminSubmit } from './events/admin.js';
import { handleCommunityClick, handleCommunitySubmit } from './events/community.js';
import { handleFilterSubmit } from './events/filters.js';
import { handleNavigationClick } from './events/navigation.js';
import { handleProjectClick } from './events/projects.js';

const clickHandlers = [
  handleNavigationClick,
  handleProjectClick,
  handleCommunityClick,
  handleAdminClick,
];

const submitHandlers = [
  handleFilterSubmit,
  handleAdminSubmit,
  handleAccountSubmit,
  handleCommunitySubmit,
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

export function bindEvents() {
  addEventListener('click', (event) => {
    void dispatch(event, clickHandlers).catch(reportFailure);
  });

  addEventListener('submit', (event) => {
    void dispatch(event, submitHandlers).catch(reportFailure);
  });

  addEventListener('input', (event) => {
    if (event.target.closest('[data-poster-form]')) syncPoster();
  });

  addEventListener('popstate', () => {
    void render().catch(reportFailure);
  });
}
