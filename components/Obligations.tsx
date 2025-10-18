import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import WhatsAppIcon from './ui/WhatsAppIcon';
import { type Client, type Obligation, ObligationStatus, TaxRegime } from '../types';

// --- Helper Components (Icons & Modals) ---
const ViewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;


const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-primary">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ObligationFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Obligation | Omit<Obligation, 'id'>) => void;
    obligation: Obligation | null;
    clients: Client[];
}> = ({ isOpen, onClose, onSubmit, obligation, clients }) => {
    
    const getInitialFormData = useCallback(() => {
        if (obligation) return { ...obligation };
        return {
            name: '',
            clientId: clients[0]?.id || 0,
            dueDate: new Date().toISOString().split('T')[0],
            status: ObligationStatus.Pendente,
            taxRegime: TaxRegime.SimplesNacional,
        }
    }, [obligation, clients]);

    const [formData, setFormData] = useState(getInitialFormData());

    React.useEffect(() => {
        setFormData(getInitialFormData());
    }, [obligation, isOpen, getInitialFormData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients.find(c => c.id === Number(formData.clientId));
        const submissionData = { ...formData, taxRegime: client?.taxRegime || formData.taxRegime, clientId: Number(formData.clientId) };
        onSubmit(submissionData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={obligation ? 'Editar Obrigação' : 'Adicionar Obrigação'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <select name="clientId" value={formData.clientId} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Obrigação</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        {Object.values(ObligationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">{obligation ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </form>
        </Modal>
    );
};

const ConfirmDeleteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    obligationName: string;
}> = ({ isOpen, onClose, onConfirm, obligationName }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão">
        <p>Você tem certeza que deseja excluir a obrigação <strong>{obligationName}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="button" onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
        </div>
    </Modal>
);

const ObligationViewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    obligation: Obligation | null;
    client: Client | null;
}> = ({ isOpen, onClose, obligation, client }) => {
    if (!isOpen || !obligation || !client) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Obrigação">
            <div className="space-y-4">
                <div>
                    <h4 className="text-lg font-semibold text-secondary border-b pb-2 mb-2">Dados da Obrigação</h4>
                    <InfoRow label="Nome" value={obligation.name} />
                    <InfoRow label="Vencimento" value={formatDate(obligation.dueDate)} />
                    <InfoRow label="Regime Tributário" value={obligation.taxRegime} />
                    <div className="flex justify-between py-1 items-center">
                        <span className="font-semibold text-gray-600">Status:</span>
                        <Badge status={obligation.status} />
                    </div>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-secondary border-b pb-2 mb-2">Dados do Cliente</h4>
                    <InfoRow label="Razão Social" value={client.name} />
                    <InfoRow label="CNPJ" value={client.cnpj} />
                    <InfoRow label="Município" value={client.city} />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">Fechar</button>
            </div>
        </Modal>
    );
};

const InfoRow: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="flex justify-between py-1 border-b border-gray-100">
        <span className="font-semibold text-gray-600">{label}:</span>
        <span className="text-gray-800 text-right">{value}</span>
    </div>
);

// --- Main Obligations Component ---
interface ObligationsProps {
  clients: Client[];
  obligations: Obligation[];
  onAddObligation: (obligation: Omit<Obligation, 'id'>) => void;
  onUpdateObligation: (obligation: Obligation) => void;
  onDeleteObligation: (obligationId: number) => void;
}

const Obligations: React.FC<ObligationsProps> = ({ clients, obligations, onAddObligation, onUpdateObligation, onDeleteObligation }) => {
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete' | 'view' | null, ob: Obligation | null }>({ type: null, ob: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'all'>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');
    const [taxRegimeFilter, setTaxRegimeFilter] = useState<TaxRegime | 'all'>('all');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const closeModal = () => setModal({ type: null, ob: null });

    const handleConfirmDelete = () => {
        if (modal.ob) onDeleteObligation(modal.ob.id);
        closeModal();
    };

    const clearFilters = () => {
        setStatusFilter('all'); setClientFilter('all'); setTaxRegimeFilter('all');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterPanelOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredObligations = useMemo(() => {
        return obligations
            .filter(ob => {
                if (!searchTerm) return true;
                const lowercasedFilter = searchTerm.toLowerCase();
                const client = clients.find(c => c.id === ob.clientId);
                return ob.name.toLowerCase().includes(lowercasedFilter) ||
                       client?.name.toLowerCase().includes(lowercasedFilter) ||
                       (client && client.cnpj.replace(/[^\d]/g, '').includes(lowercasedFilter.replace(/[^\d]/g, '')));
            })
            .filter(ob => statusFilter === 'all' || ob.status === statusFilter)
            .filter(ob => clientFilter === 'all' || ob.clientId === Number(clientFilter))
            .filter(ob => taxRegimeFilter === 'all' || ob.taxRegime === taxRegimeFilter);
    }, [obligations, searchTerm, statusFilter, clientFilter, taxRegimeFilter, clients]);
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
    };

    return (
    <>
    <Card>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-primary">Controle de Obrigações</h2>
        <button onClick={() => setModal({ type: 'add', ob: null })} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent w-full md:w-auto">Adicionar Obrigação</button>
      </div>
       <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-grow">
                <input type="text" placeholder="Buscar por obrigação, cliente ou CPF/CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md"/>
            </div>
            <div className="relative" ref={filterRef}>
                <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className="w-full md:w-auto flex items-center justify-center px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <FilterIcon /><span className="ml-2">Filtros</span>
                </button>
                {isFilterPanelOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border p-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as (ObligationStatus | 'all'))} className="w-full p-2 border rounded-md">
                                    <option value="all">Todos os Status</option>
                                    {Object.values(ObligationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full p-2 border rounded-md">
                                    <option value="all">Todos os Clientes</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
                                <select value={taxRegimeFilter} onChange={e => setTaxRegimeFilter(e.target.value as (TaxRegime | 'all'))} className="w-full p-2 border rounded-md">
                                    <option value="all">Todos os Regimes</option>
                                    {Object.values(TaxRegime).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                             <button onClick={() => { clearFilters(); setIsFilterPanelOpen(false); }} className="text-sm text-secondary hover:underline">Limpar Filtros</button>
                        </div>
                    </div>
                )}
            </div>
       </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm font-semibold text-gray-600 border-b bg-gray-50">
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Obrigação</th>
              <th className="py-3 px-4">Vencimento</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Última Notificação</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredObligations.map(ob => {
              const client = clients.find(c => c.id === ob.clientId);
              return (
                <tr key={ob.id} className="text-sm text-gray-700 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{client?.name || 'N/A'}</td>
                  <td className="py-3 px-4">{ob.name}</td>
                  <td className="py-3 px-4">{formatDate(ob.dueDate)}</td>
                  <td className="py-3 px-4"><Badge status={ob.status} /></td>
                  <td className="py-3 px-4">
                    {ob.lastNotified ? (
                        <div className="flex items-center text-xs text-gray-500">
                            <WhatsAppIcon />
                            <span className="ml-1.5">{ob.lastNotified}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Nenhuma</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                     <div className="flex items-center justify-center space-x-3">
                        <button onClick={() => setModal({type: 'view', ob})} className="text-gray-500 hover:text-accent" title="Visualizar"><ViewIcon /></button>
                        <button onClick={() => setModal({type: 'edit', ob})} className="text-gray-500 hover:text-secondary" title="Editar"><EditIcon /></button>
                        <button onClick={() => setModal({type: 'delete', ob})} className="text-gray-500 hover:text-red-600" title="Excluir"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    <ObligationFormModal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} onSubmit={modal.type === 'edit' ? onUpdateObligation : onAddObligation} obligation={modal.ob} clients={clients}/>
    <ConfirmDeleteModal isOpen={modal.type === 'delete'} onClose={closeModal} onConfirm={handleConfirmDelete} obligationName={modal.ob?.name || ''}/>
    <ObligationViewModal isOpen={modal.type === 'view'} onClose={closeModal} obligation={modal.ob} client={clients.find(c => c.id === modal.ob?.clientId) || null}/>
    </>
  );
};

export default Obligations;
