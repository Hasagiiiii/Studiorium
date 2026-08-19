import { bindEvents } from './events.js';
import { installEnhancements } from './enhancements.js';
import { render } from './router.js';

bindEvents();
installEnhancements();
render();
