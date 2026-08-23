import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminDashboard } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';
import { FeaturePage } from '../../../components/ui/FeaturePage.js';
import { AdminEditorialQueues } from '../components/AdminEditorialQueues.js';

type LoadState =
  | { status: 'loading'; value: AdminDashboard | null; error: null }
  | { status: 'ready'; value: AdminDashboard; error: null }
  | { status: 'error'; value: AdminDashboard | null; error: string };

export function AdminPage() {
  const { pushToast } = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading', value: null, error: null });
  const [busy, setBusy] = useState('');
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});
  const [suspensionReasons, setSuspensionReasons] = useState<Record<string, string>>({});
  const [roleSelections, setRoleSelections] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setState((current) => ({ status: 'loading', value: current.value, error: null }));
    try {
      setState({ status: 'ready', value: await services.admin.dashboard(), error: null });
    } catch (cause) {
      setState((current) => ({
        status: 'error',
        value: current.value,
        error: cause instanceof Error ? cause.message : 'Não foi possível carregar a administração.',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const permissions = useMemo(() => new Set(state.value?.permissions ?? []), [state.value]);
  const canModerate = permissions.has('admin.full') || permissions.has('moderation.content');
  const canManageUsers = permissions.has('admin.full') || permissions.has('users.manage');
  const canManageRoles = permissions.has('admin.full') || permissions.has('roles.manage');
  const canCurate = permissions.has('admin.full') || permissions.has('content.curate');

  async function perform(key: string, action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(key);
    try {
      await action();
      pushToast({ message: success, tone: 'success' });
      await load();
    } catch (cause) {
      pushToast({
        message: cause instanceof Error ? cause.message : 'Não foi possível concluir a ação.',
        tone: 'error',
      });
    } finally {
      setBusy('');
    }
  }

  if (state.status === 'loading' && !state.value) {
    return (
      <FeaturePage
        eyebrow="Administração"
        title="Carregando painel…"
        description="Validando suas permissões e filas administrativas."
      />
    );
  }

  if (state.status === 'error' && !state.value) {
    return (
      <FeaturePage
        eyebrow="Administração"
        title="Painel indisponível"
        description={state.error || 'Sua conta não possui acesso a esta área.'}
      >
        <button className="button secondary" type="button" onClick={() => void load()}>
          Tentar novamente
        </button>
      </FeaturePage>
    );
  }

  const dashboard = state.value;
  if (!dashboard) return null;

  return (
    <FeaturePage
      eyebrow="Administração"
      title="Governança do Lorion"
      description="Moderação, revisão editorial, verificações, usuários, cargos e auditoria em uma área protegida por permissões."
    >
      {state.status === 'error' ? <p className="inline-error">{state.error}</p> : null}

      <section className="resource-section admin-section">
        <header>
          <div>
            <span className="eyebrow">Moderação</span>
            <h2>Denúncias</h2>
          </div>
        </header>
        {dashboard.reports.length ? (
          <div className="resource-grid admin-grid">
            {dashboard.reports.map((report) => (
              <article key={report.id} className="resource-card">
                <span className="eyebrow">{report.priority} · {report.status}</span>
                <h3>{report.category}</h3>
                <p>{report.description || 'Sem descrição adicional.'}</p>
                <small>{report.targetType}: {report.targetId}</small>
                {canModerate ? (
                  <>
                    <label>
                      Nota de moderação
                      <textarea
                        rows={3}
                        maxLength={1500}
                        value={reportNotes[report.id] || ''}
                        onChange={(event) =>
                          setReportNotes((current) => ({ ...current, [report.id]: event.target.value }))
                        }
                      />
                    </label>
                    <div className="form-actions">
                      {(['reviewing', 'resolved', 'dismissed'] as const).map((status) => (
                        <button
                          key={status}
                          className={status === 'dismissed' ? 'button secondary' : 'button primary'}
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            void perform(
                              `report:${report.id}:${status}`,
                              () => services.admin.decideReport(report.id, {
                                status,
                                note: reportNotes[report.id] || '',
                              }),
                              'Denúncia atualizada.',
                            )
                          }
                        >
                          {busy === `report:${report.id}:${status}`
                            ? 'Salvando…'
                            : status === 'reviewing'
                              ? 'Em análise'
                              : status === 'resolved'
                                ? 'Resolver'
                                : 'Descartar'}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>Não há denúncias na fila.</p></div>
        )}
      </section>

      {canManageUsers ? (
        <section className="resource-section admin-section">
          <header>
            <div>
              <span className="eyebrow">Credenciais</span>
              <h2>Verificações profissionais</h2>
            </div>
          </header>
          {dashboard.verificationRequests.length ? (
            <div className="resource-grid admin-grid">
              {dashboard.verificationRequests.map((request) => (
                <article key={request.id} className="resource-card">
                  <span className="eyebrow">{request.profileType}</span>
                  <h3>{request.specialty}</h3>
                  <p>{request.course} · {request.institution}</p>
                  <p>{request.statement}</p>
                  {request.credentialReference ? (
                    <a href={request.credentialReference} target="_blank" rel="noreferrer noopener">
                      Abrir comprovação
                    </a>
                  ) : null}
                  <label>
                    Nota da análise
                    <textarea
                      rows={3}
                      maxLength={1500}
                      value={verificationNotes[request.id] || ''}
                      onChange={(event) =>
                        setVerificationNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      className="button primary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void perform(
                          `verification:${request.id}:approve`,
                          () => services.admin.decideVerification(request.id, {
                            status: 'approved',
                            note: verificationNotes[request.id] || '',
                            contributionStatus: 'specialist',
                          }),
                          'Verificação aprovada.',
                        )
                      }
                    >
                      Aprovar
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void perform(
                          `verification:${request.id}:reject`,
                          () => services.admin.decideVerification(request.id, {
                            status: 'rejected',
                            note: verificationNotes[request.id] || '',
                            contributionStatus: 'specialist',
                          }),
                          'Verificação rejeitada.',
                        )
                      }
                    >
                      Rejeitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>Não há solicitações de verificação pendentes.</p></div>
          )}
        </section>
      ) : null}

      {canCurate ? (
        <AdminEditorialQueues dashboard={dashboard} busy={busy} perform={perform} />
      ) : null}

      {canManageUsers ? (
        <section className="resource-section admin-section">
          <header>
            <div>
              <span className="eyebrow">Contas</span>
              <h2>Usuários</h2>
            </div>
          </header>
          <div className="resource-grid admin-grid">
            {dashboard.users.map((user) => (
              <article key={user.id} className="resource-card">
                <span className="eyebrow">{user.status}</span>
                <h3>{user.displayName || user.username || user.email}</h3>
                <p>{user.email}</p>
                <p>{user.verificationStatus}{user.verifiedSpecialty ? ` · ${user.verifiedSpecialty}` : ''}</p>
                <div className="chip-row">
                  {user.roles.map((role) => (
                    <span key={role} className="chip">
                      {role}
                      {canManageRoles ? (
                        <button
                          className="chip-action"
                          type="button"
                          aria-label={`Remover cargo ${role}`}
                          disabled={Boolean(busy)}
                          onClick={() => {
                            if (!window.confirm(`Remover o cargo “${role}” deste usuário?`)) return;
                            void perform(
                              `role:${user.id}:${role}:remove`,
                              () => services.admin.changeRole(user.id, { roleId: role }, false),
                              'Cargo removido.',
                            );
                          }}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>

                {canManageRoles && dashboard.roles.length ? (
                  <div className="form-actions">
                    <select
                      aria-label={`Novo cargo para ${user.displayName || user.email}`}
                      value={roleSelections[user.id] || dashboard.roles[0]?.id || ''}
                      onChange={(event) =>
                        setRoleSelections((current) => ({ ...current, [user.id]: event.target.value }))
                      }
                    >
                      {dashboard.roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => {
                        const roleId = roleSelections[user.id] || dashboard.roles[0]?.id;
                        if (!roleId) return;
                        void perform(
                          `role:${user.id}:${roleId}:grant`,
                          () => services.admin.changeRole(user.id, { roleId }, true),
                          'Cargo concedido.',
                        );
                      }}
                    >
                      Conceder cargo
                    </button>
                  </div>
                ) : null}

                <label>
                  Motivo da suspensão
                  <input
                    maxLength={1000}
                    value={suspensionReasons[user.id] || ''}
                    onChange={(event) =>
                      setSuspensionReasons((current) => ({ ...current, [user.id]: event.target.value }))
                    }
                    placeholder={user.suspensionReason || 'Obrigatório para suspender'}
                  />
                </label>
                <button
                  className={user.status === 'suspended' ? 'button primary' : 'button secondary'}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
                    const reason = suspensionReasons[user.id] || '';
                    if (nextStatus === 'suspended' && reason.trim().length < 5) {
                      pushToast({ message: 'Informe um motivo de suspensão mais completo.', tone: 'error' });
                      return;
                    }
                    if (!window.confirm(nextStatus === 'suspended' ? 'Suspender esta conta e invalidar suas sessões?' : 'Reativar esta conta?')) return;
                    void perform(
                      `status:${user.id}`,
                      () => services.admin.setUserStatus(user.id, { status: nextStatus, reason }),
                      nextStatus === 'suspended' ? 'Conta suspensa.' : 'Conta reativada.',
                    );
                  }}
                >
                  {user.status === 'suspended' ? 'Reativar conta' : 'Suspender conta'}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {permissions.has('admin.full') ? (
        <section className="resource-section admin-section">
          <header>
            <div>
              <span className="eyebrow">Auditoria</span>
              <h2>Atividade administrativa</h2>
            </div>
          </header>
          {dashboard.audit.length ? (
            <div className="resource-grid admin-grid">
              {dashboard.audit.map((entry) => (
                <article key={String(entry.id)} className="resource-card">
                  <span className="eyebrow">{entry.action}</span>
                  <h3>{entry.targetType}</h3>
                  <p>{entry.targetId}</p>
                  <small>{entry.createdAt || 'Data indisponível'}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>A trilha de auditoria está vazia.</p></div>
          )}
        </section>
      ) : null}
    </FeaturePage>
  );
}
