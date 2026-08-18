import { app, state, bootstrap, E, html } from './runtime.js';
import {
  home,
  biblioteca,
  acervo,
  templateDetail,
  pesquisas,
  researchDetail,
  autores,
  authorDetail,
  coloquio,
  thread,
  login,
  requestPasswordReset,
  resetPassword,
  cadastro,
  escrivaninha,
  editor,
  publicar,
  atelie,
  oficina,
  laboratorio,
  adminPanel,
  moderacao,
  diretrizes,
  sobre,
  requireLogin,
  notFound,
  noticias,
  newsDetail,
  redacao,
  templateStudio,
  templateEditor,
  publicCustomTemplate,
} from './views.js';

export function goto(path) {
  history.pushState({}, '', path);
  scrollTo({ top: 0, behavior: 'smooth' });
  return render();
}

function showRenderError(error) {
  app.innerHTML = html`<div class="errorpage">
    <h1>Studiorium</h1>
    <p>${E(error?.message || 'Falha ao carregar.')}</p>
    <p>O serviço online não respondeu após novas tentativas.</p>
    <button class="solid" type="button" data-retry-bootstrap>Tentar novamente</button>
  </div>`;
}

async function renderRoute() {
  state.query = new URLSearchParams(location.search);
  if (!state.boot) {
    app.innerHTML = '<div class="loading">Abrindo os arquivos do Studiorium…</div>';
    try {
      await bootstrap();
    } catch (e) {
      showRenderError(e);
      return;
    }
  }
  const p = location.pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return home();
  if (['/biblioteca', '/library'].includes(p)) return biblioteca();
  if (['/oficina', '/tech'].includes(p)) return oficina();
  if (p === '/laboratorio') return await laboratorio();
  if (p.startsWith('/laboratorio/'))
    return await laboratorio(decodeURIComponent(p.split('/')[2] || ''));
  if (['/acervo', '/explorar', '/templates'].includes(p)) return acervo();
  if (p.startsWith('/templates/')) return templateDetail(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/pesquisas') return pesquisas();
  if (p.startsWith('/pesquisas/')) return researchDetail(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/autores') return autores();
  if (p.startsWith('/autores/')) return authorDetail(decodeURIComponent(p.split('/')[2] || ''));
  if (['/coloquio', '/comunidade'].includes(p)) return coloquio();
  if (p.startsWith('/coloquio/') || p.startsWith('/comunidade/'))
    return await thread(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/login') return login();
  if (p === '/recuperar-senha') return requestPasswordReset();
  if (p === '/redefinir-senha') return resetPassword();
  if (p === '/noticias') return noticias();
  if (p.startsWith('/noticias/'))
    return await newsDetail(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/redacao') return await redacao();
  if (p.startsWith('/redacao/')) return await redacao(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/estudio-templates') return await templateStudio();
  if (p.startsWith('/estudio-templates/'))
    return await templateEditor(decodeURIComponent(p.split('/')[2] || ''));
  if (p.startsWith('/modelos-livres/'))
    return await publicCustomTemplate(decodeURIComponent(p.split('/')[2] || ''));
  if (p === '/cadastro') return cadastro();
  if (['/escrivaninha', '/dashboard'].includes(p)) return await escrivaninha();
  if (p === '/editor/novo') {
    if (!state.me) return requireLogin();
    const { api } = await import('./runtime.js');
    const d = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Novo manuscrito' }),
    });
    history.replaceState({}, '', '/editor/' + d.project.id);
    return await editor(d.project.id);
  }
  if (p.startsWith('/editor/')) return await editor(decodeURIComponent(p.split('/')[2] || ''));
  if (['/publicar', '/dashboard/publicar'].includes(p)) return publicar();
  if (['/atelie', '/banner-cientifico'].includes(p)) return atelie();
  if (p === '/moderacao' || p === '/admin/moderacao') return await moderacao();
  if (p === '/admin') return await adminPanel('overview');
  if (p === '/admin/usuarios') return await adminPanel('usuarios');
  if (p === '/admin/publicacoes') return await adminPanel('publicacoes');
  if (p === '/admin/coloquio') return await adminPanel('coloquio');
  if (p === '/admin/acervo') return await adminPanel('acervo');
  if (p === '/admin/noticias') return await adminPanel('noticias');
  if (p === '/admin/configuracoes') return await adminPanel('configuracoes');
  if (p === '/admin/registro') return await adminPanel('registro');
  if (p === '/diretrizes') return diretrizes();
  if (p === '/sobre') return sobre();
  return notFound();
}

export async function render() {
  try {
    await renderRoute();
  } catch (error) {
    showRenderError(error);
  }
}

export function updateQuery(obj) {
  const q = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  history.pushState({}, '', location.pathname + (q.toString() ? '?' + q : ''));
  render();
}
