import { formObj, state } from '../runtime.js';
import { goto, updateQuery } from '../router.js';

export async function handleFilterSubmit(event) {
  const form = event.target;

  if (form.matches('[data-global-search]')) {
    event.preventDefault();
    const query = new FormData(form).get('q') || '';
    goto(`/biblioteca?q=${encodeURIComponent(query)}`);
    return true;
  }

  if (form.matches('[data-library-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    updateQuery({
      q: values.q,
      tipo: values.tipo,
      area: values.area,
      nivel: values.nivel,
      autor: values.autor,
      palavra: values.palavra,
    });
    return true;
  }

  if (form.matches('[data-acervo-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    updateQuery({ q: values.q, categoria: values.categoria });
    return true;
  }

  if (form.matches('[data-research-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    updateQuery({ q: values.q, area: values.area });
    return true;
  }

  if (form.matches('[data-author-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    updateQuery({ q: values.q, tipo: values.tipo });
    return true;
  }

  if (form.matches('[data-project-filter]')) {
    event.preventDefault();
    updateQuery({ q: formObj(form).q });
    return true;
  }

  if (form.matches('[data-discussion-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    updateQuery({ q: values.q, categoria: values.categoria });
    return true;
  }

  if (form.matches('[data-admin-search]')) {
    event.preventDefault();
    updateQuery({ q: formObj(form).q });
    return true;
  }

  if (form.matches('[data-tech-filter]')) {
    event.preventDefault();
    const values = formObj(form);
    const query = new URLSearchParams();
    const hub = state.query.get('hub');
    if (hub) query.set('hub', hub);
    if (values.q) query.set('q', values.q);
    goto(`/oficina?${query.toString()}`);
    return true;
  }

  return false;
}
