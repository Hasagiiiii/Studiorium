import { state, E, date, num, html } from '../runtime.js';
import { link, layout, empty } from './core.js';

const COMMUNITY_SPOTLIGHT = [
  ['programacao', 'Programação', 'Código, web, automação e projetos.'],
  ['pc-hardware', 'PC & Hardware', 'Montagem, diagnóstico e upgrades.'],
  ['pesquisa-cientifica', 'Pesquisa Científica', 'Métodos, escrita e fontes.'],
  ['literatura', 'Literatura', 'Livros, leituras e clubes.'],
  ['ia-automacao', 'IA & Automação', 'Agentes, integrações e aplicações.'],
];

function profileFor(id, fallback = '') {
  return (state.boot.profiles || []).find((profile) => profile.userId === id || profile.displayName === fallback);
}

function authorLine(item) {
  const profile = profileFor(item.ownerId || item.authorId || item.contributorId, item.authorName);
  const name = profile?.displayName || item.authorName || 'Comunidade Studiorium';
  const verified = profile?.verificationStatus === 'verified' || profile?.verificationStatus === 'approved';
  return html`<div class="social-author"><span class="social-avatar">${E((name || 'S').slice(0, 1).toUpperCase())}</span><span><strong>${E(name)}</strong>${verified ? '<small class="social-verified">✓ Verificado</small>' : ''}<small>${date(item.createdAt || item.publishedAt || item.updatedAt)}</small></span></div>`;
}

function publicationPost(p) {
  return html`<article class="social-post publication-card">
    ${authorLine(p)}
    <div class="social-kicker">Pesquisa · ${E(p.area || 'Geral')}</div>
    <h2>${link('/pesquisas/' + encodeURIComponent(p.slug), E(p.title))}</h2>
    <p>${E((p.abstract || '').slice(0, 330))}${(p.abstract || '').length > 330 ? '…' : ''}</p>
    ${p.coverName ? html`<a href="/pesquisas/${encodeURIComponent(p.slug)}" data-link class="social-media"><img src="/api/publications/${encodeURIComponent(p.id)}/cover" alt="Capa de ${E(p.title)}" loading="lazy" /></a>` : ''}
    <div class="social-tags">${(p.keywords || []).slice(0,4).map((tag)=>html`<span>${E(tag)}</span>`).join('')}</div>
    <div class="social-actions"><button class="social-action" type="button" data-publication-boost="${E(p.id)}">✦ <strong data-boost-count="${E(p.id)}">${num(p.boosts)}</strong> impulsos</button>${link('/pesquisas/' + encodeURIComponent(p.slug), '◌ Abrir pesquisa', 'social-action')}<span class="social-stat">${num(p.views)} leituras</span></div>
  </article>`;
}

function discussionPost(d) {
  return html`<article class="social-post discussion-card">
    ${authorLine(d)}
    <div class="social-kicker">Discussão · ${E(d.category || 'Geral')}</div>
    <h2>${link('/coloquio/' + encodeURIComponent(d.id), E(d.title))}</h2>
    <p>${E((d.body || '').slice(0, 360))}${(d.body || '').length > 360 ? '…' : ''}</p>
    <div class="social-actions">${link('/coloquio/' + encodeURIComponent(d.id), '💬 Entrar na discussão', 'social-action')}${link('/comunidades', '♧ Ver comunidades', 'social-action')}</div>
  </article>`;
}

function techPost(t) {
  return html`<article class="social-post project-card">
    ${authorLine(t)}
    <div class="social-kicker">${E(t.hub || 'Tecnologia')} · ${E(t.category || 'Tutorial')}</div>
    <h2>${link('/oficina/' + encodeURIComponent(t.slug), E(t.title))}</h2>
    <p>${E((t.summary || '').slice(0, 340))}</p>
    <div class="social-tags">${(t.tags || []).slice(0,4).map((tag)=>html`<span>${E(tag)}</span>`).join('')}</div>
    <div class="social-actions">${link('/oficina/' + encodeURIComponent(t.slug), '⚙ Abrir conteúdo', 'social-action')}</div>
  </article>`;
}

function newsPost(n) {
  return html`<article class="social-post">
    ${authorLine(n)}
    <div class="social-kicker">Notícia certificada · ${E(n.category || 'Atualizações')}</div>
    <h2>${link('/noticias/' + encodeURIComponent(n.slug), E(n.title))}</h2>
    <p>${E((n.summary || '').slice(0, 340))}</p>
    <div class="social-actions">${link('/noticias/' + encodeURIComponent(n.slug), '✦ Ler matéria', 'social-action')}<span class="social-stat">✓ Fontes e revisão editorial</span></div>
  </article>`;
}

function buildFeed() {
  const feed = [
    ...(state.boot.publications || []).slice(0,8).map((item)=>({type:'publication', item, at:item.createdAt || item.publishedAt})),
    ...(state.boot.discussions || []).slice(0,8).map((item)=>({type:'discussion', item, at:item.createdAt})),
    ...(state.boot.techResources || []).slice(0,6).map((item)=>({type:'tech', item, at:item.createdAt || item.updatedAt})),
    ...(state.boot.news || []).slice(0,5).map((item)=>({type:'news', item, at:item.publishedAt || item.createdAt})),
  ];
  return feed.sort((a,b)=>new Date(b.at || 0)-new Date(a.at || 0)).slice(0,14);
}

