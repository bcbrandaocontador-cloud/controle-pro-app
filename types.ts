export enum TaxRegime {
  SimplesNacional = 'Simples Nacional',
  LucroPresumido = 'Lucro Presumido',
  LucroReal = 'Lucro Real',
}

export enum ObligationStatus {
  Pendente = 'Pendente',
  EmAndamento = 'Em Andamento',
  Entregue = 'Entregue',
  Vencido = 'Vencido',
}

export enum TaskType {
    Contabil = 'Contábil',
    Fiscal = 'Fiscal',
    Trabalhista = 'Trabalhista',
    Guia = 'Guia de Imposto',
    Pagamento = 'Pagamento', // Added new type for payment tasks
    Outro = 'Outro',
}

export enum DocumentType {
    FolhaPagamento = 'Folha de Pagamento',
    GuiaImposto = 'Guia de Imposto',
    Certidao = 'Certidão',
    Outro = 'Outro',
}

export interface Client {
  id: number;
  name: string;
  cnpj: string; // Can be CNPJ or CPF
  taxRegime: TaxRegime;
  city: string;
  isActive: boolean;
  observations?: string;
  phone?: string;
}

export interface Obligation {
  id: number;
  clientId: number;
  name:string;
  dueDate: string; // YYYY-MM-DD
  status: ObligationStatus;
  taxRegime: TaxRegime;
  lastNotified?: string; // DD/MM/YYYY
}

export interface Task {
    id: number;
    clientId: number;
    description: string;
    type: TaskType;
    status: 'Pendente' | 'Resolvido';
    createdAt: string; // DD/MM/YYYY
    lastNotified?: string; // DD/MM/YYYY
}

export interface ClientDocument {
    id: number;
    clientId: number;
    name: string; // e.g., "Holerites Julho/2024"
    fileName: string; // e.g., "holerites_jul_2024.pdf"
    type: DocumentType;
    competence: string; // "YYYY-MM"
    uploadedAt: string; // "DD/MM/YYYY"
    // Fields for AI analysis results
    valor?: number;
    dataVencimento?: string; // YYYY-MM-DD
    codigoBarras?: string;
    analisado?: boolean;
}

export interface CpfData {
  nome: string;
  cpf: string;
  situacaoCadastral: string;
  dataInscricao: string;
}

export interface CnpjData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  situacaoCadastral: string;
  dataAbertura: string;
  endereco: string;
  atividadePrincipal: string;
  taxRegime: TaxRegime; // Added taxRegime to the response type
}

export type ClientAction = 'Criado' | 'Atualizado' | 'Excluído';

export interface ClientHistoryLog {
  id: number;
  clientId: number;
  date: string; // Format: DD/MM/YYYY, HH:mm:ss
  action: ClientAction;
  details: string;
}