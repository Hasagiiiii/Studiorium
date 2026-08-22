import { goto } from '../router.js';

const PARCHMENT_ROUTES = [/^\/pesquisas\//, /^\/projetos\//];

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isModifiedClick(event) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldAnimate(link, event) {
  if (!link || link.origin !== location.origin || isModifiedClick(event)) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download') || prefersReducedMotion()) return false;
  return PARCHMENT_ROUTES.some((pattern) => pattern.test(link.pathname));
}

function getSource(link) {
  return link.closest('.publication-card, article.card, .card') || link;
}

function makeStage(source) {
  const rect = source.getBoundingClientRect();
  const stage = document.createElement('div');
  stage.className = 'parchment-transition-stage';
  stage.setAttribute('aria-hidden', 'true');

  const sheet = document.createElement('div');
  sheet.className = 'parchment-transition-sheet';
  sheet.innerHTML = '<span class="parchment-roll parchment-roll-left"></span><span class="parchment-roll parchment-roll-right"></span><span class="parchment-seal">S</span>';

  stage.append(sheet);
  document.body.append(stage);

  Object.assign(stage.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${Math.max(rect.width, 48)}px`,
    height: `${Math.max(rect.height, 48)}px`,
  });

  return { stage, sheet, rect };
}

function wait(animation) {
  return animation.finished.catch(() => undefined);
}

async function runParchmentTransition(link) {
  const source = getSource(link);
  const { stage, sheet, rect } = makeStage(source);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetWidth = Math.min(820, Math.max(300, vw - 32));
  const targetHeight = Math.min(560, Math.max(260, vh - 64));
  const targetLeft = Math.max(16, (vw - targetWidth) / 2);
  const targetTop = Math.max(24, (vh - targetHeight) / 2);

  document.documentElement.classList.add('parchment-transition-active');
  source.classList.add('parchment-transition-source');

  const stageAnimation = stage.animate(
    [
      {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${Math.max(rect.width, 48)}px`,
        height: `${Math.max(rect.height, 48)}px`,
        borderRadius: '18px',
        opacity: 0.72,
      },
      {
        left: `${targetLeft}px`,
        top: `${targetTop}px`,
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        borderRadius: '10px',
        opacity: 1,
      },
    ],
    { duration: 520, easing: 'cubic-bezier(.22,.9,.22,1)', fill: 'forwards' },
  );

  const revealAnimation = sheet.animate(
    [
      { clipPath: 'inset(0 47% 0 47% round 18px)', transform: 'scaleY(.92)' },
      { clipPath: 'inset(0 12% 0 12% round 12px)', transform: 'scaleY(1.015)', offset: 0.68 },
      { clipPath: 'inset(0 0 0 0 round 10px)', transform: 'scaleY(1)' },
    ],
    { duration: 560, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' },
  );

  await Promise.all([wait(stageAnimation), wait(revealAnimation)]);
  await goto(link.pathname + link.search + link.hash);

  stage.style.position = 'fixed';
  await wait(
    stage.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.025)' },
      ],
      { duration: 190, easing: 'ease-out', fill: 'forwards' },
    ),
  );

  source.classList.remove('parchment-transition-source');
  document.documentElement.classList.remove('parchment-transition-active');
  stage.remove();
}

export function installParchmentTransitions() {
  addEventListener(
    'click',
    (event) => {
      const link = event.target.closest?.('a[data-link]');
      if (!shouldAnimate(link, event)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void runParchmentTransition(link).catch(() => {
        document.documentElement.classList.remove('parchment-transition-active');
        document.querySelector('.parchment-transition-stage')?.remove();
        goto(link.pathname + link.search + link.hash);
      });
    },
    true,
  );
}
