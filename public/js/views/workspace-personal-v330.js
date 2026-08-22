import { E, html, initials, state } from '../runtime.js';
import { link } from './core.js';
import { escrivaninha as currentEscrivaninha } from './workspace-personal-v329.js';

function cardByEyebrow(label) {
  return [...document.querySelectorAll('.card')].find(
    (card) => card.querySelector(':scope > .eyebrow')?.textContent.trim() === label,
  );
}

function profileMediaUrl(user, kind) {
  return `/api/profiles/${encodeURIComponent(user.username)}/media/${kind}`;
}

function mediaEditor(user, kind, title, description) {
  const hasMedia = kind === 'avatar' ? user.hasAvatar : user.hasCover;
  const preview = hasMedia
    ? html`<img src="${profileMediaUrl(user, kind)}" alt="${E(title)} atual" />`
    : kind === 'avatar'
      ? html`<span class="workspace-media-fallback avatar-fallback"
          >${E(initials(user.displayName))}</span
        >`
      : '<span class="workspace-media-fallback cover-fallback">Studiorium</span>';

  return html`<form class="workspace-media-editor" data-profile-media="${E(kind)}">
    <div class="workspace-media-preview ${kind}">${preview}</div>
    <div class="workspace-media-copy">
      <strong>${E(title)}</strong>
      <p>${E(description)}</p>
      <input class="field" type="file" name="image" accept="image/jpeg,image/png,image/webp" />
      <div class="actions">
        <button class="solid" type="submit" value="upload">Atualizar</button>
        ${hasMedia ? '<button class="outline" type="submit" value="remove">Remover</button>' : ''}
      </div>
    </div>
  </form>`;
}

function moveCardContents(card, slot) {
  if (!card || !slot) return;
  while (card.firstChild) slot.appendChild(card.firstChild);
  card.remove();
}

function consolidateProfileCenter(user) {
  if (!user?.username || document.querySelector('[data-workspace-profile-center]')) return;

  const profileCard = cardByEyebrow('Perfil');
  const verificationCard = document.querySelector('.verification-card');
  const securityCard = cardByEyebrow('Segurança');
  if (!profileCard || !securityCard) return;

  const center = document.createElement('section');
  center.className = 'workspace-profile-center';
  center.dataset.workspaceProfileCenter = '';
  center.innerHTML = html`<div class="workspace-profile-summary">
      <div class="workspace-profile-avatar">
        ${user.hasAvatar
          ? html`<img
              src="${profileMediaUrl(user, 'avatar')}"
              alt="Foto de ${E(user.displayName)}"
            />`
          : E(initials(user.displayName))}
      </div>
      <div class="workspace-profile-summary-copy">
        <div class="eyebrow">Perfil</div>
        <h2>${E(user.displayName)}</h2>
        <p>@${E(user.username)} · ${E(user.profileType || 'membro')}</p>
      </div>
      <div class="workspace-profile-summary-actions">
        ${link(`/autores/${encodeURIComponent(user.username)}`, 'Ver perfil público', 'outline')}
      </div>
    </div>

    <div class="workspace-profile-options">
      <details class="workspace-profile-option">
        <summary>
          <span><strong>Aparência</strong><small>Foto de perfil e capa</small></span>
          <b>+</b>
        </summary>
        <div class="workspace-settings-pane workspace-media-grid">
          ${mediaEditor(
            user,
            'avatar',
            'Foto de perfil',
            'JPG, PNG ou WebP de até 3 MB. O enquadramento é automático na exibição.',
          )}
          ${mediaEditor(
            user,
            'cover',
            'Foto de capa',
            'Use uma imagem horizontal. Ela acompanha a privacidade do seu perfil.',
          )}
        </div>
      </details>

      <details class="workspace-profile-option">
        <summary>
          <span><strong>Identidade</strong><small>Nome, bio, formação e privacidade</small></span>
          <b>+</b>
        </summary>
        <div class="workspace-settings-pane" data-profile-identity-slot></div>
      </details>

      <details class="workspace-profile-option">
        <summary>
          <span><strong>Verificação</strong><small>Credenciais e selo de especialista</small></span>
          <b>+</b>
        </summary>
        <div class="workspace-settings-pane" data-profile-verification-slot></div>
      </details>

      <details class="workspace-profile-option">
        <summary>
          <span><strong>Segurança</strong><small>Senha e proteção da conta</small></span>
          <b>+</b>
        </summary>
        <div class="workspace-settings-pane" data-profile-security-slot></div>
      </details>
    </div>`;

  const shelf = document.querySelector('.personal-shelf');
  if (shelf) shelf.before(center);
  else document.querySelector('.pagehero .shell')?.append(center);

  moveCardContents(profileCard, center.querySelector('[data-profile-identity-slot]'));
  moveCardContents(verificationCard, center.querySelector('[data-profile-verification-slot]'));
  moveCardContents(securityCard, center.querySelector('[data-profile-security-slot]'));
}

export async function escrivaninha() {
  await currentEscrivaninha();
  if (!state.me || location.pathname.replace(/\/+$/, '') !== '/escrivaninha') return;
  consolidateProfileCenter(state.me);
}
