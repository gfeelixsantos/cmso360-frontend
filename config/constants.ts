
// ---------------------------------------------------------
// NEST BACKEND
// ---------------------------------------------------------
const PORT=3333
const NEST_URL_DEVELOP = `http://127.0.0.1:${PORT}/`

export const NEST_URL = process.env.NODE_ENV.includes("dev") ? NEST_URL_DEVELOP : process.env.NEXT_PUBLIC_NEST_URL_PRODUCTION
console.log(NEST_URL)
// export const NEST_URL = `http://192.168.0.222:${PORT}/`
export const NEXT_WS_URL = NEST_URL?.replace("http", "ws").replace("https", "ws")

const TICKETS_ENDPOINT = process.env.NEXT_PUBLIC_NEST_TICKET_ENDPOINT ?? "[.ENV] Ticket endpoint nulo"
export const NEST_TICKETS_URL = NEST_URL + TICKETS_ENDPOINT

const TICKET_QUERY = process.env.NEXT_PUBLIC_NEST_TICKET_QUERY ?? "[.ENV] Ticket query nulo"
export const NEST_TICKET_QUERY = NEST_URL + TICKET_QUERY

const SCHEDULINGS = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS ?? "[.ENV] Schedulings url nulo"
export const NEST_SCHEDULINGS = NEST_URL + SCHEDULINGS

const SCHEDULINGS_EXAM_UPDATE = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS_EXAM_UPDATE ?? "[.ENV] Scheduling exam update nulo"
export const NEST_SCHEDULINGS_EXAM_UPDATE = NEST_URL + SCHEDULINGS_EXAM_UPDATE

const SCHEDULINGS_TODAY = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS_TODAY ?? "[.ENV] Schedulings today nulo"
export const NEST_SCHEDULINGS_TODAY = NEST_URL + SCHEDULINGS_TODAY

const SCHEDULINGS_ALL = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS_ALL ?? "[.ENV] Schedulings ALL nulo"
export const NEST_SCHEDULINGS_ALL = NEST_URL + SCHEDULINGS_ALL


const SCHEDULINGS_FINISH = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS_FINISH ?? "[.ENV] Schedulings finish nulo"
export const NEST_SCHEDULINGS_FINISH = NEST_URL + SCHEDULINGS_FINISH

const SCHEDULINGS_RECORDS = process.env.NEXT_PUBLIC_NEST_SCHEDULINGS_RECORDS ?? "[.ENV] URL scheduling records nulo"
export const NEST_SCHEDULINGS_RECORDS = NEST_URL + SCHEDULINGS_RECORDS

const SOC_COMPANIES = process.env.NEXT_PUBLIC_NEST_SOC_COMPANIES ?? "[.ENV] SOC Companies nulo"
export const NEST_SOC_COMPANIES = NEST_URL + SOC_COMPANIES

const SOC_CADASTROPESSOAS = process.env.NEXT_PUBLIC_NEST_SOC_CADASTROPESSOAS ?? "[.ENV] SOC Cadastro pessoas nulo"
export const NEST_SOC_CADASTROPESSOAS = NEST_URL + SOC_CADASTROPESSOAS

const SOC_PEDIDOEXAME = process.env.NEXT_PUBLIC_NEST_SOC_PEDIDOEXAME ?? "[.ENV] SOC ASO Funcionário nulo"
export const NEST_SOC_PEDIDOEXAME = NEST_URL + SOC_PEDIDOEXAME

const SOC_PEDIDOEXAME_CREDENCIADAS = process.env.NEXT_PUBLIC_NEST_SOC_PEDIDOEXAME_CREDENCIADAS ?? "[.ENV] SOC ASO Funcionário nulo"
export const NEST_SOC_PEDIDOEXAME_CREDENCIADAS = NEST_URL + SOC_PEDIDOEXAME_CREDENCIADAS


const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NEST_NOTIFICATION_SUBSCRIBE ?? "[.ENV] Notification subscribe nulo"
export const NEST_NOTIFICATION_URL= NEST_URL + NOTIFICATION_URL

// ---------------------------------------------------------
// NEXT APPLICATION
// ---------------------------------------------------------
export const API_REGISTER_URL="/api/register"
export const SERVICES_KEY="123"


export const PRIMARY_COLOR="#114e34"
export const SECOND_COLOR="#afca07"

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
}

export const PREFERENCIAL_OPTIONS = ["Gestante", "Criança de colo", "Idoso", "PCD", "Outros"]
export const UNIDADES_ATENDIMENTO = ["ARARAS", "CORDEIRÓPOLIS", "RIO CLARO"]
export const SALAS_RECEPCAO = ["BALCÃO", "FINALIZAÇÃO", "GUICHÊ 1", "GUICHÊ 2", "GUICHÊ 3", "GUICHÊ 4","GUICHÊ 5","GUICHÊ 6","GUICHÊ 7","GUICHÊ 8","GUICHÊ 9","GUICHÊ 10","GUICHÊ 11","GUICHÊ 12","RECEPÇÃO 1", "RECEPÇÃO 2", "RECEPÇÃO 3", "PREPARO AGENDA"]
export const SALAS_EXAMES = ["SALA 1", "SALA 2", "SALA 3-A", "SALA 3-B", "SALA 4", "SALA 5-A", "SALA 5-B", "SALA 6-A", "SALA 6-B", "SALA 6-C", "SALA 7", "SALA 8", "SALA 9", "SALA 10", "SALA 11", "SALA 12", "SALA 13"]


