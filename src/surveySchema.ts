// surveySchema.ts
export type Question =
  | { section: string; id: string; text: string; type: 'single_choice'; options: string[] }
  | {
      section: string;
      id: string;
      text: string;
      type: 'likert_1_5';
      options: ['1', '2', '3', '4', '5'];
    }
  | { section: string; id: string; text: string; type: 'long_text'; options?: undefined };

export const SURVEY: Question[] = [
  {
    section: 'Caracterización inicial',
    id: '1',
    text: 'Rol',
    type: 'single_choice',
    options: ['Sin personal a cargo', 'Manager', 'Miembro de Alta Dirección'],
  },
  {
    section: 'Caracterización inicial',
    id: '2',
    text: 'Área',
    type: 'single_choice',
    options: [
      'Ventas',
      'Operaciones',
      'TI',
      'Finanzas',
      'RR. HH.',
      'Marketing',
      'Innovación',
      'Otra',
    ],
  },
  {
    section: 'Caracterización inicial',
    id: '3',
    text: 'Años en la empresa',
    type: 'single_choice',
    options: ['0-2', '3-5', '6-10', '>10'],
  },
  {
    section: 'Caracterización inicial',
    id: '4',
    text: '¿Utiliza herramientas de IA en su trabajo?',
    type: 'single_choice',
    options: ['Sí', 'No', 'No sabe'],
  },
  {
    section: 'Caracterización inicial',
    id: '5',
    text: '¿Utiliza herramientas de IA fuera de su trabajo?',
    type: 'single_choice',
    options: ['Sí', 'No', 'No sabe'],
  },

  // Bloque A
  {
    section: 'Bloque A: Estrategia y Propósito',
    id: 'A1',
    text: 'Existe una visión clara y compartida en la empresa sobre cómo inteligencia artificial puede generar valor para los clientes y las operaciones.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque A: Estrategia y Propósito',
    id: 'A2',
    text: 'Las iniciativas de inteligencia artificial disponen de apoyo visible y sostenido por parte de la alta dirección y cuentan con recursos necesarios (presupuesto, personas) para desarrollarse efectivamente.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque A: Estrategia y Propósito',
    id: 'A3',
    text: 'Tengo claridad sobre cómo las iniciativas de IA se relacionan con los objetivos de mi área o equipo.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // Bloque B
  {
    section: 'Bloque B: Datos y Plataformas',
    id: 'B1',
    text: 'Contamos con datos confiables, accesibles y bien gobernados que soportan el desarrollo y operación de soluciones de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque B: Datos y Plataformas',
    id: 'B2',
    text: 'Disponemos de plataformas tecnológicas y herramientas adecuadas para desarrollar, desplegar y escalar soluciones de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque B: Datos y Plataformas',
    id: 'B3',
    text: 'Existe una práctica establecida para monitorear, evaluar y mejorar continuamente los modelos y soluciones de IA en producción.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // Bloque C
  {
    section: 'Bloque C: Talento y Cultura',
    id: 'C1',
    text: 'Los equipos cuentan con las habilidades necesarias (técnicas y de negocio) para trabajar con IA en sus procesos.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque C: Talento y Cultura',
    id: 'C2',
    text: 'La empresa promueve activamente el aprendizaje y la experimentación con IA en diferentes áreas.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque C: Talento y Cultura',
    id: 'C3',
    text: 'Existen prácticas de colaboración entre áreas de negocio y equipos técnicos para definir, desarrollar e implementar soluciones de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque C: Talento y Cultura',
    id: 'C4',
    text: 'Existen iniciativas para reentrenar o reubicar a las personas en roles afectados por la automatización y el uso de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // Bloque D
  {
    section: 'Bloque D: Gobierno y Ética',
    id: 'D1',
    text: 'Tenemos políticas claras para el uso responsable de IA, incluyendo privacidad, seguridad, sesgos, explicabilidad y cumplimiento regulatorio.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque D: Gobierno y Ética',
    id: 'D2',
    text: 'Se han establecido roles y responsabilidades claras para la toma de decisiones y la supervisión de las iniciativas de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque D: Gobierno y Ética',
    id: 'D3',
    text: 'La empresa es transparente con los clientes y empleados sobre el uso y el impacto de la IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // Bloque E
  {
    section: 'Bloque E: Casos de Uso y Valor',
    id: 'E1',
    text: 'Desarrollamos soluciones de IA que mejoran significativamente la experiencia del cliente.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque E: Casos de Uso y Valor',
    id: 'E2',
    text: 'Utilizamos la IA para optimizar de forma radical nuestros procesos internos y lograr eficiencia operativa.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque E: Casos de Uso y Valor',
    id: 'E4',
    text: 'Nuestras soluciones de IA están diseñadas como “productos” o plataformas reutilizables a escala (no solo proyectos aislados).',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque E: Casos de Uso y Valor',
    id: 'E5',
    text: 'Medimos y comunicamos de forma transparente el valor generado por las iniciativas de IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // Bloque F
  {
    section: 'Bloque F: Ecosistema',
    id: 'F1',
    text: 'Colaboramos con socios externos (startups, universidades, proveedores) para acelerar la innovación en IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque F: Ecosistema',
    id: 'F2',
    text: 'La empresa participa en foros o comunidades externas para compartir y aprender sobre IA.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    section: 'Bloque F: Ecosistema',
    id: 'F5',
    text: 'Nuestra infraestructura tecnológica permite integrar datos, servicios y socios externos para operar en un ecosistema digital.',
    type: 'likert_1_5',
    options: ['1', '2', '3', '4', '5'],
  },

  // // Bloque G (abiertas)
  // {
  //   section: 'Bloque G: Preguntas abiertas',
  //   id: 'G1',
  //   text: 'Pensando específicamente en los empleados, ¿cuál es el principal reto que ves para la adopción de IA en tu empresa?',
  //   type: 'long_text',
  // },
  // {
  //   section: 'Bloque G: Preguntas abiertas',
  //   id: 'G2',
  //   text: 'Más allá de métricas de eficiencia o ventas, ¿de qué manera la IA podría contribuir al propósito estratégico de tu empresa?',
  //   type: 'long_text',
  // },
  // {
  //   section: 'Bloque G: Preguntas abiertas',
  //   id: 'G3',
  //   text: '¿Desearías compartir alguna expectativa o idea que te entusiasme respecto a IA en tu organización?',
  //   type: 'long_text',
  // },
];
