
import { GoogleGenAI, Type } from "@google/genai";
import type { CpfData, CnpjData, Obligation, Task, Client, ClientDocument } from '../types';
import { TaxRegime } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
    if (!aiInstance) {
        if (!process.env.API_KEY) {
            throw new Error("A chave da API (API_KEY) não foi configurada nas variáveis de ambiente.");
        }
        aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return aiInstance;
};


// --- PROMPTS ---

const generatePromptForCpf = (cpf: string): string => `
  Aja como um serviço de consulta de dados públicos. Para o CPF fornecido, retorne os dados cadastrais públicos associados.
  O CPF para a consulta é ${cpf}.
  A situação cadastral deve ser "Regular". O nome deve ser um nome completo plausível e a data de inscrição uma data realista.
  Retorne um objeto JSON com a seguinte estrutura e tipos de dados:
  - nome: string (nome completo plausível)
  - cpf: string (o número fornecido, formatado como XXX.XXX.XXX-XX)
  - situacaoCadastral: string (deve ser "Regular")
  - dataInscricao: string (data realista no formato DD/MM/AAAA)
`;

const generatePromptForCnpj = (cnpj: string): string => `
  Aja como um especialista da Receita Federal para consulta de dados públicos. Para o CNPJ fornecido, retorne os dados cadastrais públicos e realistas da empresa.
  O CNPJ para a consulta é ${cnpj}.
  A situação cadastral deve ser "Ativa". Os outros campos devem ser preenchidos com dados plausíveis para uma empresa real.
  O regime tributário deve ser um dos seguintes: 'Simples Nacional', 'Lucro Presumido', ou 'Lucro Real'.
  Retorne um objeto JSON com a seguinte estrutura e tipos de dados:
  - razaoSocial: string (nome de empresa plausível)
  - nomeFantasia: string (nome fantasia plausível)
  - cnpj: string (o número fornecido, formatado como XX.XXX.XXX/XXXX-XX)
  - situacaoCadastral: string (deve ser "Ativa")
  - dataAbertura: string (data realista no formato DD/MM/AAAA)
  - endereco: string (endereço completo e realista no Brasil, incluindo cidade e estado)
  - atividadePrincipal: string (descrição de uma atividade empresarial plausível)
  - taxRegime: string (o regime tributário da empresa)
`;

const generatePromptForWhatsApp = (
  clientName: string,
  details: { type: 'obligation'; name: string; dueDate: string } | { type: 'task'; description: string }
): string => {
  const commonIntro = `
    Aja como um assistente de um escritório de contabilidade. Sua tarefa é gerar uma mensagem de WhatsApp curta, clara e profissional para um cliente.
    Use formatação de WhatsApp, como asteriscos para negrito (ex: *texto em negrito*).
    O nome do cliente é ${clientName}.
  `;

  if (details.type === 'obligation') {
    return `
      ${commonIntro}
      O objetivo é lembrar o cliente sobre o vencimento de uma obrigação fiscal/trabalhista.
      A obrigação é: "${details.name}".
      A data de vencimento é: ${details.dueDate}.

      A mensagem deve começar com "Olá, ${clientName}!" e terminar com "Atenciosamente, Brandão Contabilidade".
      Gere a mensagem final.
    `;
  } else { // Task
    return `
      ${commonIntro}
      O objetivo é lembrar o cliente sobre uma tarefa/solicitação que está pendente.
      A descrição da tarefa é: "${details.description}".

      A mensagem deve começar com "Olá, ${clientName}!" e pedir educadamente para o cliente verificar a pendência. Termine com "Atenciosamente, Brandão Contabilidade".
      Gere a mensagem final.
    `;
  }
};

const generatePromptForDocumentAnalysis = (documentContent: string): string => `
  Aja como um sistema de OCR e extração de dados especializado em documentos fiscais brasileiros.
  Analise o conteúdo do documento a seguir e extraia as informações essenciais.
  O conteúdo do documento é: "${documentContent}".

  Retorne um objeto JSON com a seguinte estrutura e tipos de dados:
  - valor: number (o valor total a ser pago, use ponto como separador decimal)
  - dataVencimento: string (a data de vencimento no formato YYYY-MM-DD)
  - codigoBarras: string (o número completo do código de barras, apenas dígitos)

  Exemplo de saída:
  {
    "valor": 452.87,
    "dataVencimento": "2024-07-15",
    "codigoBarras": "84670000004552870112345678901234567890123456"
  }
`;

