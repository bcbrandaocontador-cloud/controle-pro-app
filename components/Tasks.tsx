import React, { useState, useMemo, useCallback } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import WhatsAppIcon from './ui/WhatsAppIcon';
import { type Client, type Task, TaskType } from '../types';

// --- Helper Components ---
const ViewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" /></svg>;

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

const TaskFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Task | Omit<Task, 'id' | 'createdAt'>) => void;
    task: Task | null;
    clients: Client[];
}> = ({ isOpen, onClose, onSubmit, task, clients }) => {
    
    const getInitialFormData = useCallback(() => {
        if (task) return { ...task };
        return {
            description: '',
            clientId: clients[0]?.id || 0,
            status: 'Pendente' as 'Pendente' | 'Resolvido',
            type: TaskType.Outro,
        }
    }, [task, clients]);

    const [formData, setFormData] = useState(getInitialFormData());

    React.useEffect(() => {
        setFormData(getInitialFormData());
    }, [task, isOpen, getInitialFormData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Tarefa' : 'Adicionar Tarefa'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <select name="clientId" value={formData.clientId} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Solicitação</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={3} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                        <option value="Pendente">Pendente</option>
                        <option value="Resolvido">Resolvido</option>
                    </select>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">{task ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </form>
        </Modal>
    );
};

const TaskViewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    client: Client | null;
}> = ({ isOpen, onClose, task, client }) => {
    if (!isOpen || !task || !client) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Tarefa">
            <div className="space-y-2">
                <InfoRow label="Cliente" value={client.name} />
                <InfoRow label="Tipo" value={task.type} />
                <InfoRow label="Data de Criação" value={task.createdAt} />
                <div className="flex justify-between py-2 border-b border-gray-100 items-center">
                    <span className="font-semibold text-gray-600">Status:</span>
                    <Badge status={task.status} />
                </div>
                 <div className="py-2">
                    <span className="font-semibold text-gray-600 block mb-1">Descrição:</span>
                    <p className="text-gray-800 bg-extralight p-3 rounded-md whitespace-pre-wrap">{task.description}</p>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">Fechar</button>
            </div>
        </Modal>
    );
};

const InfoRow: React.FC<{label: string, value: string | React.ReactNode}> = ({label, value}) => (
    <div className="flex justify-between py-2 border-b border-gray-100 items-start">
        <span className="font-semibold text-gray-600 flex-shrink-0 mr-4">{label}:</span>
        <span className="text-gray-800 text-right">{value}</span>
    </div>
);


// --- Main Component ---
interface TasksProps {
  clients: Client[];
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
}

const Tasks: React.FC<TasksProps> = ({ clients, tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'view' | null, task: Task | null }>({ type: null, task: null });
    const [updatedTaskId, setUpdatedTaskId] = useState<number | null>(null);
    const [sortOption, setSortOption] = useState('createdAt_desc');

    const closeModal = () => setModal({ type: null, task: null });

    const handleStatusToggle = (task: Task) => {
        const newStatus = task.status === 'Pendente' ? 'Resolvido' : 'Pendente';
        onUpdateTask({ ...task, status: newStatus });
        setUpdatedTaskId(task.id);
        setTimeout(() => setUpdatedTaskId(null), 1000);
    };

    const sortedTasks = useMemo(() => {
        const [key, order] = sortOption.split('_');
        const parseDate = (dateString: string): Date => {
            const [day, month, year] = dateString.split('/').map(Number);
            return new Date(year, month - 1, day);
        };
        return [...tasks].sort((a, b) => {
            if (key === 'createdAt') {
                const dateA = parseDate(a.createdAt);
                const dateB = parseDate(b.createdAt);
                return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }
            if (key === 'status') {
                if (a.status === b.status) return 0;
                return order === 'asc' ? (a.status === 'Pendente' ? -1 : 1) : (a.status === 'Resolvido' ? -1 : 1);
            }
            return 0;
        });
    }, [tasks, sortOption]);
    
    return (
    <>
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Gestão de Tarefas e Solicitações</h2>
        <button onClick={() => setModal({ type: 'add', task: null })} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent">Adicionar Tarefa</button>
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
            <label htmlFor="sort-tasks" className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select id="sort-tasks" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="p-2 border rounded-md text-sm">
                <option value="createdAt_desc">Mais Recentes</option>
                <option value="createdAt_asc">Mais Antigos</option>
                <option value="status_asc">Status (Pendente)</option>
                <option value="status_desc">Status (Resolvido)</option>
            </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm font-semibold text-gray-600 border-b bg-gray-50">
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Última Notificação</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTasks.map(task => {
              const client = clients.find(c => c.id === task.clientId);
              const isUpdating = updatedTaskId === task.id;
              
              return (
                <tr key={task.id} className={`text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-1000 ${isUpdating ? (task.status === 'Resolvido' ? 'bg-green-100' : 'bg-yellow-100') : ''}`}>
                  <td className="py-3 px-4 font-medium">{client?.name || 'N/A'}</td>
                  <td className="py-3 px-4 max-w-sm truncate">{task.description}</td>
                  <td className="py-3 px-4">{task.createdAt}</td>
                  <td className="py-3 px-4"><Badge status={task.status} /></td>
                   <td className="py-3 px-4">
                    {task.lastNotified ? (
                        <div className="flex items-center text-xs text-gray-500">
                            <WhatsAppIcon />
                            <span className="ml-1.5">{task.lastNotified}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Nenhuma</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                     <div className="flex items-center justify-center space-x-3">
                        <button onClick={() => handleStatusToggle(task)} className={`p-1 rounded-full ${task.status === 'Pendente' ? 'text-green-600 hover:bg-green-100' : 'text-yellow-700 hover:bg-yellow-100'}`} title={task.status === 'Pendente' ? 'Marcar como Resolvido' : 'Marcar como Pendente'}>
                          {task.status === 'Pendente' ? <CheckIcon /> : <RefreshIcon />}
                        </button>
                        <button onClick={() => setModal({type: 'view', task})} className="text-gray-500 hover:text-accent" title="Visualizar"><ViewIcon /></button>
                        <button onClick={() => setModal({type: 'edit', task})} className="text-gray-500 hover:text-secondary" title="Editar"><EditIcon /></button>
                        <button onClick={() => onDeleteTask(task.id)} className="text-gray-500 hover:text-red-600" title="Excluir"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    <TaskFormModal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} onSubmit={modal.type === 'edit' ? onUpdateTask : onAddTask} task={modal.task} clients={clients}/>
    <TaskViewModal isOpen={modal.type === 'view'} onClose={closeModal} task={modal.task} client={clients.find(c => c.id === modal.task?.clientId) || null}/>
    </>
  );
};

export default Tasks;
