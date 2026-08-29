export type CommunityCreationStarter = {
  id: string;
  label: string;
  title: string;
  body: string;
  category: string;
};

const starters: CommunityCreationStarter[] = [
  {
    id: 'study-question',
    label: 'Pergunta de estudo',
    title: 'Dúvida sobre…',
    body: 'Contexto da dúvida:\n\nO que eu já tentei:\n\nOnde estou travando:',
    category: 'Estudo',
  },
  {
    id: 'resource-exchange',
    label: 'Troca de material',
    title: 'Material útil sobre…',
    body: 'O que este material ajuda a estudar:\n\nPara quem pode ser útil:\n\nObservações ou contexto:',
    category: 'Materiais',
  },
  {
    id: 'group-project',
    label: 'Projeto em grupo',
    title: 'Ideia de projeto: …',
    body: 'Objetivo:\n\nO que precisamos construir ou investigar:\n\nComo outras pessoas podem participar:',
    category: 'Projetos',
  },
];

type Props = {
  onSelect: (starter: CommunityCreationStarter) => void;
};

export function CommunityCreationStarters({ onSelect }: Props) {
  return (
    <section className="community-creation-starters" aria-labelledby="community-starters-title">
      <div className="community-starters-heading">
        <div>
          <span className="eyebrow">Acervo de criação</span>
          <h3 id="community-starters-title">Começos rápidos para esta comunidade</h3>
        </div>
        <p>Escolha uma estrutura, revise o texto e publique só quando estiver pronto.</p>
      </div>

      <div className="community-starter-list" role="list">
        {starters.map((starter) => (
          <button
            className="community-starter-card"
            type="button"
            role="listitem"
            key={starter.id}
            onClick={() => onSelect(starter)}
          >
            <span>{starter.category}</span>
            <strong>{starter.label}</strong>
            <small>Usar no composer</small>
          </button>
        ))}
      </div>
    </section>
  );
}