// --- RESPONSE SCHEMAS ---

const responseSchemaCpf = {
  type: Type.OBJECT,
  properties: {
    nome: { type: Type.STRING },
    cpf: { type: Type.STRING },
    situacaoCadastral: { type: Type.STRING },
    dataInscricao: { type: Type.STRING },
  },
  required: ['nome', 'cpf', 'situacaoCadastral', 'dataInscricao'],
};

const responseSchemaCnpj = {
  type: Type.OBJECT,
  properties: {
    razaoSocial: { type: Type.STRING },
    nomeFantasia: { type: Type.STRING },
    cnpj: { type: Type.STRING },
    situacaoCadastral: { type: Type.STRING },
    dataAbertura: { type: Type.STRING },
    endereco: { type: Type.STRING },
    atividadePrincipal: { type: Type.STRING },
    taxRegime: {
      type: Type.STRING,
      enum: [TaxRegime.SimplesNacional, TaxRegime.LucroPresumido, TaxRegime.LucroReal],
    },
  },
  required: ['razaoSocial', 'nomeFantasia', 'cnpj', 'situacaoCadastral', 'dataAbertura', 'endereco', 'atividadePrincipal', 'taxRegime'],
};

const responseSchemaDocumentAnalysis = {
    type: Type.OBJECT,
    properties: {
        valor: { type: Type.NUMBER },
        dataVencimento: { type: Type.STRING },
        codigoBarras: { type: Type.STRING },
    },
    required: ['valor', 'dataVencimento', 'codigoBarras'],
};

// --- API FUNCTIONS ---

const callGemini = async (prompt: string, schema: object, model: string = "gemini-2.5-flash") => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && error.message.includes("API_KEY")) {
            throw new Error("A chave da API não foi configurada corretamente.");
        }
        throw new Error("Falha na comunicação com a API de IA.");
    }
};

export const queryDocument = async (type: 'CPF' | 'CNPJ', value: string): Promise<CpfData | CnpjData> => {
  const prompt = type === 'CPF' ? generatePromptForCpf(value) : generatePromptForCnpj(value);
  const schema = type === 'CPF' ? responseSchemaCpf : responseSchemaCnpj;
  try {
      return await callGemini(prompt, schema);
  } catch(e) {
      if (e instanceof Error) throw e;
      throw new Error("Falha ao consultar os dados. Verifique o documento e tente novamente.");
  }
};

export const analyzeDocument = async (doc: ClientDocument): Promise<Omit<ClientDocument, 'id' | 'clientId' | 'name' | 'fileName' | 'type'| 'competence'|'uploadedAt'>> => {
    // In a real app, we would convert the uploaded file (PDF, image) to a base64 string
    // and send it. Here, we simulate the content based on the document name for demonstration.
    const simulatedContent = `Conteúdo simulado do documento ${doc.name} para o cliente ${doc.clientId}. Este é um DARF para PIS/COFINS. Valor R$ 452,87. Vencimento: 15/07/2024. Código: 84670000004552870112345678901234567890123456.`;
    const prompt = generatePromptForDocumentAnalysis(simulatedContent);
    try {
        const result = await callGemini(prompt, responseSchemaDocumentAnalysis);
        return { ...result, analisado: true };
    } catch (e) {
        throw new Error("Falha ao analisar o documento.");
    }
};

export const generateWhatsAppMessage = async (
  item: Obligation | Task,
  client: Client
): Promise<string> => {
  const isObligation = 'dueDate' in item;

  const details = isObligation
    ? { type: 'obligation' as const, name: item.name, dueDate: new Date(item.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
    : { type: 'task' as const, description: item.description };

  const prompt = generatePromptForWhatsApp(client.name, details);

  try {
     const ai = getAiInstance();
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // Replace placeholder with actual office name
    return response.text.replace("[Nome do Escritório]", "Brandão Contabilidade");
  } catch (error) {
    console.error("Error generating WhatsApp message with Gemini:", error);
    // Fallback message
    if (isObligation) {
        return `Olá, ${client.name}! Lembrete de vencimento da obrigação *${item.name}* em *${details.dueDate}*. Atenciosamente, Brandão Contabilidade.`;
    }
    return `Olá, ${client.name}! Lembrete de pendência: *${item.description}*. Atenciosamente, Brandão Contabilidade.`;
  }
};
