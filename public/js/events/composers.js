import { html } from '../runtime.js';

export function techResourceForm() {
  return html`
    <form class="card" data-tech-resource>
      <div class="eyebrow">Contribuição da comunidade</div>
      <h3>Publicar na Tech & Oficina</h3>
      <div class="formrow">
        <label class="label">Título</label>
        <input class="field" name="title" required minlength="5" />
      </div>
      <div class="formgrid">
        <div>
          <label class="label">Área</label>
          <select class="select" name="hub">
            <option>Tecnologia</option>
            <option>Jogos</option>
            <option>PC & Hardware</option>
            <option>Carros</option>
            <option>Motos</option>
          </select>
        </div>
        <div>
          <label class="label">Tipo</label>
          <select class="select" name="category">
            <option>Tutorial</option>
            <option>Projeto da comunidade</option>
            <option>Resolução de problema</option>
            <option>Guia de compra</option>
            <option>Compatibilidade</option>
            <option>Manutenção</option>
          </select>
        </div>
      </div>
      <div class="formrow">
        <label class="label">Resumo</label>
        <textarea class="textarea" name="summary" required></textarea>
      </div>
      <div class="formrow">
        <label class="label">Conteúdo</label>
        <textarea class="textarea" name="body" required></textarea>
      </div>
      <div class="formrow">
        <label class="label">Tags (separadas por vírgula)</label>
        <input class="field" name="tags" />
      </div>
      <div class="actions">
        <button class="solid" type="submit">Enviar para revisão</button>
        <button class="soft" type="reset">Limpar formulário</button>
        <button class="outline" type="button" data-cancel-tech>Cancelar</button>
      </div>
    </form>
  `;
}

export function discussionForm() {
  return html`
    <form class="card" data-new-discussion-form style="margin-top: 20px">
      <div class="eyebrow">Nova mesa</div>
      <h3>Abrir discussão</h3>
      <div class="formrow">
        <label class="label">Título</label>
        <input class="field" name="title" required minlength="6" />
      </div>
      <div class="formrow">
        <label class="label">Categoria</label>
        <input class="field" name="category" placeholder="Ex.: Matemática, Educação, Tecnologia" />
      </div>
      <div class="formrow">
        <label class="label">Contexto da discussão</label>
        <textarea class="textarea" name="body" required minlength="10"></textarea>
      </div>
      <button class="solid">Publicar discussão</button>
    </form>
  `;
}
