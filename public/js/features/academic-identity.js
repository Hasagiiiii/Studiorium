import { state } from '../runtime.js';

const navigationNames = new Map([
  ['/biblioteca', 'Bibliotheca'],
  ['/projetos', 'Opera Communitatis'],
  ['/noticias', 'Nuntii'],
  ['/oficina', 'Officina Technica'],
  ['/acervo', 'Catalogus'],
  ['/atelie', 'Officina Scientifica'],
  ['/coloquio', 'Colloquium'],
  ['/escrivaninha', 'Scriptorium'],
]);

const pageNames = [
  ['/biblioteca', () => ['Bibliotheca', 'Biblioteca acadêmica e Armarium Librorum']],
  ['/acervo', () => ['Catalogus', 'Acervo de modelos e documentos']],
  ['/coloquio', () => ['Colloquium', 'Comunidade de discussões acadêmicas']],
  [
    '/escrivaninha',
    () => [
      `Scriptorium${state.me?.displayName ? ` · ${state.me.displayName.split(' ')[0]}` : ''}`,
      'Escrivaninha pessoal',
    ],
  ],
  ['/oficina', () => ['Officina Technica', 'Tecnologia, tutoriais e projetos']],
  ['/laboratorio', () => ['Laboratorium', 'Laboratório de código']],
  ['/noticias', () => ['Nuntii', 'Notícias certificadas da comunidade']],
  ['/redacao', () => ['Redactio', 'Redação colaborativa']],
  ['/projetos', () => ['Opera Communitatis', 'Projetos públicos da comunidade']],
  ['/pesquisas', () => ['Opera Publica', 'Pesquisas e trabalhos publicados']],
  ['/autores', () => ['Auctores', 'Autores e especialistas da comunidade']],
  ['/atelie', () => ['Officina Scientifica', 'Criação de banners científicos']],
  ['/estudio-templates', () => ['Officina Exemplorum', 'Estúdio livre de templates']],
  ['/admin', () => ['Administratio Studiorum', 'Administração do Studiorium']],
];

export function applyAcademicIdentity() {
  for (const selector of ['.navlinks a', '#mobileMenu a']) {
    document.querySelectorAll(selector).forEach((anchor) => {
      const target = navigationNames.get(anchor.getAttribute('href'));
      if (target && anchor.textContent.trim() !== target) anchor.textContent = target;
    });
  }

  document.querySelectorAll('.featurelink').forEach((card) => {
    const target = navigationNames.get(card.getAttribute('href'));
    const heading = card.querySelector('h3');
    if (target && heading && heading.textContent.trim() !== target) heading.textContent = target;
  });

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const match = pageNames.find(([prefix]) => path === prefix);
  const heading = document.querySelector('.pagehero .pagetitle');
  if (!match || !heading) return;

  const [name, translation] = match[1]();
  if (heading.dataset.academicName !== name) {
    heading.textContent = name;
    heading.dataset.academicName = name;
  }

  let subtitle = heading.nextElementSibling;
  if (!subtitle?.classList.contains('academic-translation')) {
    subtitle = document.createElement('div');
    subtitle.className = 'academic-translation';
    heading.insertAdjacentElement('afterend', subtitle);
  }
  if (subtitle.textContent !== translation) subtitle.textContent = translation;
}
