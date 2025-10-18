import React, { useState, useCallback } from 'react';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { queryDocument } from '../services/geminiService';
import type { CpfData, CnpjData } from '../types';

// --- Validation Functions ---
const validateCnpj = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;

  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

const validateCpf = (cpf: string): boolean => {
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    return true;
};


const PublicQuery: React.FC = () => {
  const [queryType, setQueryType] = useState<'CPF' | 'CNPJ'>('CNPJ');
  const [document, setDocument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CpfData | CnpjData | null>(null);

  const handleQuery = useCallback(async () => {
    if (!document) {
      setError('Por favor, insira um documento para consultar.');
      return;
    }

    // Clear previous errors when a new query is attempted
    setError(null);

    if (queryType === 'CNPJ' && !validateCnpj(document)) {
        setError('Formato de CNPJ inválido. Verifique o número e tente novamente.');
        return;
    }
    if (queryType === 'CPF' && !validateCpf(document)) {
        setError('Formato de CPF inválido. Verifique o número e tente novamente.');
        return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await queryDocument(queryType, document);
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [document, queryType]);
  
  const isCpfData = (data: CpfData | CnpjData | null): data is CpfData => {
    return data !== null && 'cpf' in data;
  };

  const isCnpjData = (data: CpfData | CnpjData | null): data is CnpjData => {
    return data !== null && 'cnpj' in data;
  };


  return (
    <Card>
      <div className="max-w-2xl mx-auto">
        <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => { setQueryType('CNPJ'); setResult(null); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${queryType === 'CNPJ' ? 'bg-secondary text-white' : 'bg-white text-gray-600'}`}
          >
            Consultar CNPJ
          </button>
          <button
            onClick={() => { setQueryType('CPF'); setResult(null); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${queryType === 'CPF' ? 'bg-secondary text-white' : 'bg-white text-gray-600'}`}
          >
            Consultar CPF
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder={`Digite o ${queryType}`}
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:outline-none"
          />
          <button
            onClick={handleQuery}
            disabled={isLoading}
            className="px-6 py-3 bg-secondary text-white font-semibold rounded-md hover:bg-accent transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        <div className="mt-6 min-h-[200px]">
          {isLoading && <Spinner />}
          {error && <div className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</div>}
          {result && isCnpjData(result) && <CnpjResult data={result} />}
          {result && isCpfData(result) && <CpfResult data={result} />}
        </div>
      </div>
    </Card>
  );
};

const CnpjResult: React.FC<{ data: CnpjData }> = ({ data }) => (
  <Card className="bg-gray-50 border border-gray-200">
    <h3 className="text-lg font-bold text-primary mb-2">{data.razaoSocial}</h3>
    <p className="text-sm text-gray-600 mb-4">{data.nomeFantasia}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <InfoItem label="CNPJ" value={data.cnpj} />
        <InfoItem label="Data de Abertura" value={data.dataAbertura} />
        <InfoItem label="Situação Cadastral" value={data.situacaoCadastral} highlight={true}/>
        <div className="md:col-span-2">
            <InfoItem label="Atividade Principal" value={data.atividadePrincipal} />
        </div>
        <div className="md:col-span-2">
            <InfoItem label="Endereço" value={data.endereco} />
        </div>
    </div>
  </Card>
);

const CpfResult: React.FC<{ data: CpfData }> = ({ data }) => (
    <Card className="bg-gray-50 border border-gray-200">
    <h3 className="text-lg font-bold text-primary mb-4">{data.nome}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <InfoItem label="CPF" value={data.cpf} />
        <InfoItem label="Data de Inscrição" value={data.dataInscricao} />
        <InfoItem label="Situação Cadastral" value={data.situacaoCadastral} highlight={true}/>
    </div>
  </Card>
);

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div>
        <p className="font-semibold text-gray-500">{label}</p>
        <p className={`text-gray-800 ${highlight ? 'font-bold text-green-600' : ''}`}>{value}</p>
    </div>
);


export default PublicQuery;