function feedPost(entry) {
  if (entry.type === 'publication') return publicationPost(entry.item);
  if (entry.type === 'discussion') return discussionPost(entry.item);
  if (entry.type === 'tech') return techPost(entry.item);
  return newsPost(entry.item);
}

function home() {
  const settings = state.boot.settings || {};
  const feed = buildFeed();
  const projects = [...(state.boot.codeProjects || []), ...(state.boot.communityProjects || [])].slice(0,5);
  const profiles = (state.boot.profiles || []).slice(0,5);
  layout(html`
    <section class="social-hero">
      <div class="shell social-hero-grid">
        <div class="social-hero-brand">
          <img src="/favicon.svg" alt="" class="social-brand-mark" />
          <div><div class="eyebrow">Conhecimento · comunidade · criação</div><h1>${E(settings.hero_title || 'Aprenda. Construa. Compartilhe.')}</h1><p>${E(settings.hero_text || 'Uma rede de pessoas curiosas para discutir ideias, criar projetos, publicar conhecimento e aprender em comunidade.')}</p></div>
        </div>
        <form class="searchbar social-search" data-global-search><span>⌕</span><input name="q" aria-label="Pesquisar" placeholder="Pesquisar discussões, pessoas, projetos e temas…"/><button class="solid">Pesquisar</button></form>
      </div>
    </section>
    <section class="social-shell shell">
      <aside class="social-left">
        <div class="social-panel social-menu">
          <h3>Explorar</h3>
          ${link('/comunidades','♧ Comunidades')}${link('/projetos','⌘ Projetos')}${link('/biblioteca','▤ Biblioteca')}${link('/coloquio','◌ Discussões')}${link('/oficina','⚙ Tecnologia')}${link('/noticias','✦ Notícias')}
        </div>
        <div class="social-panel"><div class="social-panel-head"><h3>Comunidades</h3>${link('/comunidades','Ver todas')}</div>${COMMUNITY_SPOTLIGHT.map(([slug,name,desc])=>html`<a class="community-spot" href="/comunidades/${slug}" data-link><span class="community-icon">${E(name.slice(0,1))}</span><span><strong>${E(name)}</strong><small>${E(desc)}</small></span><b>+</b></a>`).join('')}</div>
      </aside>
      <main class="social-feed">
        <div class="social-feed-tabs"><button class="active" type="button">Para você</button>${link('/comunidades','Seguindo')}${link('/pesquisas','Em alta')}${link('/coloquio','Novos')}</div>
        ${state.me ? html`<div class="social-composer"><span class="social-avatar">${E((state.me.displayName || 'S').slice(0,1))}</span><div><strong>Compartilhe algo com a comunidade</strong><p>Publique uma pesquisa, abra uma discussão ou mostre um projeto.</p></div><div class="actions">${link('/publicar','Publicar','solid')}${link('/comunidades','Discutir','soft')}</div></div>` : html`<div class="social-composer guest"><div><strong>Entre para fazer parte da conversa.</strong><p>Siga comunidades, publique conhecimento e participe das discussões.</p></div><div class="actions">${link('/cadastro','Criar conta','solid')}${link('/login','Entrar','outline')}</div></div>`}
        <div class="social-feed-list">${feed.length ? feed.map(feedPost).join('') : empty('A timeline ainda não tem publicações. Seja a primeira pessoa a iniciar uma conversa.')}</div>
      </main>
      <aside class="social-right">
        <div class="social-panel"><div class="social-panel-head"><h3>Projetos em alta</h3>${link('/projetos','Ver todos')}</div>${projects.length ? projects.map((p)=>html`<a class="social-list-item" href="/projetos" data-link><span class="project-mini">⌘</span><span><strong>${E(p.title)}</strong><small>${E((p.description || p.type || 'Projeto da comunidade').slice(0,70))}</small></span></a>`).join('') : '<p class="muted">Os primeiros projetos vão aparecer aqui.</p>'}</div>
        <div class="social-panel"><div class="social-panel-head"><h3>Pessoas para conhecer</h3>${link('/autores','Autores')}</div>${profiles.map((p)=>html`<a class="social-list-item" href="/autores/${encodeURIComponent(p.username)}" data-link><span class="social-avatar">${E((p.displayName || p.username || 'S').slice(0,1))}</span><span><strong>${E(p.displayName || p.username)}</strong><small>${E(p.profileType || 'Membro')} ${p.verifiedSpecialty ? '· '+E(p.verifiedSpecialty) : ''}</small></span></a>`).join('')}</div>
        <div class="social-panel social-quote"><span>“</span><p>Grandes ideias começam com boas discussões.</p><small>Studiorium</small></div>
      </aside>
    </section>`);
}

export { home };
