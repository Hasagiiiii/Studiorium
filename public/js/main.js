import { installMotionPreferences } from './animations/motion.js';
import { bindEvents } from './events.js';
import { installEnhancements } from './enhancements.js';
import { installLibraryPolish } from './library-polish.js';
import { installBookCatalog } from './book-catalog.js';
import { installAdminNewsFeature } from './admin-news-feature.js';
import { installAdminPublishedActions } from './admin-published-actions.js';
import { render } from './router.js';

installMotionPreferences();
bindEvents();
installEnhancements();
installLibraryPolish();
installBookCatalog();
installAdminNewsFeature();
installAdminPublishedActions();
render();
