import { goto } from '../router.js';

const PARCHMENT_ROUTES = [
  /^\/pesquisas\//,
  /^\/projetos\//,
  /^\/templates\//,
  /^\/modelos-livres\//,
  /^\/noticias\//,
];

let transitionRunning = false;

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
  if (transitionRunning || !link || link.origin !== location.origin || isModifiedClick(event)) {
    return false;
  }
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download') || prefersReducedMotion()) return false;
  return PARCHMENT_ROUTES.some((pattern) => pattern.test(link.pathname));
}

function getSource(link) {
  return link.closest('.publication-card, article.card, .card') || link;
}

function createPart(className, tagName = 'div') {
  const element = document.createElement(tagName);
  element.className = className;
  return element;
}

function targetRect() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(860, Math.max(300, viewportWidth - 32));
  const height = Math.min(600, Math.max(280, viewportHeight - 64));

  return {
    width,
    height,
    left: Math.max(16, (viewportWidth - width) / 2),
    top: Math.max(24, (viewportHeight - height) / 2),
  };
}

function makeStage(source) {
  const sourceRect = source.getBoundingClientRect();
  const target = targetRect();
  const layer = createPart('parchment-transition-layer');
  layer.setAttribute('aria-hidden', 'true');

  const backdrop = createPart('parchment-transition-backdrop');
  const stage = createPart('parchment-transition-stage');
  const scroll = createPart('parchment-transition-scroll');
  const paper = createPart('parchment-transition-paper');
  const watermark = createPart('parchment-watermark', 'span');
  const leftRoll = createPart('parchment-roll parchment-roll-left', 'span');
  const rightRoll = createPart('parchment-roll parchment-roll-right', 'span');
  const leftTie = createPart('parchment-tie parchment-tie-left', 'span');
  const rightTie = createPart('parchment-tie parchment-tie-right', 'span');
  const seal = createPart('parchment-seal', 'span');

  watermark.textContent = 'STUDIORIUM';
  seal.textContent = 'S';

  paper.append(watermark);
  scroll.append(paper, leftRoll, rightRoll, leftTie, rightTie, seal);
  stage.append(scroll);
  layer.append(backdrop, stage);
  document.body.append(layer);

  Object.assign(stage.style, {
    left: `${target.left}px`,
    top: `${target.top}px`,
    width: `${target.width}px`,
    height: `${target.height}px`,
  });

  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;
  const scaleX = Math.max(0.08, Math.min(1.2, sourceRect.width / target.width));
  const scaleY = Math.max(0.08, Math.min(1.2, sourceRect.height / target.height));
  const startTransform = `translate3d(${sourceCenterX - targetCenterX}px, ${
    sourceCenterY - targetCenterY
  }px, 0) scale(${scaleX}, ${scaleY})`;

  stage.style.transform = startTransform;
  stage.style.opacity = '0.72';

  return {
    source,
    sourceRect,
    target,
    layer,
    backdrop,
    stage,
    scroll,
    paper,
    watermark,
    leftRoll,
    rightRoll,
    leftTie,
    rightTie,
    seal,
    startTransform,
  };
}

function wait(animation) {
  return animation.finished.catch(() => undefined);
}

async function centerSealedScroll(parts) {
  const { backdrop, stage, startTransform } = parts;
  const backdropAnimation = backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
  });
  const stageAnimation = stage.animate(
    [
      { transform: startTransform, opacity: 0.72, filter: 'blur(1.2px)' },
      {
        transform: 'translate3d(0, -3px, 0) scale(1.012, .995)',
        opacity: 1,
        filter: 'blur(0)',
        offset: 0.82,
      },
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, filter: 'blur(0)' },
    ],
    { duration: 340, easing: 'cubic-bezier(.2,.82,.22,1)', fill: 'forwards' },
  );

  await Promise.all([wait(backdropAnimation), wait(stageAnimation)]);
  stage.style.transform = 'none';
  stage.style.opacity = '1';
  stageAnimation.cancel();
}

async function breakSeal(parts) {
  const { seal, leftTie, rightTie } = parts;
  const sealAnimation = seal.animate(
    [
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
      {
        transform: 'translate(-50%, -54%) scale(1.1) rotate(-4deg)',
        opacity: 1,
        offset: 0.42,
      },
      { transform: 'translate(-50%, -76%) scale(.72) rotate(13deg)', opacity: 0 },
    ],
    { duration: 230, easing: 'cubic-bezier(.3,.78,.28,1)', fill: 'forwards' },
  );
  const leftTieAnimation = leftTie.animate(
    [
      { transform: 'scaleX(1)', opacity: 0.82 },
      { transform: 'scaleX(.08)', opacity: 0 },
    ],
    { duration: 190, easing: 'ease-in', fill: 'forwards' },
  );
  const rightTieAnimation = rightTie.animate(
    [
      { transform: 'scaleX(1)', opacity: 0.82 },
      { transform: 'scaleX(.08)', opacity: 0 },
    ],
    { duration: 190, easing: 'ease-in', fill: 'forwards' },
  );

  await Promise.all([wait(sealAnimation), wait(leftTieAnimation), wait(rightTieAnimation)]);
}

