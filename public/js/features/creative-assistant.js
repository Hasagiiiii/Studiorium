import { api, toast } from '../runtime.js';
import { goto } from '../router.js';

const BLUEPRINTS = {
  banner: {
    title: 'Banner científico',
    description: 'Estrutura inicial guiada para organizar uma apresentação científica visual.',
    pageSize: 'A4',
    blocks: [
      ['heading', 'Título do projeto'],
      ['text', 'Autores, instituição, orientação e contexto do trabalho.'],
      ['heading', 'Introdução'],
      ['text', 'Apresente o problema, contexto e justificativa da pesquisa.'],
      ['heading', 'Objetivos'],
      ['text', 'Registre o objetivo geral e, se necessário, os objetivos específicos.'],
      ['heading', 'Metodologia'],
      ['text', 'Descreva procedimentos, participantes, materiais e etapas.'],
      ['heading', 'Resultados'],
      ['text', 'Organize achados, dados, imagens e evidências principais.'],
      ['heading', 'Conclusão'],
      ['text', 'Sintetize o que foi aprendido e os próximos passos.'],
      ['heading', 'Referências'],
      ['text', 'Liste as fontes realmente utilizadas e verificadas.'],
    ],
  },
  slides: {
    title: 'Apresentação guiada',
    description: 'Roteiro inicial para construir uma apresentação com narrativa clara.',
    pageSize: 'Apresentação',
    blocks: [
      ['heading', 'Título da apresentação'],
      ['text', 'Subtítulo, autoria e contexto.'],
      ['heading', 'Contexto'],
      ['text', 'O que a audiência precisa saber antes do tema principal?'],
      ['heading', 'Questão central'],
      ['text', 'Qual problema, pergunta ou ideia orienta esta apresentação?'],
      ['heading', 'Evidências'],
      ['text', 'Dados, exemplos, argumentos e referências que sustentam a explicação.'],
      ['heading', 'Síntese'],
      ['text', 'Retome a ideia central e deixe uma conclusão clara.'],
    ],
  },
  estudo: {
    title: 'Material de estudo',
    description: 'Estrutura inicial para transformar um tema em material de revisão organizado.',
    pageSize: 'A4',
    blocks: [
      ['heading', 'Tema de estudo'],
      ['text', 'Defina o assunto e o objetivo desta revisão.'],
      ['heading', 'Conceitos-chave'],
      ['text', 'Liste definições, fórmulas, eventos ou ideias essenciais.'],
      ['heading', 'Resumo'],
      ['text', 'Explique o conteúdo com suas próprias palavras e exemplos.'],
      ['heading', 'Prática'],
      ['text', 'Inclua perguntas, exercícios ou aplicações para verificar a compreensão.'],
      ['heading', 'Fontes'],
      ['text', 'Registre livros, artigos, aulas ou documentos consultados.'],
    ],
  },
};

function documentFor(blueprint) {
  return {
    settings: {
      background: '#f2eadb',
      textColor: '#2e2922',
      accentColor: '#8b6336',
      pageSize: blueprint.pageSize,
    },
    blocks: blueprint.blocks.map(([type, content]) => ({
      id: `block_${crypto.randomUUID()}`,
      type,
      content,
    })),
  };
}

async function createFromBlueprint(button) {
  const blueprint = BLUEPRINTS[button.dataset.guidedTemplate];
  if (!blueprint) return;

  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparando…';
  try {
    const result = await api('/api/custom-templates', {
      method: 'POST',
      body: JSON.stringify({
        title: blueprint.title,
        description: blueprint.description,
        document: documentFor(blueprint),
        sourceType: 'editor',
      }),
    });
    toast('Estrutura inicial criada. Personalize livremente no editor.');
    goto(`/estudio-templates/${encodeURIComponent(result.template.id)}`);
  } catch (error) {
    toast(error?.message || 'Não foi possível preparar este material.');
    button.disabled = false;
    button.textContent = original;
  }
}

export function installCreativeAssistant() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-guided-template]');
    if (!button) return;
    event.preventDefault();
    createFromBlueprint(button);
  });
}
