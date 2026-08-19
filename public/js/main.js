import { bindEvents } from './events.js';
import { installEnhancements } from './enhancements.js';
import { installLibraryPolish } from './library-polish.js';
import { installAdminNewsFeature } from './admin-news-feature.js';
import { render } from './router.js';

bindEvents();
installEnhancements();
installLibraryPolish();
installAdminNewsFeature();
render();
