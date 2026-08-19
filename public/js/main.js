import { bindEvents } from './events.js';
import { installEnhancements } from './enhancements.js';
import { installLibraryPolish } from './library-polish.js';
import { render } from './router.js';

bindEvents();
installEnhancements();
installLibraryPolish();
render();
