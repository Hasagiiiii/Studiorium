import { state, api, E, date, num, initials, toast, html } from '../runtime.js';
import { goto } from '../router.js';
import {
  link,
  nav,
  footer,
  layout,
  empty,
  templateCard,
  publicationCard,
  discussionRow,
} from './core.js';

function atelie() {
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="sectionhead">
          <div>
            <div class="eyebrow">Officina scientifica</div>
            <h1 class="pagetitle">Ateliê Científico</h1>
            <p>
              Monte um banner acadêmico e exporte usando a impressão do navegador. O conteúdo fica
              no seu dispositivo enquanto você edita.
            </p>
          </div>
        </div>
        <div class="atelier">
          <form class="card" data-poster-form>
            <div class="formrow">
              <label class="label">Título</label
              ><textarea class="field" name="title" rows="2">
Título do trabalho científico</textarea
              >
            </div>
            <div class="formrow">
              <label class="label">Autores</label
              ><input class="field" name="authors" value="Nome do Autor · Orientador(a)" />
            </div>
            <div class="formrow">
              <label class="label">Instituição / evento</label
              ><input class="field" name="institution" value="Instituição · Mostra Científica" />
            </div>
            ${['Introdução', 'Objetivos', 'Metodologia', 'Resultados', 'Conclusão', 'Referências']
              .map(
                (x, i) =>
                  html`<div class="formrow">
                    <label class="label">${x}</label
                    ><textarea class="textarea" name="s${i}">
${i === 0
                        ? 'Contextualize o tema e apresente o problema investigado.'
                        : i === 1
                          ? 'Descreva o objetivo geral e os objetivos específicos.'
                          : i === 2
                            ? 'Explique materiais, participantes e procedimentos utilizados.'
                            : i === 3
                              ? 'Apresente os principais achados, dados ou observações.'
                              : i === 4
                                ? 'Retome o objetivo e sintetize o que foi aprendido.'
                                : 'Liste as principais fontes conforme a norma adotada.'}</textarea
                    >
                  </div>`,
              )
              .join('')}<button type="button" class="solid" data-print>
              Imprimir / salvar PDF
            </button>
          </form>
          <div class="poster-shell">
            <article class="poster" id="poster">
              <header>
                <div class="catno" style="color:#6d5b43;margin-bottom:12px">
                  STUDIORIUM · ATELIÊ CIENTÍFICO
                </div>
                <h1 data-poster="title">Título do trabalho científico</h1>
                <div class="authors" data-poster="authors">Nome do Autor · Orientador(a)</div>
                <div class="small" style="margin-top:7px" data-poster="institution">
                  Instituição · Mostra Científica
                </div>
              </header>
              <div class="postergrid">
                ${[
                  'Introdução',
                  'Objetivos',
                  'Metodologia',
                  'Resultados',
                  'Conclusão',
                  'Referências',
                ]
                  .map(
                    (x, i) =>
                      html`<section class="postersection">
                        <h2>${x}</h2>
                        <p data-poster="s${i}"></p>
                      </section>`,
                  )
                  .join('')}
              </div>
              <footer>Studiorium · Conhecimento com autoria, clareza e responsabilidade.</footer>
            </article>
          </div>
        </div>
      </div>
    </section>`,
  );
  setTimeout(syncPoster, 0);
}

function syncPoster() {
  const f = document.querySelector('[data-poster-form]');
  if (!f) return;
  new FormData(f).forEach((v, k) => {
    const out = document.querySelector(`[data-poster="${CSS.escape(k)}"]`);
    if (out) out.textContent = v;
  });
}

function diretrizes() {
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">Regula communitatis</div>
        <h1 class="pagetitle">Diretrizes da comunidade</h1>
        <p>
          Estas regras orientam o protótipo e a fila de moderação. Para colocar a plataforma em
          produção pública, a política deve ser revisada juridicamente e acompanhada de processos
          humanos de moderação, privacidade e resposta a incidentes.
        </p>
        <div class="policygrid" style="margin-top:28px">
          <div class="policy">
            <h3>1. Respeito e não discriminação</h3>
            <p>
              São proibidos ataques, incitação ao ódio e discriminação por raça, cor, origem,
              nacionalidade, gênero, sexo, deficiência, religião ou qualquer outra característica
              protegida.
            </p>
          </div>
          <div class="policy">
            <h3>2. Proteção de crianças e adolescentes</h3>
            <p>
              É proibido sexualizar, explorar, ameaçar, aliciar, expor dados pessoais ou publicar
              conteúdo que coloque menores em risco. Perfis de menores ficam privados por padrão
              nesta edição.
            </p>
          </div>
          <div class="policy">
            <h3>3. Autoria e integridade acadêmica</h3>
            <p>
              Trabalhos devem identificar autoria e fontes. Plágio, falsificação de dados e
              apresentação de conteúdo de terceiros como próprio podem ser removidos.
            </p>
          </div>
          <div class="policy">
            <h3>4. Privacidade</h3>
            <p>
              Não publique endereço, documentos, telefone, dados escolares sensíveis ou outros dados
              pessoais de terceiros sem base legítima e autorização adequada.
            </p>
          </div>
          <div class="policy">
            <h3>5. Denúncia e revisão</h3>
            <p>
              Conteúdos podem ser denunciados. Risco envolvendo menores ou conteúdo sexual recebe
              prioridade urgente na fila de moderação.
            </p>
          </div>
          <div class="policy">
            <h3>6. Limite do protótipo</h3>
            <p>
              A filtragem automática é apenas uma primeira barreira. Nenhum filtro por palavras
              substitui moderação humana, procedimentos de segurança e conformidade legal.
            </p>
          </div>
        </div>
      </div>
    </section>`,
  );
}

function sobre() {
  layout(
    html`<section class="pagehero">
      <div class="shell">
        <div class="eyebrow">De Studiorium</div>
        <h1 class="pagetitle">Uma oficina digital para estudo e autoria.</h1>
        <p>
          O Studiorium combina acervo de templates, editor de trabalhos, publicação acadêmica,
          perfis de autores, discussões e um ateliê de banners em uma estética inspirada em
          bibliotecas, arquivos e universidades históricas.
        </p>
        <div class="featuregrid" style="margin-top:30px">
          <div class="feature">
            <div class="glyph">I</div>
            <h3>Estudar</h3>
            <p>
              Encontrar modelos e referências organizadas para atividades escolares e
              universitárias.
            </p>
          </div>
          <div class="feature">
            <div class="glyph">II</div>
            <h3>Criar</h3>
            <p>Transformar um modelo em projeto, editar seções e preparar materiais científicos.</p>
          </div>
          <div class="feature">
            <div class="glyph">III</div>
            <h3>Publicar</h3>
            <p>Compartilhar trabalhos com autoria e participar de discussões moderadas.</p>
          </div>
        </div>
      </div>
    </section>`,
  );
}

export { atelie, syncPoster, diretrizes, sobre };
