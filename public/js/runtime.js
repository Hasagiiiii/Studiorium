export const app = document.getElementById('app');
export const toastEl = document.getElementById('toast');
export const state = { boot:null, me:null, route:'/', params:{}, query:new URLSearchParams(location.search), mobile:false };

export const E = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const date = v => v ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(v)) : '—';
export const num = v => new Intl.NumberFormat('pt-BR').format(Number(v||0));
export const initials = v => String(v||'S').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
export function fileToBase64(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result||'').split(',')[1]||''); r.onerror=()=>reject(new Error('Não foi possível ler o arquivo.')); r.readAsDataURL(file); }); }
export function toast(msg, error=false){ toastEl.textContent=msg; toastEl.className='toast show'+(error?' error':''); clearTimeout(toast._t); toast._t=setTimeout(()=>toastEl.className='toast',3300); }
export async function api(path, options={}){
  const headers = { ...(options.headers||{}) };
  if (options.body !== undefined && !headers['Content-Type']) headers['Content-Type']='application/json';
  const res=await fetch(path,{...options,headers,credentials:'same-origin'});
  if (res.status === 204) return {};
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Não foi possível concluir a ação.');
  return data;
}
export async function bootstrap(){ state.boot=await api('/api/bootstrap'); state.me=state.boot.user; }
export function formObj(form){ return Object.fromEntries(new FormData(form).entries()); }
