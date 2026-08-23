import { api, E, date, html, initials, state } from '../runtime.js';
import { empty, link } from './core.js';
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
      <input class="field" type="file" name="image" accept="image/*,.heic,.heif" />
      <small>A foto é otimizada automaticamente para manter boa qualidade ocupando pouco espaço.</small>
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
            'Escolha uma foto da câmera ou galeria. O enquadramento é automático na exibição.',
          )}
          ${mediaEditor(
            user,
            'cover',
            'Foto de capa',
            'Prefira uma imagem horizontal. Ela acompanha a privacidade do seu perfil.',
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

function templateRow(template, options = {}) {
  return html`<div class="project">
    <div class="min-width-zero">
      <h3>${E(template.title)}</h3>
      <p>${E(template.status)} · atualizado ${date(template.updatedAt)}</p>
    </div>
    <div class="actions">
      ${options.public
        ? link(`/modelos-livres/${encodeURIComponent(template.id)}`, 'Abrir', 'outline')
        : ''}
      ${!template.deletedAt
        ? link(`/estudio-templates/${encodeURIComponent(template.id)}`, 'Editar', 'outline')
        : ''}
      ${template.deletedAt
        ? html`<button class="outline" type="button" data-restore-template="${E(template.id)}">
              Restaurar
            </button>
            <button class="dangerbtn" type="button" data-purge-template="${E(template.id)}">
              Excluir definitivamente
            </button>`
        : html`<button class="dangerbtn" type="button" data-trash-template="${E(template.id)}">
            Excluir
          </button>`}
    </div>
  </div>`;
}

async function installTemplateCollection() {
  if (document.querySelector('[data-workspace-templates]')) return;
  const { templates = [] } = await api('/api/custom-templates/mine');
  const active = templates.filter((template) => !template.deletedAt);
  const working = active.filter((template) => template.status !== 'published');
  const published = active.filter((template) => template.status === 'published');
  const trashed = templates.filter((template) => template.deletedAt);
  const section = document.createElement('section');
  section.className = 'card';
  section.dataset.workspaceTemplates = '';
  section.innerHTML = html`<div class="sectionhead compact-head">
      <div>
        <div class="eyebrow">Criações</div>
        <h2>Seus templates</h2>
        <p>Gerencie aqui. Novas criações começam somente na Comunidade de Criação.</p>
      </div>
      ${link('/comunidades/design-templates', 'Ir para Criação', 'outline')}
    </div>
    ${working.map((template) => templateRow(template)).join('') ||
    empty('Nenhum template em edição ou revisão.')}
    <details class="trash-panel workspace-published-vault">
      <summary>Publicados (${published.length})</summary>
      ${published.map((template) => templateRow(template, { public: true })).join('') ||
      empty('Nenhum template publicado.')}
    </details>
    ${trashed.length
      ? html`<details class="trash-panel">
          <summary>Lixeira (${trashed.length})</summary>
          ${trashed.map((template) => templateRow(template)).join('')}
        </details>`
      : ''}`;

  const shelf = document.querySelector('.personal-shelf');
  if (shelf) shelf.before(section);
  else document.querySelector('.pagehero .shell')?.append(section);
}

export async function escrivaninha() {
  await currentEscrivaninha();
  if (!state.me || location.pathname.replace(/\/+$/, '') !== '/escrivaninha') return;
  consolidateProfileCenter(state.me);
  try {
    await installTemplateCollection();
  } catch {
    // A Escrivaninha continua funcional caso a coleção de templates não responda.
  }
}
