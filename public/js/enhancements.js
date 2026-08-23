import { applyAcademicIdentity } from './features/academic-identity.js';
import { enhanceArmarium } from './features/armarium.js';

function runEnhancements() {
  applyAcademicIdentity();
  enhanceArmarium();
}

export function installEnhancements() {
  const root = document.getElementById('app');
  if (!root) return;

  const run = () => queueMicrotask(runEnhancements);
  document.addEventListener('studiorium:rendered', run);

  if (root.childElementCount) run();
}
