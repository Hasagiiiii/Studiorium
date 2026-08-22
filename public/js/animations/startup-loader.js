function reducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function loaderMarkup() {
  return `
    <div class="studiorium-loader" data-startup-loader role="status" aria-live="polite">
      <div class="studiorium-loader-frame" aria-hidden="true">
        <span class="studiorium-loader-speedline speedline-a"></span>
        <span class="studiorium-loader-speedline speedline-b"></span>
        <span class="studiorium-loader-speedline speedline-c"></span>
        <svg class="studiorium-loader-emblem" viewBox="0 0 180 190" focusable="false">
          <path
            class="loader-ivy loader-ivy-left"
            d="M57 158 C24 139 29 111 53 96 C73 84 62 61 41 57 C25 53 25 34 43 27"
          />
          <path
            class="loader-ivy loader-ivy-right"
            d="M123 158 C156 139 151 111 127 96 C107 84 118 61 139 57 C155 53 155 34 137 27"
          />
          <path class="loader-leaf leaf-a" d="M48 91 C31 82 28 69 43 68 C57 69 60 79 48 91 Z" />
          <path class="loader-leaf leaf-b" d="M132 91 C149 82 152 69 137 68 C123 69 120 79 132 91 Z" />
          <path class="loader-leaf leaf-c" d="M45 42 C32 35 31 25 43 25 C54 27 56 34 45 42 Z" />
          <path class="loader-leaf leaf-d" d="M135 42 C148 35 149 25 137 25 C126 27 124 34 135 42 Z" />
          <path class="loader-cup" d="M58 67 H122 L116 113 C113 132 103 143 90 143 C77 143 67 132 64 113 Z" />
          <path class="loader-cup-rim" d="M55 65 C72 58 108 58 125 65" />
          <path class="loader-stem" d="M90 143 V161 M69 164 H111" />
          <path class="loader-ink" d="M69 80 C83 74 98 74 111 80 C105 90 102 102 91 108 C80 103 76 91 69 80 Z" />
          <circle class="loader-seal-ring" cx="90" cy="164" r="18" />
          <text class="loader-seal-letter" x="90" y="170" text-anchor="middle">S</text>
        </svg>
        <span class="studiorium-loader-caption">STUDIORIUM</span>
        <span class="studiorium-loader-subcaption">abrindo o códice</span>
      </div>
    </div>`;
}

function waitForFirstRender(app) {
  if (app.childElementCount) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!app.childElementCount) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(app, { childList: true });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 6000);
  });
}

async function dismiss(loader, startedAt) {
  const minimum = reducedMotion() ? 120 : 780;
  const elapsed = performance.now() - startedAt;
  if (elapsed < minimum) {
    await new Promise((resolve) => setTimeout(resolve, minimum - elapsed));
  }

  loader.classList.add('is-leaving');
  const duration = reducedMotion() ? 100 : 430;
  setTimeout(() => loader.remove(), duration + 40);
}

export function installStartupLoader() {
  if (document.querySelector('[data-startup-loader]')) return;
  const app = document.getElementById('app');
  if (!app) return;

  document.body.insertAdjacentHTML('afterbegin', loaderMarkup());
  const loader = document.querySelector('[data-startup-loader]');
  if (!loader) return;

  const startedAt = performance.now();
  document.documentElement.classList.add('startup-loading');

  waitForFirstRender(app)
    .then(() => dismiss(loader, startedAt))
    .finally(() => document.documentElement.classList.remove('startup-loading'));
}
