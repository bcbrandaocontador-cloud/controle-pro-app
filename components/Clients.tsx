import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from './ui/Card';
import { TaxRegime } from '../types';
import type { Client, ClientHistoryLog, ClientDocument, Obligation } from '../types';
import { DocumentType, ObligationStatus } from '../types';

// --- Helper Components (Modals & Icons) ---

const ViewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 4-4-4 5.293-5.293a1 1 0 011.414 0L10 12zm-3 8l4-4 2 2 4-4-2-2-4 4-2-2-4 4z" /></svg>;

// --- Document Validation ---
const validateCpf = (cpf: string): boolean => {
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    return true;
};

const validateCnpj = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;
  let size = cleaned.length - 2, numbers = cleaned.substring(0, size), digits = cleaned.substring(size), sum = 0, pos = size - 7, result;
  for (let i = size; i >= 1; i--) { sum += parseInt(numbers.charAt(size - i)) * pos--; if (pos < 2) pos = 9; }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1; numbers = cleaned.substring(0, size); sum = 0; pos = size - 7;
  for (let i = size; i >= 1; i--) { sum += parseInt(numbers.charAt(size - i)) * pos--; if (pos < 2) pos = 9; }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

const validateDocument = (doc: string): boolean => {
    const cleaned = doc.replace(/[^\d]/g, '');
    return cleaned.length === 11 ? validateCpf(cleaned) : cleaned.length === 14 ? validateCnpj(cleaned) : false;
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;
    const sizeClass = size === 'lg' ? 'max-w-lg' : 'max-w-xl';
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClass} p-6`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-primary">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ClientFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (client: Client | Omit<Client, 'id'>, createObligations: boolean) => void;
    client: Client | null;
}> = ({ isOpen, onClose, onSubmit, client }) => {
    const [formData, setFormData] = useState({ name: '', cnpj: '', taxRegime: TaxRegime.SimplesNacional, city: '', phone: '', isActive: true, observations: '' });
    const [errors, setErrors] = useState<{ cnpj?: string }>({});
    const [createObligations, setCreateObligations] = useState(true);

    useEffect(() => {
        const initialData = client || { name: '', cnpj: '', taxRegime: TaxRegime.SimplesNacional, city: '', phone: '', isActive: true, observations: '' };
        setFormData({ ...initialData, observations: initialData.observations || '', phone: initialData.phone || '' });
        setErrors({});
        setCreateObligations(true);
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
        if (name === 'cnpj' && errors.cnpj) setErrors(prev => ({ ...prev, cnpj: undefined }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateDocument(formData.cnpj)) {
            setErrors({ cnpj: 'CPF/CNPJ inválido. Por favor, verifique o número.' });
            return;
        }
        onSubmit(client ? { ...client, ...formData } : formData, createObligations);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Adicionar Cliente'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <InputField label="Razão Social / Nome" name="name" value={formData.name} onChange={handleChange} required />
                    <div>
                        <InputField label="CPF/CNPJ" name="cnpj" value={formData.cnpj} onChange={handleChange} required />
                        {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Município" name="city" value={formData.city} onChange={handleChange} required />
                        <InputField label="Telefone (WhatsApp)" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div>
                        <label htmlFor="observations" className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Adicione notas..."/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Regime Tributário</label>
                        <select name="taxRegime" value={formData.taxRegime} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            {Object.values(TaxRegime).map(regime => <option key={regime} value={regime}>{regime}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-secondary rounded"/>
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Cliente Ativo</label>
                    </div>
                    {!client && (
                       <div className="flex items-start bg-extralight p-3 rounded-md border">
                            <input type="checkbox" id="createObligations" checked={createObligations} onChange={(e) => setCreateObligations(e.target.checked)} className="h-4 w-4 text-secondary rounded mt-1"/>
                            <div className="ml-2">
                                <label htmlFor="createObligations" className="text-sm font-medium text-gray-900">Consultar e criar obrigações mensais padrão automaticamente.</label>
                                <p className="text-xs text-gray-600">(Apenas para CNPJ. O sistema identificará o regime tributário.)</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">{client ? 'Salvar Alterações' : 'Adicionar Cliente'}</button>
                </div>
            </form>
        </Modal>
    );
};

const InputField: React.FC<{label: string, name: string, value:string, onChange: any, required?: boolean}> = ({label, name, value, onChange, required}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type="text" id={name} name={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
    </div>
);

const DocumentUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (docData: Omit<ClientDocument, 'id' | 'uploadedAt' | 'clientId'>) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [fileName, setFileName] = useState('');
    const [type, setType] = useState<DocumentType>(DocumentType.Outro);
    const [competence, setCompetence] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setName(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName || !name || !competence || !type) return;
        onSubmit({ name, fileName, type, competence });
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            setName(''); setFileName(''); setType(DocumentType.Outro); setCompetence(new Date().toISOString().slice(0, 7));
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Documento">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Arquivo</label>
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-accent" required/>
                </div>
                <InputField label="Nome de Exibição" name="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Competência</label>
                    <input type="month" value={competence} onChange={e => setCompetence(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                    <select value={type} onChange={e => setType(e.target.value as DocumentType)} className="mt-1 block w-full p-2 border rounded-md" required>
                       {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                 <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">Adicionar</button>
                </div>
            </form>
        </Modal>
    );
};

const ConfirmUpdateObligationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    obligation: Obligation | null;
}> = ({ isOpen, onClose, onConfirm, obligation }) => {
    if (!obligation) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Automação Sugerida">
            <p className="text-gray-700">O documento que você adicionou parece corresponder a uma obrigação pendente.</p>
            <p className="mt-4">Deseja marcar a obrigação <strong className="text-secondary">"{obligation.name}"</strong> como <strong className="text-green-600">"Entregue"</strong>?</p>
            <div className="mt-6 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Não, obrigado</button>
                <button type="button" onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Confirmar</button>
            </div>
        </Modal>
    );
};


const ClientViewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    history: ClientHistoryLog[];
    documents: ClientDocument[];
    onAddDocument: (docData: Omit<ClientDocument, 'id' | 'uploadedAt'>) => Obligation | null;
    onDeleteDocument: (docId: number) => void;
    onUpdateObligation: (ob: Obligation) => void;
    onAnalyzeDocument: (docId: number) => void;
}> = ({ isOpen, onClose, client, history, documents, onAddDocument, onDeleteDocument, onUpdateObligation, onAnalyzeDocument }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [obligationToUpdate, setObligationToUpdate] = useState<Obligation | null>(null);
    const [analyzingDocId, setAnalyzingDocId] = useState<number | null>(null);

    useEffect(() => { if (isOpen) setActiveTab('details'); }, [isOpen]);

// FIX: The useMemo hook was refactored to explicitly type the initial value for the `reduce` function. 
// This resolves a type inference issue that caused subsequent errors when mapping over the resulting object.
    const documentsByCompetence = useMemo(() => {
        return documents.reduce((acc, doc) => {
            const [year, month] = doc.competence.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const competenceLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
            if (!acc[competenceLabel]) acc[competenceLabel] = [];
            acc[competenceLabel].push(doc);
            return acc;
        }, {} as Record<string, ClientDocument[]>);
    }, [documents]);
    
    if (!client) return null;
    
    const actionColorMap = { 'Criado': '#28a745', 'Atualizado': '#ffc107', 'Excluído': '#dc3545' };

    const handleDocumentSubmit = (docData: Omit<ClientDocument, 'id' | 'uploadedAt' | 'clientId'>) => {
        const potentialObligation = onAddDocument({ ...docData, clientId: client.id });
        if (potentialObligation) setObligationToUpdate(potentialObligation);
        setUploadModalOpen(false);
    };
    
    const handleConfirmObligationUpdate = () => {
        if (obligationToUpdate) onUpdateObligation({ ...obligationToUpdate, status: ObligationStatus.Entregue });
        setObligationToUpdate(null);
    };

    const handleAnalyzeClick = async (docId: number) => {
        setAnalyzingDocId(docId);
        await onAnalyzeDocument(docId);
        setAnalyzingDocId(null);
    };

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${client.name}`} size="xl">
           <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Detalhes e Histórico</button>
                    <button onClick={() => setActiveTab('documents')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Documentos</button>
                </nav>
           </div>
           
           <div className="pt-6">
            {activeTab === 'details' && (
                <div>
                    <div className="space-y-2">
                        <InfoRow label="Razão Social / Nome" value={client.name} />
                        <InfoRow label="CPF/CNPJ" value={client.cnpj} />
                        <InfoRow label="Telefone" value={client.phone || 'Não cadastrado'} />
                        <InfoRow label="Regime Tributário" value={client.taxRegime} />
                        <InfoRow label="Município" value={client.city} />
                        <InfoRow label="Status" value={client.isActive ? 'Ativo' : 'Inativo'} highlight={client.isActive ? 'green' : 'red'} />
                    </div>
                    {client.observations && (
                       <div className="mt-4 pt-4 border-t">
                            <h4 className="text-md font-semibold text-secondary mb-2">Observações</h4>
                            <p className="text-sm text-gray-700 bg-extralight p-3 rounded-md whitespace-pre-wrap">{client.observations}</p>
                        </div>
                    )}
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-secondary border-b pb-2 mb-2">Histórico de Alterações</h4>
                        {history.length > 0 ? (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {history.map(log => (
                                    <div key={log.id} className="text-sm border-l-4 pl-3 py-1 bg-extralight" style={{ borderColor: actionColorMap[log.action] }}>
                                        <div className="flex justify-between items-center"><span className="font-bold text-primary">{log.action}</span><span className="text-xs text-gray-500">{log.date}</span></div>
                                        <p className="text-gray-700 whitespace-pre-line">{log.details}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (<p className="text-sm text-gray-500 italic">Nenhuma alteração registrada.</p>)}
                    </div>
                </div>
            )}

            {activeTab === 'documents' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-secondary">Documentos do Cliente</h4>
                        <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent text-sm">Adicionar Documento</button>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {Object.keys(documentsByCompetence).length > 0 ? Object.entries(documentsByCompetence).map(([competence, docs]) => (
                            <div key={competence}>
                                <h5 className="font-bold text-primary border-b pb-1 mb-2">{competence}</h5>
                                <ul className="space-y-2">
                                    {docs.map(doc => (
                                        <li key={doc.id} className="p-3 bg-extralight rounded-md border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start min-w-0">
                                                    <FileIcon />
                                                    <div className="ml-3 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                                                        <p className="text-xs text-gray-500">{doc.type} - Adicionado em {doc.uploadedAt}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center flex-shrink-0 ml-2">
                                                     {doc.type === DocumentType.GuiaImposto && !doc.analisado && (
                                                        <button 
                                                            onClick={() => handleAnalyzeClick(doc.id)}
                                                            disabled={analyzingDocId === doc.id}
                                                            className="flex items-center text-xs px-2 py-1 bg-accent text-white rounded-md hover:bg-secondary disabled:bg-gray-400 mr-2"
                                                        >
                                                            <SparklesIcon /> <span className="ml-1">{analyzingDocId === doc.id ? 'Analisando...' : 'Analisar com IA'}</span>
                                                        </button>
                                                    )}
                                                    <button onClick={() => onDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                                                </div>
                                            </div>
                                            {doc.analisado && (
                                                <div className="mt-2 pt-2 border-t border-gray-300 grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="font-semibold text-gray-500 block">Valor:</span>
                                                        <span className="text-primary font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.valor || 0)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-500 block">Vencimento:</span>
                                                        <span className="text-primary font-bold">{doc.dataVencimento ? new Date(doc.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )) : (<p className="text-sm text-gray-500 italic text-center py-4">Nenhum documento encontrado.</p>)}
                    </div>
                </div>
            )}
           </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">Fechar</button>
            </div>
        </Modal>
        <DocumentUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSubmit={handleDocumentSubmit}/>
        <ConfirmUpdateObligationModal isOpen={!!obligationToUpdate} onClose={() => setObligationToUpdate(null)} onConfirm={handleConfirmObligationUpdate} obligation={obligationToUpdate}/>
        </>
    );
};

const InfoRow: React.FC<{label: string, value: string, highlight?: 'green' | 'red'}> = ({label, value, highlight}) => (
    <div className="flex justify-between py-1 border-b">
        <span className="font-semibold text-gray-600">{label}:</span>
        <span className={`font-medium ${highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
    </div>
);

const ConfirmDeleteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    clientName: string;
}> = ({ isOpen, onClose, onConfirm, clientName }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão">
        <p>Você tem certeza que deseja excluir o cliente <strong>{clientName}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="button" onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
        </div>
    </Modal>
);

interface ClientsProps {
  clients: Client[];
  clientHistory: ClientHistoryLog[];
  documents: ClientDocument[];
  onAddClient: (client: Omit<Client, 'id'>, createObligations: boolean) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: number) => void;
  onAddDocument: (docData: Omit<ClientDocument, 'id' | 'uploadedAt'>) => Obligation | null;
  onDeleteDocument: (docId: number) => void;
  onUpdateObligation: (ob: Obligation) => void;
  onAnalyzeDocument: (docId: number) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, clientHistory, documents, onAddClient, onUpdateClient, onDeleteClient, onAddDocument, onDeleteDocument, onUpdateObligation, onAnalyzeDocument }) => {
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'view' | 'delete' | null, client: Client | null }>({ type: null, client: null });
    const [searchTerm, setSearchTerm] = useState('');
    
    const closeModal = useCallback(() => setModal({ type: null, client: null }), []);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const lowercasedFilter = searchTerm.toLowerCase();
        const numericFilter = lowercasedFilter.replace(/[^\d]/g, '');
        return clients.filter(client =>
            client.name.toLowerCase().includes(lowercasedFilter) ||
            (numericFilter && client.cnpj.replace(/[^\d]/g, '').includes(numericFilter))
        );
    }, [clients, searchTerm]);

    const handleFormSubmit = (clientData: Client | Omit<Client, 'id'>, createObligations: boolean) => {
        if ('id' in clientData) onUpdateClient(clientData);
        else onAddClient(clientData, createObligations);
    };

    const handleConfirmDelete = () => {
        if(modal.client) onDeleteClient(modal.client.id);
        closeModal();
    }
  
  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Lista de Clientes</h2>
            <button onClick={() => setModal({ type: 'add', client: null })} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent transition-colors">Adicionar Cliente</button>
        </div>
        <div className="mb-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome ou CPF/CNPJ..." className="w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-sm font-semibold text-gray-600 border-b bg-gray-50">
                        <th className="py-3 px-4">Razão Social / Nome</th>
                        <th className="py-3 px-4">CPF/CNPJ</th>
                        <th className="py-3 px-4">Regime</th>
                        <th className="py-3 px-4">Município</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredClients.map(client => (
                        <tr key={client.id} className="text-sm text-gray-700 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{client.name}</td>
                            <td className="py-3 px-4">{client.cnpj}</td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${client.taxRegime === TaxRegime.SimplesNacional ? 'bg-blue-100 text-blue-800' : client.taxRegime === TaxRegime.LucroPresumido ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                                    {client.taxRegime}
                                </span>
                            </td>
                            <td className="py-3 px-4">{client.city}</td>
                            <td className="py-3 px-4">
                                <span className={`text-sm font-bold ${client.isActive ? 'text-green-600' : 'text-red-600'}`}>{client.isActive ? 'Ativo' : 'Inativo'}</span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-center space-x-3">
                                    <button onClick={() => setModal({type: 'view', client})} className="text-gray-500 hover:text-accent" title="Visualizar"><ViewIcon /></button>
                                    <button onClick={() => setModal({type: 'edit', client})} className="text-gray-500 hover:text-secondary" title="Editar"><EditIcon /></button>
                                    <button onClick={() => setModal({type: 'delete', client})} className="text-gray-500 hover:text-red-600" title="Excluir"><DeleteIcon /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>

    <ClientFormModal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} onSubmit={handleFormSubmit} client={modal.client}/>
    <ClientViewModal isOpen={modal.type === 'view'} onClose={closeModal} client={modal.client} history={modal.client ? clientHistory.filter(h => h.clientId === modal.client.id) : []} documents={modal.client ? documents.filter(d => d.clientId === modal.client.id) : []} onAddDocument={onAddDocument} onDeleteDocument={onDeleteDocument} onUpdateObligation={onUpdateObligation} onAnalyzeDocument={onAnalyzeDocument}/>
    <ConfirmDeleteModal isOpen={modal.type === 'delete'} onClose={closeModal} onConfirm={handleConfirmDelete} clientName={modal.client?.name || ''}/>
    </>
  );
};

export default Clients;