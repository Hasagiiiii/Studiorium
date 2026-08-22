function motionAllowed() {
  return document.documentElement.dataset.motion !== 'reduced';
}

export function installSocialMotion() {
  document.addEventListener('pointerdown', (event) => {
    const control = event.target.closest('.social-action, .social-feed-tabs button');
    if (!control || !motionAllowed() || typeof control.animate !== 'function') return;

    control.animate(
      [{ transform: 'scale(0.975)' }, { transform: 'scale(1)' }],
      {
        duration: 180,
        easing: 'ease-out',
      },
    );
  });
}
