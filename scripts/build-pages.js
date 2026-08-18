const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const out = path.join(root, '_site');
const EDGE_WEB_API = 'https://clasjlgovtfuhdcddcnq.supabase.co/functions/v1/studiorium-api-web';

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(source, out, { recursive: true });

function read(rel) {
  return fs.readFileSync(path.join(out, rel), 'utf8');
}
function write(rel, content) {
  fs.writeFileSync(path.join(out, rel), content, 'utf8');
}

let html = read('index.html')
  .replace('href="/style.css"', 'href="./style.css"')
  .replace('src="/js/main.js"', 'src="./js/main.js"')
  .replace('src="/js/password.js"', 'src="./js/password.js"');
write('index.html', html);

write('style.css', read('style.css').replaceAll("url('/css/", "url('./css/"));

let runtime = read('js/runtime.js');
runtime = runtime.replace(
  "export const toastEl = document.getElementById('toast');",
  `export const toastEl = document.getElementById('toast');\nconst PAGES_MODE = location.hostname.endsWith('.github.io');\nconst EDGE_WEB_API = '${EDGE_WEB_API}';\nconst SESSION_KEY = 'studiorium_session_token';`
);
runtime = runtime.replace(
  "const res=await fetch(path,{...options,headers,credentials:'same-origin'});",
  `const target = PAGES_MODE && path.startsWith('/api/') ? EDGE_WEB_API + path.slice(4) : path;\n  if(PAGES_MODE){ const session=sessionStorage.getItem(SESSION_KEY); if(session) headers['X-Studiorium-Session']=session; }\n  const res=await fetch(target,{...options,headers,credentials:PAGES_MODE?'omit':'same-origin'});`
);
runtime = runtime.replace(
  "if(!res.ok) throw new Error(data.error||'Não foi possível concluir a ação.');\n  return data;",
  `if(!res.ok) throw new Error(data.error||'Não foi possível concluir a ação.');\n  if(PAGES_MODE && data.sessionToken){ sessionStorage.setItem(SESSION_KEY,data.sessionToken); delete data.sessionToken; }\n  if(PAGES_MODE && path==='/api/auth/logout') sessionStorage.removeItem(SESSION_KEY);\n  return data;`
);
write('js/runtime.js', runtime);

const router = `import { app, state, bootstrap } from './runtime.js';
import { home, biblioteca, acervo, templateDetail, pesquisas, researchDetail, autores, authorDetail, coloquio, thread, login, cadastro, escrivaninha, editor, publicar, atelie, oficina, laboratorio, adminPanel, moderacao, diretrizes, sobre, requireLogin, notFound } from './views.js';

const pagesMode = location.hostname.endsWith('.github.io');
function routeState(){
  if(!pagesMode) return { path:location.pathname, query:new URLSearchParams(location.search) };
  const raw=location.hash.slice(1)||'/';
  const i=raw.indexOf('?');
  const p=i>=0?raw.slice(0,i):raw;
  return { path:p.startsWith('/')?p:'/'+p, query:new URLSearchParams(i>=0?raw.slice(i+1):'') };
}

export function goto(path){
  const next=String(path||'/');
  if(pagesMode){
    const target=next.startsWith('/')?next:'/'+next;
    if(location.hash.slice(1)===target){ render(); scrollTo({top:0,behavior:'smooth'}); return; }
    location.hash=target;
  }else{
    history.pushState({},'',next);
    render();
  }
  scrollTo({top:0,behavior:'smooth'});
}

export async function render(){
  const route=routeState();
  state.query=route.query;
  if(!state.boot){
    app.innerHTML='<div class="loading">Abrindo os arquivos do Studiorium…</div>';
    try{ await bootstrap(); }
    catch(e){
      app.innerHTML=\`<div class="errorpage"><h1>Studiorium</h1><p>\${String(e.message||'Falha ao carregar.')}</p><p>O serviço online não respondeu. Tente novamente.</p></div>\`;
      return;
    }
  }
  const p=route.path.replace(/\\/+$/,'')||'/';
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
    if(pagesMode){ location.hash='/editor/'+d.project.id; return; }
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
  if(pagesMode){
    const route=routeState();
    location.hash=route.path+(q.toString()?'?'+q:'');
  }else{
    history.pushState({},'',location.pathname+(q.toString()?'?'+q:''));
    render();
  }
}
`;
write('js/router.js', router);

let events = read('js/events.js');
events = events.replace(
  "addEventListener('popstate',render);",
  "addEventListener('popstate',render);\naddEventListener('hashchange',()=>{if(location.hostname.endsWith('.github.io'))render();});"
);
write('js/events.js', events);

let core = read('js/views/core.js');
core = core.replace(
  'const r=location.pathname;',
  "const r=location.hostname.endsWith('.github.io')?(location.hash.slice(1).split('?')[0]||'/'):location.pathname;"
);
write('js/views/core.js', core);

fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Studiorium Pages build ready:', out);