export const TIPOS_EXAME: Record<string, string> = {
  "ADMISSIONAL": "ADMISSIONAL",
  "PERIODICO": "PERIÓDICO",
  "DEMISSIONAL": "DEMISSIONAL",
  "RETORNO TRABALHO": "RETORNO TRABALHO",
  "MUDANCA FUNCAO": "MUDANÇA DE RISCO",
  "MONITORACAO PONTUAL": "MONITORAÇÃO PONTUAL",
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
    "1712886" ,
    // KIT UNIMED SOU RJ ---> Grupo Bauminas / Nheel Quimica
    "2008962",
    // KIT SALU
    "1246478",
    // KIT ESMALGLASS
    "353226"
]);

export const CODIGOS_RISCO_ALTURA = new Set([
  "179", // Trabalho em altura
  "213", // Acidentes - trabalho em altura
  "252", // Preventivo - Trabalho em Altura
  "263", // Quedas de altura superior a 2 metros
  "336", // Diferença de nível maior que 2 metros / Queda em altura
  "395", // Queda em altura
  "777", // Trabalho eventual em altura
  "941", // Queda de pessoa com diferença de nível acima de dois metros (queda de altura)
  "978", // Trabalho em altura no acesso a partes superiores de tanques e instalações do Binder
  "1277", // Queda de altura em nivel dferente - ACID 1
  "1379", // Queda - Altura - Diferença de nível maior que dois metros
])

export const CODIGOS_ESPACO_CONFINADO = new Set([
  "237", // Espaço Confinado
  "364", // Operações em Espaço Confinado
  "382", // Trabalho em Espaço confinado
  "666", // Catalogação dos espaços confinados
  "977", // Espaço confinado no acesso a tanques para inspeção e limpeza
])

type ExamToogle = {
  codigos: string[],
  nome: string,
}

