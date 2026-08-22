const MOTION_TARGETS = [
  '.pagehero .shell > *',
  '.sectionhead > *',
  '.card',
  '.community-spot',
  '.social-list-item',
  '.social-pulse-row',
].join(',');

const SPECIALIZED_MOTION_TARGETS = [
  '.library-card',
  '.book-card',
  '.news-card',
  '.community-resource-card',
  '.community-discussion-item',
  '.studio-card',
  '.studio-guided-option',
  '.profile-social-card',
  '.workspace-profile-center',
].join(',');

const TILT_TARGETS = '.card.hover, .community-spot, .social-list-item, .featurelink';

function reducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function genericMotionTarget(item) {
  return !item.matches(SPECIALIZED_MOTION_TARGETS);
}

function revealVisible(root = document) {
  if (reducedMotion()) return;
  const items = [...root.querySelectorAll(MOTION_TARGETS)].filter(
    (item) => !item.dataset.studioMotionReady && genericMotionTarget(item),
  );

  items.slice(0, 36).forEach((item, index) => {
    item.dataset.studioMotionReady = 'true';
    item.animate(
      [
        { opacity: 0, transform: 'translateY(14px) scale(.988)', filter: 'blur(3px)' },
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
      ],
      {
        duration: 420,
        delay: Math.min(index * 26, 260),
        easing: 'cubic-bezier(.2,.8,.2,1)',
        fill: 'backwards',
      },
    );
  });
}

function animatePulse(root = document) {
  if (reducedMotion()) return;
  root.querySelectorAll('.social-pulse-copy i b').forEach((bar) => {
    if (bar.dataset.pulseMotionReady) return;
    bar.dataset.pulseMotionReady = 'true';
    bar.animate(
      [
        { transform: 'scaleX(0)', transformOrigin: 'left center', opacity: 0.35 },
        { transform: 'scaleX(1)', transformOrigin: 'left center', opacity: 1 },
      ],
      { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  });

  root.querySelectorAll('.social-pulse-segment').forEach((segment, index) => {
    if (segment.dataset.segmentMotionReady) return;
    segment.dataset.segmentMotionReady = 'true';
    segment.animate(
      [
        { transform: 'scaleY(.18)', opacity: 0 },
        { transform: 'scaleY(1)', opacity: 1 },
      ],
      {
        duration: 520,
        delay: index * 70,
        easing: 'cubic-bezier(.22,.9,.22,1)',
        fill: 'backwards',
      },
    );
  });
}

function feedback(element) {
  if (!element || reducedMotion()) return;
  element.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(.975)', offset: 0.45 },
      { transform: 'scale(1)' },
    ],
    { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
  );
}

function updateTilt(event) {
  if (reducedMotion() || matchMedia('(hover: none)').matches) return;
  const target = event.target.closest?.(TILT_TARGETS);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
  const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
  target.style.setProperty('--motion-rx', `${(-y * 2.1).toFixed(2)}deg`);
  target.style.setProperty('--motion-ry', `${(x * 2.6).toFixed(2)}deg`);
  target.style.setProperty('--motion-glow-x', `${((x + 0.5) * 100).toFixed(1)}%`);
  target.style.setProperty('--motion-glow-y', `${((y + 0.5) * 100).toFixed(1)}%`);
}

function clearTilt(event) {
  const target = event.target.closest?.(TILT_TARGETS);
  if (!target) return;
  target.style.removeProperty('--motion-rx');
  target.style.removeProperty('--motion-ry');
  target.style.removeProperty('--motion-glow-x');
  target.style.removeProperty('--motion-glow-y');
}

function enhance(root = document) {
  requestAnimationFrame(() => {
    revealVisible(root);
    animatePulse(root);
  });
}

export function installStudioMotion() {
  const app = document.getElementById('app');
  if (!app) return;

  document.addEventListener('studiorium:rendered', () => enhance(app));

  addEventListener('pointermove', updateTilt, { passive: true });
  addEventListener('pointerout', clearTilt, { passive: true });
  addEventListener(
    'click',
    (event) => {
      const action = event.target.closest?.('button, .solid, .outline, .soft, .iconbtn');
      feedback(action);
    },
    true,
  );

  if (app.childElementCount) enhance(app);
}
