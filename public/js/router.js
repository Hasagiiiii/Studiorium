import { app, state, bootstrap } from './runtime.js';
import { home, biblioteca, acervo, templateDetail, pesquisas, researchDetail, autores, authorDetail, coloquio, thread, login, cadastro, escrivaninha, editor, publicar, atelie, oficina, laboratorio, adminPanel, moderacao, diretrizes, sobre, requireLogin, notFound } from './views.js';

export function goto(path){ history.pushState({},'',path); render(); scrollTo({top:0,behavior:'smooth'}); }

export async function render(){
  state.query=new URLSearchParams(location.search);
  if(!state.boot){
    app.innerHTML='<div class="loading">Abrindo os arquivos do Studiorium…</div>';
    try{ await bootstrap(); }
    catch(e){
      app.innerHTML=`<div class="errorpage"><h1>Studiorium</h1><p>${String(e.message||'Falha ao carregar.')}</p><p>O serviço online não respondeu. Tente novamente.</p></div>`;
      return;
    }
  }
  const p=location.pathname.replace(/\/+$/,'')||'/';
  if(p==='/')return home();
  if(['/biblioteca','/library'].includes(p))return biblioteca();
  if(['/oficina','/tech'].includes(p))return oficina();
  if(p==='/laboratorio')return await laboratorio();
  if(p.startsWith('/laboratorio/'))return await laboratorio(decodeURIComponent(p.split('/')[2]||''));
  if(['/acervo','/explorar','/templates'].includes(p))return acervo();
  if(p.startsWith('/templates/'))return templateDetail(decodeURIComponent(p.split('/')[2]||''));
  if(p==='/pesquisas')return pesquisas();
  if(p.startsWith('/pesquisas/'))return researchDetail(decodeURIComponent(p.split('/')[2]||''));
  if(p==='/autores')return autores();
  if(p.startsWith('/autores/'))return authorDetail(decodeURIComponent(p.split('/')[2]||''));
  if(['/coloquio','/comunidade'].includes(p))return coloquio();
  if(p.startsWith('/coloquio/')||p.startsWith('/comunidade/'))return await thread(decodeURIComponent(p.split('/')[2]||''));
  if(p==='/login')return login();
  if(p==='/cadastro')return cadastro();
  if(['/escrivaninha','/dashboard'].includes(p))return await escrivaninha();
  if(p==='/editor/novo'){
    if(!state.me)return requireLogin();
    const { api } = await import('./runtime.js');
    const d=await api('/api/projects',{method:'POST',body:JSON.stringify({title:'Novo manuscrito'})});
    history.replaceState({},'', '/editor/'+d.project.id);
    return await editor(d.project.id);
  }
  if(p.startsWith('/editor/'))return await editor(decodeURIComponent(p.split('/')[2]||''));
  if(['/publicar','/dashboard/publicar'].includes(p))return publicar();
  if(['/atelie','/banner-cientifico'].includes(p))return atelie();
  if(p==='/moderacao'||p==='/admin/moderacao')return await moderacao();
  if(p==='/admin')return await adminPanel('overview');
  if(p==='/admin/usuarios')return await adminPanel('usuarios');
  if(p==='/admin/publicacoes')return await adminPanel('publicacoes');
  if(p==='/admin/coloquio')return await adminPanel('coloquio');
  if(p==='/admin/acervo')return await adminPanel('acervo');
  if(p==='/admin/configuracoes')return await adminPanel('configuracoes');
  if(p==='/admin/registro')return await adminPanel('registro');
  if(p==='/diretrizes')return diretrizes();
  if(p==='/sobre')return sobre();
  return notFound();
}

export function updateQuery(obj){
  const q=new URLSearchParams();
  Object.entries(obj).forEach(([k,v])=>{if(v)q.set(k,v)});
  history.pushState({},'',location.pathname+(q.toString()?'?'+q:''));
  render();
}
