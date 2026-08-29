import { NavLink } from 'react-router-dom';

const items = [
  ['/', 'Início'],
  ['/explorar', 'Explorar'],
  ['/comunidades', 'Comunidades'],
  ['/oficina', 'Oficina'],
  ['/biblioteca', 'Biblioteca'],
] as const;

export function PrimaryNav() {
  return (
    <nav className="primary-nav" aria-label="Navegação principal">
      {items.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
