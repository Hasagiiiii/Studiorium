import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function DiscussionPage() {
  const { id = '' } = useParams();
  const { data } = useAppState();
  const discussion = data?.discussions.find((item) => item.id === id);

  if (!discussion) {
    return (
      <FeaturePage
        eyebrow="Discussão"
        title="Discussão não encontrada"
        description="O tópico pode ter sido removido, moderado ou ainda não estar disponível."
      >
        <Link to="/comunidades">Explorar comunidades</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow={discussion.category}
      title={discussion.title}
      description={`Publicado por ${discussion.authorName}`}
    >
      <article className="longform-content">
        <p>{discussion.body}</p>
      </article>
    </FeaturePage>
  );
}
