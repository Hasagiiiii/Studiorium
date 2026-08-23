import { Link } from 'react-router-dom';
import { useAppState } from '../../../app/state/useAppState.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';

export function NotificationsPage() {
  const { data } = useAppState();

  if (!data?.user) {
    return (
      <FeaturePage
        eyebrow="Notificações"
        title="Entre para ver suas notificações"
        description="As notificações são privadas e vinculadas à sua conta."
      >
        <Link className="button primary" to="/entrar">Entrar</Link>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      eyebrow="Notificações"
      title="Atualizações importantes"
      description="Seguidores, respostas, curtidas, menções e eventos das suas comunidades aparecem aqui."
    >
      <div className="empty-state">
        <p>Você não tem notificações carregadas nesta sessão.</p>
      </div>
    </FeaturePage>
  );
}
