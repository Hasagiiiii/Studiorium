const OFFICIAL_COMMUNITIES = [
  {
    id: 'comm_pc_hardware',
    slug: 'pc-hardware',
    name: 'PC & Hardware',
    area: 'Tecnologia',
    description:
      'Montagem, compatibilidade, diagnóstico, upgrades, desempenho e manutenção de computadores.',
    legacyHubs: ['PC & Hardware'],
  },
  {
    id: 'comm_programacao',
    slug: 'programacao',
    name: 'Programação',
    area: 'Tecnologia',
    description:
      'Desenvolvimento de software, web, automação, ferramentas, estudos e projetos de código.',
    legacyHubs: ['Tecnologia'],
  },
  {
    id: 'comm_dev_jogos',
    slug: 'desenvolvimento-jogos',
    name: 'Desenvolvimento de Jogos',
    area: 'Tecnologia',
    description:
      'Programação, design, prototipagem, ferramentas e projetos voltados à criação de jogos.',
    legacyHubs: ['Jogos'],
  },
  {
    id: 'comm_eletronica',
    slug: 'eletronica',
    name: 'Eletrônica',
    area: 'Tecnologia',
    description: 'Circuitos, componentes, reparos, medições, projetos e fundamentos de eletrônica.',
    legacyHubs: [],
  },
  {
    id: 'comm_linux_redes',
    slug: 'linux-redes',
    name: 'Linux & Redes',
    area: 'Tecnologia',
    description:
      'Sistemas Linux, redes, servidores, diagnóstico, segurança e infraestrutura doméstica ou acadêmica.',
    legacyHubs: [],
  },
  {
    id: 'comm_ia_automacao',
    slug: 'ia-automacao',
    name: 'IA & Automação',
    area: 'Tecnologia',
    description:
      'Inteligência artificial, automações, agentes, integrações e aplicações responsáveis.',
    legacyHubs: [],
  },
  {
    id: 'comm_motos',
    slug: 'motos',
    name: 'Motos',
    area: 'Automotivo',
    description:
      'Manutenção, diagnóstico, projetos, peças, mecânica e conhecimento técnico sobre motocicletas.',
    legacyHubs: ['Motos'],
  },
  {
    id: 'comm_carros',
    slug: 'carros',
    name: 'Carros',
    area: 'Automotivo',
    description:
      'Manutenção, diagnóstico, projetos, peças, mecânica e conhecimento técnico sobre automóveis.',
    legacyHubs: ['Carros'],
  },
  {
    id: 'comm_mecanica',
    slug: 'mecanica',
    name: 'Mecânica',
    area: 'Automotivo',
    description:
      'Fundamentos mecânicos, manutenção preventiva, diagnóstico e práticas de oficina com segurança.',
    legacyHubs: [],
  },
  {
    id: 'comm_matematica',
    slug: 'matematica',
    name: 'Matemática',
    area: 'Acadêmico',
    description:
      'Dúvidas, métodos de estudo, resolução comentada e discussão de conceitos matemáticos.',
    legacyHubs: [],
  },
  {
    id: 'comm_ciencias_natureza',
    slug: 'ciencias-natureza',
    name: 'Ciências da Natureza',
    area: 'Acadêmico',
    description:
      'Biologia, Química, Física e conexões entre investigação científica e aprendizagem.',
    legacyHubs: [],
  },
  {
    id: 'comm_pesquisa_cientifica',
    slug: 'pesquisa-cientifica',
    name: 'Pesquisa Científica',
    area: 'Acadêmico',
    description:
      'Metodologia, fontes, escrita, apresentação, revisão e desenvolvimento de pesquisas.',
    legacyHubs: [],
  },
  {
    id: 'comm_educacao',
    slug: 'educacao',
    name: 'Educação',
    area: 'Acadêmico',
    description:
      'Ensino, aprendizagem, práticas pedagógicas, recursos didáticos e experiências educacionais.',
    legacyHubs: [],
  },
  {
    id: 'comm_design_templates',
    slug: 'design-templates',
    name: 'Design & Templates',
    area: 'Criação',
    description:
      'Design acadêmico, apresentações, banners, modelos, organização visual e recursos reutilizáveis.',
    legacyHubs: [],
  },
  {
    id: 'comm_literatura',
    slug: 'literatura',
    name: 'Literatura',
    area: 'Leitura',
    description: 'Livros, leituras, autores, gêneros, clubes de leitura e discussão literária.',
    legacyHubs: [],
  },
];

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 80);
}

function communityFromCatalog(slug) {
  const normalized = normalizeSlug(slug);
  return OFFICIAL_COMMUNITIES.find((community) => community.slug === normalized) || null;
}

module.exports = { OFFICIAL_COMMUNITIES, communityFromCatalog, normalizeSlug };
