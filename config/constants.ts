// ---------------------------------------------------------
// NEST BACKEND
// ---------------------------------------------------------
const PORT = 3333;
const NEST_URL_DEVELOP = `http://127.0.0.1:${PORT}/`;

export const NEST_URL = process.env.NODE_ENV.includes("dev")
  ? NEST_URL_DEVELOP
  : process.env.NEXT_PUBLIC_NEST_URL_PRODUCTION ||
  "https://cmso360-backend-production.up.railway.app/";
console.log(NEST_URL);
// export const NEST_URL = `http://192.168.0.222:${PORT}/`
export const NEXT_WS_URL = NEST_URL?.replace("http", "ws").replace(
  "https",
  "wss",
);

// ---------------------------------------------------------
// WORKER (Scraping Metrics)
// ---------------------------------------------------------
const WORKER_PORT = 3334;
const WORKER_URL_DEVELOP = `http://127.0.0.1:${WORKER_PORT}/`;

export const WORKER_URL = process.env.NODE_ENV.includes("dev")
  ? WORKER_URL_DEVELOP
  : process.env.NEXT_PUBLIC_WORKER_URL_PRODUCTION ||
  "https://cmso360-worker.fly.dev/";

export const WORKER_WS_URL = WORKER_URL?.replace("http", "ws").replace(
  "https",
  "wss",
);

export const WORKER_SCRAPER_STATUS = `${WORKER_URL}scraper/status`;

export const NEST_TICKETS_URL = `${NEST_URL}ticket`;
export const NEST_TICKET_QUERY = `${NEST_URL}ticket?unidade=`;
export const NEST_TICKET_DELETE = `${NEST_URL}ticket/delete/`;

export const NEST_DASHBOARD = NEST_URL + "schedulings/dashboard";

export const NEST_SCHEDULINGS_ALL = `${NEST_URL}schedulings/all`;
export const NEST_SCHEDULINGS_ANEXO_UPLOAD = `${NEST_URL}schedulings/upload-anexo`;
export const NEST_SCHEDULINGS_ANEXO_REMOVE = `${NEST_URL}schedulings/remove-anexo`;
export const NEST_SCHEDULINGS_DELETE = `${NEST_URL}schedulings/delete`;
export const NEST_SCHEDULINGS_DELETE_ATTACHMENT = `${NEST_URL}schedulings/delete-attachment`;
export const NEST_SCHEDULINGS_EXAM_UPDATE = `${NEST_URL}schedulings/exame/update`;
export const NEST_SCHEDULINGS_EXAM_REISSUE = `${NEST_URL}schedulings/exame/reissue`;
export const NEST_SCHEDULINGS_FINISH = `${NEST_URL}schedulings/finish`;
export const NEST_SCHEDULINGS_PRONTUARIO = `${NEST_URL}schedulings/prontuario/`; // adiciona id na query
export const NEST_SCHEDULINGS_STATISTICS = `${NEST_URL}schedulings/statistics`;
export const NEST_SCHEDULINGS_TODAY = `${NEST_URL}schedulings/today`;
export const NEST_SCHEDULINGS_UPDATE = `${NEST_URL}schedulings/update`;
export const NEST_SCHEDULINGS_UPDATE_EXAM_RESULT = `${NEST_URL}schedulings/update/resultadoexame`; // envia resultados de exame pdf

export const NEST_PRONTUARIO_PARAMETROS =
  NEST_URL + "schedulings/record-params";
export const NEST_PRONTUARIO_REGISTROS = NEST_URL + "schedulings/records";
export const NEST_RELATORIO_PARAMETROS = NEST_URL + "schedulings/report-params";
export const NEST_RELATORIO_FILTROS = NEST_URL + "schedulings/report-filters";
export const NEST_RELATORIO_FUNCIONARIO = NEST_URL + "schedulings/report/"; // schedulings/report/:ID ---> Busca funcionário
export const NEST_RELATORIO_CSV_DOWNLOAD =
  NEST_URL + "schedulings/csv-download"; // schedulings/report/:ID ---> Busca funcionário

export const NEST_SOC_AUDIOMETRIA_ANTERIOR = `${NEST_URL}soc/audiometria-anterior`;
export const NEST_SOC_COMPANIES = `${NEST_URL}soc/empresas`;
export const NEST_SOC_CADASTROPESSOAS = `${NEST_URL}soc/cadastropessoas`;
export const NEST_SOC_PEDIDOEXAME = `${NEST_URL}soc/pedidoexame?`;
export const NEST_SOC_PEDIDOEXAME_VALIDADE = `${NEST_URL}soc/pedidoexame/validate?`;
export const NEST_SOC_PEDIDOEXAME_CREDENCIADAS = `${NEST_URL}soc/pedidoexame/credenciadas?`;
export const NEST_SOC_RECORDS = `${NEST_URL}soc/asos?`;
export const NEST_SCHEDULINGS_SYNC_SOC = `${NEST_URL}soc/sync-soc`;
export const NEST_SOC_SINCRONIZAR_PRONTUARIO = `${NEST_URL}soc/sincronizar-prontuario`;

