const REVEAL_TARGETS = [
  '.library-card',
  '.book-card',
  '.news-card',
  '.community-resource-card',
  '.community-discussion-item',
  '.creation-community-hub .studio-card',
  '.creation-community-hub .studio-guided-option',
  '.profile-social-card',
  '.workspace-profile-center',
].join(',');

function reducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function routeTheme() {
  const path = location.pathname;
  if (path.startsWith('/biblioteca') || path.startsWith('/pesquisas')) return 'library';
  if (path.startsWith('/livros')) return 'books';
  if (path.startsWith('/noticias')) return 'news';
  if (path.startsWith('/comunidades')) return 'community';
  if (path.startsWith('/autores')) return 'profile';
  if (path.startsWith('/escrivaninha')) return 'workspace';
  if (path.startsWith('/estudio-templates') || path.startsWith('/modelos-livres'))
    return 'creation';
  return 'general';
}

function tagRoute() {
  document.documentElement.dataset.editorialMotion = routeTheme();
}

function reveal(element, index = 0) {
  if (reducedMotion() || element.dataset.editorialMotionReady) return;
  element.dataset.editorialMotionReady = 'true';
  const theme = routeTheme();
  const keyframes = {
    library: [
      { opacity: 0, transform: 'translateY(18px) rotateX(2deg)' },
      { opacity: 1, transform: 'translateY(0) rotateX(0)' },
    ],
    books: [
      { opacity: 0, transform: 'translateX(-12px) rotateY(-5deg)' },
      { opacity: 1, transform: 'translateX(0) rotateY(0)' },
    ],
    news: [
      { opacity: 0, transform: 'translateY(10px)', clipPath: 'inset(0 100% 0 0)' },
      { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
    ],
    community: [
      { opacity: 0, transform: 'translateY(12px) scale(.985)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    creation: [
      { opacity: 0, transform: 'scaleY(.82) translateY(-8px)', transformOrigin: 'top center' },
      { opacity: 1, transform: 'scaleY(1) translateY(0)', transformOrigin: 'top center' },
    ],
    profile: [
      { opacity: 0, transform: 'translateY(8px)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
    workspace: [
      { opacity: 0, transform: 'translateY(12px) scale(.99)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    general: [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  };

  element.animate(keyframes[theme] || keyframes.general, {
    duration: theme === 'creation' ? 560 : 430,
    delay: Math.min(index * 34, 220),
    easing: 'cubic-bezier(.2,.82,.22,1)',
    fill: 'backwards',
  });
}

function installRevealObserver(root) {
  const items = [...root.querySelectorAll(REVEAL_TARGETS)].filter(
    (item) => !item.dataset.editorialObserved,
  );
  if (!items.length) return;

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((item, index) => {
      item.dataset.editorialObserved = 'true';
      reveal(item, index);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target, index);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((item) => {
    item.dataset.editorialObserved = 'true';
    observer.observe(item);
  });
}

function sealFeedback(target) {
  if (!target || reducedMotion()) return;
  target.classList.remove('editorial-seal-hit');
  void target.offsetWidth;
  target.classList.add('editorial-seal-hit');
  setTimeout(() => target.classList.remove('editorial-seal-hit'), 520);
}

function inkFeedback(target) {
  if (!target || reducedMotion()) return;
  target.animate(
    [
      { filter: 'brightness(1)', transform: 'translateY(0)' },
      { filter: 'brightness(1.08)', transform: 'translateY(-1px)', offset: 0.5 },
      { filter: 'brightness(1)', transform: 'translateY(0)' },
    ],
    { duration: 300, easing: 'ease-out' },
  );
}

function enhance(root = document) {
  tagRoute();
  installRevealObserver(root);
}

export function installEditorialMotion() {
  const app = document.getElementById('app');
  if (!app) return;

  document.addEventListener('studiorium:rendered', () => {
    requestAnimationFrame(() => enhance(app));
  });

  addEventListener(
    'click',
    (event) => {
      const sealAction = event.target.closest?.(
        '[data-community-join], [data-community-leave], [data-publication-boost]',
      );
      if (sealAction) sealFeedback(sealAction);

      const newsAction = event.target.closest?.('.news-card a, .library-card a, .book-card button');
      if (newsAction) inkFeedback(newsAction);
    },
    true,
  );

  if (app.childElementCount) enhance(app);
}
