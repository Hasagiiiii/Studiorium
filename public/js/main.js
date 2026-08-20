import { bindEvents } from './events.js';
import { installEnhancements } from './enhancements.js';
import { installLibraryPolish } from './library-polish.js';
import { installBookCatalog } from './book-catalog-v331.js';
import { installAdminNewsFeature } from './admin-news-feature.js';
import { installAdminPublishedActions } from './admin-published-actions-v329.js';
import { render } from './router.js';

bindEvents();
installEnhancements();
installLibraryPolish();
installBookCatalog();
installAdminNewsFeature();
installAdminPublishedActions();
render();
