const SOCIAL_TARGETS = [
  '.social-hero-brand',
  '.social-search',
  '.social-left > .social-panel',
  '.social-discovery-strip > a',
  '.social-feed-tabs',
  '.social-composer',
  '.social-feed-list > .social-post',
  '.social-right > .social-panel',
].join(',');

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function enterMotion(element, index = 0) {
  if (element.dataset.socialMotionReady === 'true') {
    return;
  }
  element.dataset.socialMotionReady = 'true';

  if (prefersReducedMotion() || typeof element.animate !== 'function') {
    return;
  }

  const delay = Math.min(index * 34, 180);
  element.animate(
    [
      { opacity: 0, transform: 'translateY(12px) scale(0.992)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    {
      duration: 360,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both',
    },
  );
}

function socialTargetsInside(root) {
  const targets = [];
  if (root.matches && root.matches(SOCIAL_TARGETS)) {
    targets.push(root);
  }
  root.querySelectorAll(SOCIAL_TARGETS).forEach((element) => {
    targets.push(element);
  });
  return targets;
}

function observeSocialSurfaces(root, observer) {
  socialTargetsInside(root).forEach((element, index) => {
    if (element.dataset.socialMotionObserved === 'true') {
      return;
    }
    element.dataset.socialMotionObserved = 'true';

    if (!observer) {
      enterMotion(element, index);
      return;
    }

    element.dataset.socialMotionIndex = String(index);
    observer.observe(element);
  });
}

function installPressFeedback() {
  document.addEventListener('pointerdown', (event) => {
    const control = event.target.closest(
      '.social-action, .social-feed-tabs button, .social-panel a, .social-discovery-strip a',
    );
    if (!control || prefersReducedMotion() || typeof control.animate !== 'function') {
      return;
    }

    control.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.975)' },
        { transform: 'scale(1)' },
      ],
      {
        duration: 180,
        easing: 'ease-out',
      },
    );
  });
}

function createIntersectionObserver() {
  if (!('IntersectionObserver' in window)) {
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const index = Number(entry.target.dataset.socialMotionIndex || 0);
        enterMotion(entry.target, index);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -5% 0px', threshold: 0.08 },
  );

  return observer;
}

export function installSocialMotion() {
  const app = document.querySelector('#app');
  if (!app) {
    return;
  }

  const intersection = createIntersectionObserver();
  observeSocialSurfaces(app, intersection);

  const mutations = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }
        observeSocialSurfaces(node, intersection);
      });
    });
  });

  mutations.observe(app, { childList: true, subtree: true });
  installPressFeedback();
}