export const NEST_NOTIFICATION_URL = `${NEST_URL}push/subscribe`;
export const NEST_USER_SETTINGS_URL = `${NEST_URL}user-settings/`;

// ---------------------------------------------------------
// NEXT APPLICATION
// ---------------------------------------------------------
export const API_REGISTER_URL = "/api/register";
export const SERVICES_KEY = "123";

export const PRIMARY_COLOR = "#114e34";
export const SECOND_COLOR = "#afca07";

export const USER_PROFILE = {
  MASTER: "MASTER",

  // PERFIS DE SISTEMA
  RECEPCAO: "RECEPÇÃO",
  ATENDIMENTO: "ATENDIMENTO",
  ADMINISTRATIVO: "ADMINISTRATIVO",

  // PERFIS CLÍNICOS
  MEDICO: "MÉDICO",
  ENFERMAGEM: "ENFERMAGEM",
  FONOAUDIOLOGIA: "FONOAUDIOLOGIA",
  LABORATORIO: "LABORATÓRIO",
  RADIOLGIA: "RADIOLOGIA",
  PSICOLOGO: "PSICÓLOGO",
};

export const PREFERENCIAL_OPTIONS = [
  "Gestante",
  "Criança de colo",
  "Idoso",
  "PCD",
  "Outros",
];

// Paleta de cores baseada no logo
export const COLOR_PALETTE = {
  primary: "#44735e", // Verde principal
  secondary: "#b8d864", // Verde claro/amarelado
  accent: "#5a8c7a", // Verde médio
  light: "#e8f4e3", // Verde muito claro
  dark: "#2a4a3a", // Verde escuro
  background: "#f5f9f7", // Fundo claro
  text: "#1a2a1f", // Texto escuro
  gray: "#6b7f76", // Cinza esverdeado
};

export const UNIDADES_ATENDIMENTO = ["ARARAS", "CORDEIRÓPOLIS", "RIO CLARO"];
export const SALAS_RECEPCAO = [
  "BALCÃO",
  "FINALIZAÇÃO",
  "GUICHÊ 1",
  "GUICHÊ 2",
  "GUICHÊ 3",
  "GUICHÊ 4",
  "GUICHÊ 5",
  "GUICHÊ 6",
  "GUICHÊ 7",
  "GUICHÊ 8",
  "GUICHÊ 9",
  "GUICHÊ 10",
  "GUICHÊ 11",
  "GUICHÊ 12",
  "RECEPÇÃO 1",
  "RECEPÇÃO 2",
  "RECEPÇÃO 3",
  "PREPARO AGENDA",
];
export const SALAS_EXAMES = [
  "SALA 1",
  "SALA 2",
  "SALA 3-A",
  "SALA 3-B",
  "SALA 4",
  "SALA 5-A",
  "SALA 5-B",
  "SALA 6-A",
  "SALA 6-B",
  "SALA 6-C",
  "SALA 7",
  "SALA 8",
  "SALA 9",
  "SALA 10",
  "SALA 11",
  "SALA 12",
  "SALA 13",
  "UNIDADE MÓVEL",
];

export const TIPOS_EXAME: Record<string, string> = {
  ADMISSIONAL: "ADMISSIONAL",
  PERIODICO: "PERIÓDICO",
  DEMISSIONAL: "DEMISSIONAL",
  "RETORNO TRABALHO": "RETORNO TRABALHO",
  "MUDANCA FUNCAO": "MUDANÇA DE RISCO",
  "MONITORACAO PONTUAL": "MONITORAÇÃO PONTUAL",
};

export const ESTIMATIVA_EXAMES: Record<string, number> = {
  Triagem: 10,

  "Acuidade Visual": 15,
  "Avaliação Psicossocial": 18,
  Laboratorial: 20,

  Espirometria: 22,
  EEG: 25,

  Audiometria: 28,
  ECG: 30,
  "Raio-X": 32,

  "Exame Clínico": 40,
};

export const EMPRESAS_COM_PSICOLOGA = new Set([
  "263126", // RICLAN
  "690978", // AUTOPORT
  "310540", // OWENS 45
  "310539", // OWENS 83
  "310538", // OWENS 92
  "270281", // ALISUL
  "176792", // SEW
  "122878", // 3 FAZENDAS
  "821445", // EXPERT
]);

export const EMPRESAS_CREDENCIADAS_SOC = new Set([
  // KIT SW OCUPACIONAL ---> Grupo savegnago
  "1712886",
  // KIT UNIMED SOU RJ ---> Grupo Bauminas / Nheel Quimica
  "2008962",
  // KIT SALU
  "1246478",
  // KIT ESMALGLASS
  "353226",
]);

