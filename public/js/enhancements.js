import { applyAcademicIdentity } from './features/academic-identity.js';
import { enhanceArmarium } from './features/armarium.js';

function runEnhancements() {
  applyAcademicIdentity();
  enhanceArmarium();
}

export function installEnhancements() {
  const root = document.getElementById('app');
  if (!root) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      runEnhancements();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();
}
