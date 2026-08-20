export function installMotionPreferences() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');

  const apply = () => {
    document.documentElement.dataset.motion = media.matches ? 'reduced' : 'full';
  };

  apply();
  media.addEventListener?.('change', apply);
}