export const CODIGOS_RISCO_ALTURA = new Set([
  "179", // Trabalho em altura
  "213", // Acidentes - trabalho em altura
  "252", // Preventivo - Trabalho em Altura
  "263", // Quedas de altura superior a 2 metros
  "336", // Diferença de nível maior que 2 metros / Queda em altura
  "395", // Queda em altura
  "777", // Trabalho eventual em altura
  "782", // Queda com diferença de nível maior que dois metros
  "941", // Queda de pessoa com diferença de nível acima de dois metros (queda de altura)
  "978", // Trabalho em altura no acesso a partes superiores de tanques e instalações do Binder
  "1277", // Queda de altura em nivel dferente - ACID 1
  "1302", // Trabalho com diferença de nível maior que dois metros
  "1379", // Queda - Altura - Diferença de nível maior que dois metros
]);

export const CODIGOS_ESPACO_CONFINADO = new Set([
  "237", // Espaço Confinado
  "364", // Operações em Espaço Confinado
  "382", // Trabalho em Espaço confinado
  "666", // Catalogação dos espaços confinados
  "977", // Espaço confinado no acesso a tanques para inspeção e limpeza
]);

type ExamToogle = {
  codigos: string[];
  nome: string;
};

export const EXAMES_LIST: Record<string, ExamToogle[]> = {
  "Exame Clínico": [
    {
      codigos: ["clinico", "11"],
      nome: "Exame Clínico",
    },
    {
      codigos: ["002211"],
      nome: "Teste de Romberg",
    },
  ],
  Audiometria: [
    {
      codigos: ["51.01.004-6", "50c", "10014"],
      nome: "Audiometria",
    },
    {
      codigos: ["28032024"],
      nome: "Avaliação Acústica da Voz",
    },
  ],
  "Acuidade Visual": [
    {
      codigos: ["50.01.001-8", "20221407", "4447", "02002", "4445"],
      nome: "Acuidade Visual",
    },
    {
      codigos: ["07072023"],
      nome: "Consulta Oftalmológica",
    },
  ],
  Laboratório: [
    {
      codigos: ["2"],
      nome: "2,5-hexanodiona urinária",
    },
    {
      codigos: ["XX"],
      nome: "Acetona urinária",
    },
    {
      codigos: ["28.15.001-5"],
      nome: "Ácido delta aminolevulínico - ALA-U",
    },
    {
      codigos: ["28.15.003-1"],
      nome: "Ácido fenilglioxílico",
    },
    {
      codigos: ["28.15.004-0"],
      nome: "Ácido hipúrico",
    },
    {
      codigos: ["28.15.005-8"],
      nome: "Ácido mandélico",
    },
    {
      codigos: ["28.15.006-6"],
      nome: "Ácido metilhipúrico",
    },
    {
      codigos: ["5555"],
      nome: "Ácido trans, trans-mucônico",
    },
    {
      codigos: ["28010175"],
      nome: "Ácido úrico",
    },
    {
      codigos: ["1180"],
      nome: "Antígeno específico prostático total (PSA)",
    },
    {
      codigos: ["CÁDMIO"],
      nome: "Cádmio Sanguíneo",
    },
    {
      codigos: ["001234"],
      nome: "Cádmio urinários",
    },
    {
      codigos: ["28.15.009-0"],
      nome: "Carboxihemoglobina",
    },
    {
      codigos: ["28.15.012-0"],
      nome: "Chumbo sanguíneo",
    },
    {
      codigos: ["0012345"],
      nome: "Chumbo urinário",
    },
    {
      codigos: ["1332"],
      nome: "Colesterol (HDL)",
    },
    {
      codigos: ["1222"],
      nome: "Colesterol (LDL)",
    },
    {
      codigos: ["00000"],
      nome: "Colesterol (VLDL)",
    },
    {
      codigos: ["28010507"],
      nome: "Colesterol total",
    },
    {
      codigos: ["28.01.054-0"],
      nome: "Creatinina",
    },
    {
      codigos: ["02"],
      nome: "Cromo sanguíneo",
    },
    {
      codigos: ["28100239"],
      nome: "Cultura nas fezes",
    },
    {
      codigos: ["28.15.030-9"],
      nome: "Etanol",
    },
    {
      codigos: ["28.15.014-7"],
      nome: "Fenol",
    },
    {
      codigos: ["28.15.015-5"],
      nome: "Fluoreto urinário",
    },
    {
      codigos: ["11072025"],
      nome: "Função hepática",
    },
    {
      codigos: ["002000"],
      nome: "Fungos, pesquisa a fresco",
    },
    {
      codigos: ["28.01.095-7"],
      nome: "Gama-glutamil transferase (Gama-GT)",
    },
    {
      codigos: ["28.01.097-3"],
      nome: "Glicemia",
    },
    {
      codigos: ["2336", "28040350"],
      nome: "Grupo sanguíneo ABO, e fator Rho (inclui Du)",
    },
    {
      codigos: ["28011023"],
      nome: "Hemoglobina glicada (A1 total)",
    },
    {
      codigos: ["28.04.048-1"],
      nome: "Hemograma com contagem de plaquetas ou frações",
    },
    {
      codigos: ["28.04.048-1", "28040562"],
      nome: "Hemograma com contagem de plaquetas ou frações",
    },
    {
      codigos: ["28060105"],
      nome: "Hepatite A - HAV - IgG",
    },
    {
      codigos: ["28060113"],
      nome: "Hepatite A - HAV - IgM",
    },
    {
      codigos: ["28060067"],
      nome: "Hepatite B - HBCAC - IgG",
    },
    {
      codigos: ["28061195"],
      nome: "Hepatite B - HBCAC - IgM",
    },
    {
      codigos: ["-"],
      nome: "Hepatite B - HBeAC (anti HBE)",
    },
    {
      codigos: ["144"],
      nome: "Hepatite B - HBsAG",
    },
    {
      codigos: ["1123"],
      nome: "Hepatite B - HBsAC (anti-HBs)",
    },
    {
      codigos: ["00022"],
      nome: "Hepatite C - anti-HCV - IgG",
    },
    {
      codigos: ["1125"],
      nome: "Hepatite C - anti-HCV - IgM",
    },
    {
      codigos: ["200"],
      nome: "Hormônio gonodotrofico corionico",
    },
    {
      codigos: ["28.15.018-0"],
      nome: "Metanol",
    },
    {
      codigos: ["1", "54778844"],
      nome: "Metil Etil Cetona",
    },
    {
      codigos: ["28030141"],
      nome: "Parasitológico de fezes",
    },
    {
      codigos: ["0101"],
      nome: "Reticulócitos",
    },
    {
      codigos: ["28.13.036-7", "47788855"],
      nome: "Rotina de urina",
    },
    {
      codigos: ["28061004"],
      nome: "Sífilis - VDRL",
    },
    {
      codigos: ["09022023"],
      nome: "Tolueno urinário",
    },
    {
      codigos: ["02020"],
      nome: "Exame Toxicológico",
    },
    {
      codigos: ["28.01.136-8"],
      nome: "TGO",
    },
    {
      codigos: ["28.01.137-6"],
      nome: "TGP",
    },
    {
      codigos: ["13012023"],
      nome: "Tolueno sanguíneo",
    },
    {
      codigos: ["09022023"],
      nome: "Tolueno urinário",
    },
    {
      codigos: ["28011392"],
      nome: "Triglicerídeos",
    },
    {
      codigos: ["28.01.141-4"],
      nome: "Uréia",
    },
  ],
  ECG: [
    {
      codigos: ["20.01.001-0"],
      nome: "ECG",
    },
  ],
  EEG: [
    {
      codigos: ["22010017"],
      nome: "EEG",
    },
  ],
  Psicossocial: [
    {
      codigos: ["225588", "00123", "111114"],
      nome: "Psicossocial",
    },
  ],
  Espirometria: [
    {
      codigos: ["19.01.029-0"],
      nome: "Espirometria",
    },
  ],
  "Raio-X": [
    {
      codigos: ["32050070", "14111"],
      nome: "Radiografia de tórax (PA) Padrão OIT",
    },
    {
      codigos: ["12200", "8998"],
      nome: "Tomografia de tórax",
    },
    {
      codigos: ["ex imagem"],
      nome: "Radiografia de coluna total",
    },
    {
      codigos: ["111", "1v1v", "254477"],
      nome: "Radiografia de coluna lombo-sacra",
    },
    {
      codigos: ["-0-"],
      nome: "Radiografia de coluna dorsal",
    },
    {
      codigos: ["0.."],
      nome: "Radiografia de coluna cervical",
    },
    {
      codigos: ["2221111"],
      nome: "Métodos Diagnósticos por Imagem Coluna",
    },
  ],
  Dinamometria: [
    {
      codigos: ["20", "58877"],
      nome: "Dinamometria",
    },
    {
      codigos: ["041120252"],
      nome: "Dinamometria (escapular)",
    },
    {
      codigos: ["041120253"],
      nome: "Dinamometria (lombar)",
    },
    {
      codigos: ["041120251"],
      nome: "Dinamometria (punhos)",
    },
  ],
  Ultrassom: [
    {
      codigos: ["1444", "587744"],
      nome: "Ultrassom",
    },
  ],
  Triagem: [
    {
      codigos: ["triagem"],
      nome: "Triagem",
    },
  ],
};