async function unrollPaper(parts) {
  const { target, paper, watermark, leftRoll, rightRoll, scroll } = parts;
  const rollWidth = Math.max(18, leftRoll.getBoundingClientRect().width || 22);
  const closedLeft = target.width / 2 - rollWidth / 2;
  const leftTarget = -rollWidth * 0.42;
  const rightTarget = target.width - rollWidth * 0.58;

  leftRoll.style.left = `${closedLeft}px`;
  rightRoll.style.left = `${closedLeft}px`;

  const paperAnimation = paper.animate(
    [
      {
        clipPath: 'inset(0 48% 0 48% round 14px)',
        transform: 'scaleY(.92)',
        filter: 'brightness(.9)',
      },
      {
        clipPath: 'inset(0 7% 0 7% round 10px)',
        transform: 'scaleY(1.018)',
        filter: 'brightness(1.035)',
        offset: 0.78,
      },
      {
        clipPath: 'inset(0 0 0 0 round 8px)',
        transform: 'scaleY(1)',
        filter: 'brightness(1)',
      },
    ],
    { duration: 590, easing: 'cubic-bezier(.16,.9,.2,1)', fill: 'forwards' },
  );

  const leftRollAnimation = leftRoll.animate(
    [
      { left: `${closedLeft}px`, transform: 'rotateY(0deg) translateZ(0)' },
      {
        left: `${leftTarget - 6}px`,
        transform: 'rotateY(-24deg) translateZ(2px)',
        offset: 0.84,
      },
      { left: `${leftTarget}px`, transform: 'rotateY(0deg) translateZ(0)' },
    ],
    { duration: 590, easing: 'cubic-bezier(.16,.9,.2,1)', fill: 'forwards' },
  );

  const rightRollAnimation = rightRoll.animate(
    [
      { left: `${closedLeft}px`, transform: 'rotateY(0deg) translateZ(0)' },
      {
        left: `${rightTarget + 6}px`,
        transform: 'rotateY(24deg) translateZ(2px)',
        offset: 0.84,
      },
      { left: `${rightTarget}px`, transform: 'rotateY(0deg) translateZ(0)' },
    ],
    { duration: 590, easing: 'cubic-bezier(.16,.9,.2,1)', fill: 'forwards' },
  );

  const watermarkAnimation = watermark.animate(
    [
      { opacity: 0, letterSpacing: '.42em' },
      { opacity: 0, letterSpacing: '.34em', offset: 0.48 },
      { opacity: 0.14, letterSpacing: '.24em' },
    ],
    { duration: 590, easing: 'ease-out', fill: 'forwards' },
  );

  const tensionAnimation = scroll.animate(
    [
      { transform: 'translateY(0) scaleX(1)' },
      { transform: 'translateY(-2px) scaleX(1.006)', offset: 0.82 },
      { transform: 'translateY(0) scaleX(1)' },
    ],
    { duration: 590, easing: 'cubic-bezier(.16,.9,.2,1)' },
  );

  await Promise.all([
    wait(paperAnimation),
    wait(leftRollAnimation),
    wait(rightRollAnimation),
    wait(watermarkAnimation),
    wait(tensionAnimation),
  ]);

  paper.style.clipPath = 'inset(0 0 0 0 round 8px)';
  paper.style.transform = 'scaleY(1)';
  leftRoll.style.left = `${leftTarget}px`;
  rightRoll.style.left = `${rightTarget}px`;
  paperAnimation.cancel();
  leftRollAnimation.cancel();
  rightRollAnimation.cancel();
}

async function dissolveAfterNavigation(parts) {
  const { layer, stage } = parts;
  const stageAnimation = stage.animate(
    [
      { transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
      { transform: 'translateY(-5px) scale(1.018)', filter: 'blur(1.5px)' },
    ],
    { duration: 190, easing: 'ease-out', fill: 'forwards' },
  );
  const layerAnimation = layer.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 190,
    easing: 'ease-out',
    fill: 'forwards',
  });

  await Promise.all([wait(stageAnimation), wait(layerAnimation)]);
}

function cleanup(parts) {
  parts?.source?.classList.remove('parchment-transition-source');
  parts?.layer?.remove();
  document.documentElement.classList.remove('parchment-transition-active');
}

async function runParchmentTransition(sourceLink, destination) {
  transitionRunning = true;
  let parts;

  try {
    const source = getSource(sourceLink);
    parts = makeStage(source);
    document.documentElement.classList.add('parchment-transition-active');
    source.classList.add('parchment-transition-source');

    await centerSealedScroll(parts);
    await breakSeal(parts);
    await unrollPaper(parts);
    await goto(destination);
    await dissolveAfterNavigation(parts);
  } finally {
    cleanup(parts);
    transitionRunning = false;
  }
}

export function installParchmentTransitions() {
  addEventListener(
    'click',
    (event) => {
      const link = event.target.closest?.('a[data-link]');
      if (!shouldAnimate(link, event)) return;

      const destination = link.pathname + link.search + link.hash;
      event.preventDefault();
      event.stopImmediatePropagation();

      void runParchmentTransition(link, destination).catch(() => {
        cleanup();
        transitionRunning = false;
        void goto(destination);
      });
    },
    true,
  );
}