export const EXAMES_LIST: Record<string, ExamToogle[]> = {
  "Exame Clínico": [
    {
      codigos: ["clinico", "11"],
      nome: "Exame Clínico"
    }, 
  ],
  "Audiometria": [
    {
      codigos: ['51.01.004-6', '50c', '10014'],
      nome: "Audiometria"
    }, 
  ],
  "Acuidade Visual": [
    {
      codigos: ['50.01.001-8', '20221407', '4447', '02002', '4445'],
      nome: "Acuidade Visual"
    },
  ],
  "Laboratório": [
    {
      codigos: ['2'],
      nome: "2,5-hexanodiona urinária"
    },
    {
      codigos: ['XX'],
      nome: "Acetona urinária"
    },
    {
      codigos: ['28.15.001-5'],
      nome: "Ácido delta aminolevulínico - ALA-U"
    },
    {
      codigos: ['28.15.003-1'],
      nome: "Ácido fenilglioxílico"
    },
    {
      codigos: ['28.15.004-0'],
      nome: "Ácido hipúrico"
    },
    {
      codigos: ['28.15.005-8'],
      nome: "Ácido mandélico"
    },
    {
      codigos: ['28.15.006-6'],
      nome: "Ácido metilhipúrico"
    },
    {
      codigos: ['5555'],
      nome: "Ácido trans, trans-mucônico"
    },
    {
      codigos: ['28010175'],
      nome: "Ácido úrico"
    },
    {
      codigos: ['1180'],
      nome: "Antígeno específico prostático total (PSA)"
    },
    {
      codigos: ['CÁDMIO'],
      nome: "Cádmio Sanguíneo"
    },
    {
      codigos: ['001234'],
      nome: "Cádmio urinários"
    },
    {
      codigos: ['28.15.009-0'],
      nome: "Carboxihemoglobina"
    },
    {
      codigos: ['28.15.012-0'],
      nome: "Chumbo sanguíneo"
    },
    {
      codigos: ['0012345'],
      nome: "Chumbo urinário"
    },
    {
      codigos: ['1332'],
      nome: "Colesterol (HDL)"
    },
    {
      codigos: ['1222'],
      nome: "Colesterol (LDL)"
    },
    {
      codigos: ['00000'],
      nome: "Colesterol (VLDL)"
    },
    {
      codigos: ['28010507'],
      nome: "Colesterol total"
    },
    {
      codigos: ['28.01.054-0'],
      nome: "Creatinina"
    },
    {
      codigos: ['02'],
      nome: "Cromo sanguíneo"
    },
    {
      codigos: ['28100239'],
      nome: "Cultura nas fezes"
    },
    {
      codigos: ['28.15.030-9'],
      nome: "Etanol"
    },
    {
      codigos: ['28.15.014-7'],
      nome: "Fenol"
    },
    {
      codigos: ['28.15.015-5'],
      nome: "Fluoreto urinário"
    },
    {
      codigos: ['002000'],
      nome: "Fungos, pesquisa a fresco"
    },
    {
      codigos: ['28.01.095-7'],
      nome: "Gama-glutamil transferase (Gama-GT)"
    },
    {
      codigos: ['28.01.097-3'],
      nome: "Glicemia"
    },
    {
      codigos: ['2336', '28040350'],
      nome: "Grupo sanguíneo ABO, e fator Rho (inclui Du)"
    },
    {
      codigos: ['28011023'],
      nome: "Hemoglobina glicada (A1 total)"
    },
    {
      codigos: ['28.04.048-1'],
      nome: "Hemograma com contagem de plaquetas ou frações"
    },
    {
      codigos: ['28.04.048-1', '28040562'],
      nome: "Hemograma com contagem de plaquetas ou frações"
    },
    {
      codigos: ['28060105'],
      nome: "Hepatite A - HAV - IgG"
    },
    {
      codigos: ['28060113'],
      nome: "Hepatite A - HAV - IgM"
    },
    {
      codigos: ['28060067'],
      nome: "Hepatite B - HBCAC - IgG"
    },
    {
      codigos: ['28061195'],
      nome: 'Hepatite B - HBCAC - IgM',
    },
    {
      codigos: ['-'],
      nome: "Hepatite B - HBeAC (anti HBE)"
    },
    {
      codigos: ['144'],
      nome: "Hepatite B - HBsAG"
    },
    {
      codigos: ['1123'],
      nome: "Hepatite B - HBsAC (anti-HBs)"
    },
    {
      codigos: ['00022'],
      nome: "Hepatite C - anti-HCV - IgG"
    },
    {
      codigos: ['1125'],
      nome: "Hepatite C - anti-HCV - IgM"
    },
    {
      codigos: ['200'],
      nome: "Hormônio gonodotrofico corionico"
    },
    {
      codigos: ['28.15.018-0'],
      nome: "Metanol"
    },
    {
      codigos: ['1', '54778844'],
      nome: "Metil Etil Cetona"
    },
    {
      codigos: ['28030141'],
      nome: "Parasitológico de fezes"
    },
    {
      codigos: ['0101'],
      nome: "Reticulócitos"
    },
    {
      codigos: ['28.13.036-7', '47788855'],
      nome: "Rotina de urina"
    },
    {
      codigos: ['28061004'],
      nome: "Sífilis - VDRL"
    },
    {
      codigos: ['09022023'],
      nome: "Tolueno urinário"
    },
    {
      codigos: ['02020'],
      nome: "Exame Toxicológico"
    },
    {
      codigos: ['28.01.136-8'],
      nome: "TGO"
    },
    {
      codigos: ['28.01.137-6'],
      nome: "TGP"
    },
    {
      codigos: ['13012023'],
      nome: "Tolueno sanguíneo"
    },
    {
      codigos: ['09022023'],
      nome: "Tolueno urinário"
    },
    {
      codigos: ['28011392'],
      nome: "Triglicerídeos"
    },
    {
      codigos: ['28.01.141-4'],
      nome: "Uréia"
    },
  ],
  "ECG": [
    {
      codigos: ['20.01.001-0'],
      nome: "ECG"
    },
  ],
  "EEG": [
    {
      codigos: ['22010017'],
      nome: "EEG"
    },
  ],
  "Psicossocial": [
    {
      codigos: ['225588', '00123', '111114'],
      nome: "Psicossocial"
    },
  ],
  "Espirometria": [
    {
      codigos: ['19.01.029-0'],
      nome: "Espirometria"
    },
  ],
  "Raio-X": [
    {
      codigos: ['32050070', '14111'],
      nome: "Radiografia de tórax (PA) Padrão OIT"
    },
    {
      codigos: ['12200', '8998'],
      nome: "Tomografia de tórax"
    },
    {
      codigos: ['ex imagem'],
      nome: "Radiografia de coluna total"
    },
    {
      codigos: ['111', '1v1v', '254477'],
      nome: "Radiografia de coluna lombo-sacra"
    },
    {
      codigos: ['-0-'],
      nome: "Radiografia de coluna dorsal"
    },
    {
      codigos: ['0..'],
      nome: "Radiografia de coluna cervical"
    },
    {
      codigos: ['2221111'],
      nome: "Métodos Diagnósticos por Imagem Coluna"
    },
  ],
  "Dinamometria": [
    {
      codigos: ['20', '58877'],
      nome: "Dinamometria"
    },
  ],
  "Ultrassom": [
    {
      codigos: ['1444', '587744'],
      nome: "Ultrassom"
    },
  ],
  "Triagem": [
    {
      codigos: ["triagem"],
      nome: "Triagem"
    }
  ]
}