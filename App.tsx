import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Obligations from './components/Obligations';
import Tasks from './components/Tasks';
import PublicQuery from './components/PublicQuery';
import Certificates from './components/Certificates';
import FiscalSituation from './components/FiscalSituation';
import Toast from './components/ui/Toast';
import { MOCK_CLIENTS, MOCK_OBLIGATIONS, MOCK_TASKS, MOCK_DOCUMENTS } from './constants';
import type { Client, Obligation, Task, ClientHistoryLog, ClientAction, CnpjData, ClientDocument } from './types';
import { ObligationStatus, TaxRegime, DocumentType, TaskType } from './types';
import { queryDocument, generateWhatsAppMessage, analyzeDocument } from './services/geminiService';
import { sendWhatsAppMessage } from './services/whatsappService';


export type View = 'dashboard' | 'clients' | 'obligations' | 'tasks' | 'certificates' | 'query' | 'fiscal';

// --- Helper Functions ---
const isCPF = (doc: string): boolean => doc.replace(/[^\d]/g, '').length === 11;

const getNextMonthDueDate = (day: number) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day);
    return nextMonth.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [obligations, setObligations] = useState<Obligation[]>(MOCK_OBLIGATIONS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [documents, setDocuments] = useState<ClientDocument[]>(MOCK_DOCUMENTS);
  const [clientHistory, setClientHistory] = useState<ClientHistoryLog[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- History Logger ---
  const addClientHistoryLog = (clientId: number, action: ClientAction, details: string) => {
    const newLog: ClientHistoryLog = {
      id: Date.now(),
      clientId,
      date: new Date().toLocaleString('pt-BR'),
      action,
      details,
    };
    setClientHistory(prev => [newLog, ...prev]);
  };
  
  // --- Obligation Handlers ---
  const handleAddObligation = (obligation: Omit<Obligation, 'id'>) => {
     setObligations(prev => [...prev, { ...obligation, id: Date.now() + Math.random() }]);
  };
  const handleUpdateObligation = (updatedObligation: Obligation) => {
    setObligations(prev => prev.map(o => o.id === updatedObligation.id ? updatedObligation : o));
    addClientHistoryLog(updatedObligation.clientId, 'Atualizado', `Obrigação "${updatedObligation.name}" atualizada para ${updatedObligation.status}.`);
  };
  const handleDeleteObligation = (obligationId: number) => {
    setObligations(prev => prev.filter(o => o.id !== obligationId));
  };

  // --- Automatic Obligation Creation ---
  const createRecurringObligations = (client: Client) => {
    if (!client.taxRegime) return;

    const obligationsToAdd: Omit<Obligation, 'id'>[] = [];
    obligationsToAdd.push(
        { name: 'eSocial - Folha de Pagamento', dueDate: getNextMonthDueDate(7), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime },
        { name: 'DCTFWeb - INSS e IRRF', dueDate: getNextMonthDueDate(15), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime },
        { name: 'FGTS Digital', dueDate: getNextMonthDueDate(20), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime }
    );
    switch (client.taxRegime) {
        case TaxRegime.SimplesNacional:
            obligationsToAdd.push({ name: 'PGDAS-D - Apuração do Imposto', dueDate: getNextMonthDueDate(20), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime });
            break;
        case TaxRegime.LucroPresumido:
        case TaxRegime.LucroReal:
            obligationsToAdd.push(
                { name: 'EFD Contribuições (PIS/COFINS)', dueDate: getNextMonthDueDate(15), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime },
                { name: 'EFD ICMS/IPI (SPED Fiscal)', dueDate: getNextMonthDueDate(22), status: ObligationStatus.Pendente, clientId: client.id, taxRegime: client.taxRegime }
            );
            break;
    }
    obligationsToAdd.forEach(ob => handleAddObligation(ob));
  };

  // --- Client Handlers ---
  const handleAddClient = async (clientData: Omit<Client, 'id'>, createObligations: boolean) => {
    const newClient = { ...clientData, id: Date.now() };
    setClients(prev => [...prev, newClient]);
    addClientHistoryLog(newClient.id, 'Criado', `Cliente "${newClient.name}" foi criado.`);
  
    if (createObligations && !isCPF(newClient.cnpj)) {
      try {
        const publicData = await queryDocument('CNPJ', newClient.cnpj) as CnpjData;
        const updatedClientWithRegime = { ...newClient, taxRegime: publicData.taxRegime };
        setClients(prevClients => prevClients.map(c => c.id === updatedClientWithRegime.id ? updatedClientWithRegime : c));
        addClientHistoryLog(updatedClientWithRegime.id, 'Atualizado', `Regime Tributário atualizado para "${publicData.taxRegime}" via consulta automática.`);
        createRecurringObligations(updatedClientWithRegime);
      } catch (error) {
        console.error("Falha ao consultar CNPJ ou criar obrigações:", error);
        addClientHistoryLog(newClient.id, 'Atualizado', 'Falha na consulta automática de CNPJ. Regime tributário e obrigações precisam ser configurados manualmente.');
      }
    }
  };
  
  const handleUpdateClient = (updatedClient: Client) => {
    const oldClient = clients.find(c => c.id === updatedClient.id);
    if (!oldClient) return;
    const changes: string[] = [];
    if (oldClient.name !== updatedClient.name) changes.push(`Nome: de "${oldClient.name}" para "${updatedClient.name}".`);
    if (oldClient.cnpj !== updatedClient.cnpj) changes.push(`CPF/CNPJ: de "${oldClient.cnpj}" para "${updatedClient.cnpj}".`);
    if (oldClient.taxRegime !== updatedClient.taxRegime) changes.push(`Regime Tributário: de "${oldClient.taxRegime}" para "${updatedClient.taxRegime}".`);
    if (oldClient.city !== updatedClient.city) changes.push(`Município: de "${oldClient.city}" para "${updatedClient.city}".`);
    if (oldClient.isActive !== updatedClient.isActive) changes.push(`Status: de "${oldClient.isActive ? 'Ativo' : 'Inativo'}" para "${updatedClient.isActive ? 'Ativo' : 'Inativo'}".`);
    if ((oldClient.observations || '') !== (updatedClient.observations || '')) changes.push(`Observações foram atualizadas.`);
    if ((oldClient.phone || '') !== (updatedClient.phone || '')) changes.push(`Telefone foi atualizado.`);
    if (changes.length > 0) addClientHistoryLog(updatedClient.id, 'Atualizado', changes.join('\n'));
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };
  
  const handleDeleteClient = (clientId: number) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    if (clientToDelete) addClientHistoryLog(clientId, 'Excluído', `Cliente "${clientToDelete.name}" foi excluído.`);
    setClients(prev => prev.filter(c => c.id !== clientId));
  };
  
  // Task Handlers
  const handleAddTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask = { ...task, id: Date.now(), createdAt: new Date().toLocaleDateString('pt-BR')};
    setTasks(prev => [newTask, ...prev]);
  };
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  const handleDeleteTask = (taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Document Handlers ---
  const handleAddDocument = (docData: Omit<ClientDocument, 'id' | 'uploadedAt'>): Obligation | null => {
    const newDocument: ClientDocument = { ...docData, id: Date.now(), uploadedAt: new Date().toLocaleDateString('pt-BR') };
    setDocuments(prev => [newDocument, ...prev].sort((a,b) => b.competence.localeCompare(a.competence)));
    addClientHistoryLog(newDocument.clientId, 'Atualizado', `Documento "${newDocument.name}" foi adicionado.`);

    if (newDocument.type === DocumentType.GuiaImposto) {
        const docNameLower = newDocument.name.toLowerCase();
        const docCompetence = newDocument.competence;
        let obligationKeyword = '';
        if (docNameLower.includes('fgts')) obligationKeyword = 'fgts';
        else if (docNameLower.includes('inss') || docNameLower.includes('dctfweb')) obligationKeyword = 'dctfweb';
        else if (docNameLower.includes('pgdas')) obligationKeyword = 'pgdas';
        else if (docNameLower.includes('pis') || docNameLower.includes('cofins') || docNameLower.includes('efd')) obligationKeyword = 'efd contribuições';

        if (obligationKeyword) {
            const [year, month] = docCompetence.split('-').map(Number);
            const dueDateMonth = new Date(year, month, 1);
            const dueDatePrefix = `${dueDateMonth.getFullYear()}-${String(dueDateMonth.getMonth() + 1).padStart(2, '0')}`;
            const matchingObligation = obligations.find(ob =>
                ob.clientId === newDocument.clientId &&
                (ob.status === ObligationStatus.Pendente || ob.status === ObligationStatus.Vencido) &&
                ob.dueDate.startsWith(dueDatePrefix) &&
                ob.name.toLowerCase().includes(obligationKeyword)
            );
            if (matchingObligation) return matchingObligation;
        }
    }
    return null;
  };

  const handleAnalyzeDocument = async (documentId: number) => {
      const docToAnalyze = documents.find(d => d.id === documentId);
      if (!docToAnalyze || docToAnalyze.analisado) return;

      try {
          const analysisResult = await analyzeDocument(docToAnalyze);
          setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...analysisResult } : d));
          
          if(analysisResult.valor && analysisResult.dataVencimento) {
              const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analysisResult.valor);
              const formattedDate = new Date(analysisResult.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
              const taskDescription = `Realizar pagamento da guia "${docToAnalyze.name}" no valor de ${formattedValue} até ${formattedDate}.`;
              handleAddTask({
                  clientId: docToAnalyze.clientId,
                  description: taskDescription,
                  type: TaskType.Pagamento,
                  status: 'Pendente'
              });
              setToast({ message: 'Análise concluída e tarefa de pagamento criada!', type: 'success' });
          } else {
             setToast({ message: 'Análise concluída, mas dados para tarefa automática não encontrados.', type: 'success' });
          }
          addClientHistoryLog(docToAnalyze.clientId, 'Atualizado', `Documento "${docToAnalyze.name}" analisado por IA.`);

      } catch (error) {
          console.error("Erro ao analisar documento:", error);
          setToast({ message: 'Falha na análise do documento.', type: 'error' });
      }
  };


  const handleDeleteDocument = (documentId: number) => {
    const docToDelete = documents.find(d => d.id === documentId);
    if(docToDelete) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        addClientHistoryLog(docToDelete.clientId, 'Atualizado', `Documento "${docToDelete.name}" foi removido.`);
    }
  };

  // --- Automated WhatsApp Notifications ---
  const handleSendWhatsAppNotification = useCallback(async (
    item: Obligation | Task,
    client: Client
  ) => {
      if (!client.phone) {
        console.warn(`Tentativa de notificar cliente ${client.name} sem telefone.`);
        return;
      }

      try {
        const message = await generateWhatsAppMessage(item, client);
        const { success } = await sendWhatsAppMessage(client, message);

        if (success) {
            const todayStr = new Date().toLocaleDateString('pt-BR');
            if ('dueDate' in item) { // It's an Obligation
                setObligations(prev => prev.map(o => o.id === item.id ? { ...o, lastNotified: todayStr } : o));
            } else { // It's a Task
                setTasks(prev => prev.map(t => t.id === item.id ? { ...t, lastNotified: todayStr } : t));
            }
            setToast({ message: `Mensagem de WhatsApp enviada para ${client.name}`, type: 'success' });
        } else {
            throw new Error("Falha na simulação de envio.");
        }
      } catch (error) {
        console.error("Erro ao enviar notificação para", client.name, error);
        setToast({ message: `Falha ao notificar ${client.name}`, type: 'error' });
      }

  }, []);

  useEffect(() => {
    const checkAndSendNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toLocaleDateString('pt-BR');
        const notificationCutoff = new Date(today);
        notificationCutoff.setDate(today.getDate() + 3);

        // Check for obligations due soon
        obligations.forEach(ob => {
            const dueDate = new Date(new Date(ob.dueDate).getTime() + (new Date().getTimezoneOffset() * 60000));
            const client = clients.find(c => c.id === ob.clientId);
            if (
                client && client.phone &&
                ob.status === ObligationStatus.Pendente &&
                ob.lastNotified !== todayStr &&
                dueDate > today && dueDate <= notificationCutoff
            ) {
                handleSendWhatsAppNotification(ob, client);
            }
        });
        
        // Check for overdue tasks
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        tasks.forEach(task => {
            const [day, month, year] = task.createdAt.split('/').map(Number);
            const createdAt = new Date(year, month - 1, day);
            const client = clients.find(c => c.id === task.clientId);
             if (
                client && client.phone &&
                task.status === 'Pendente' &&
                task.lastNotified !== todayStr &&
                createdAt <= sevenDaysAgo
            ) {
                handleSendWhatsAppNotification(task, client);
            }
        });
    };

    // Simulate checking once when the app loads
    checkAndSendNotifications();
  }, [clients, obligations, tasks, handleSendWhatsAppNotification]);


  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard clients={clients} obligations={obligations} tasks={tasks} />;
      case 'clients':
        return <Clients 
            clients={clients} 
            clientHistory={clientHistory} 
            documents={documents}
            onAddClient={handleAddClient} 
            onUpdateClient={handleUpdateClient} 
            onDeleteClient={handleDeleteClient}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onUpdateObligation={handleUpdateObligation}
            onAnalyzeDocument={handleAnalyzeDocument}
        />;
      case 'obligations':
        return <Obligations clients={clients} obligations={obligations} onAddObligation={handleAddObligation} onUpdateObligation={handleUpdateObligation} onDeleteObligation={handleDeleteObligation} />;
      case 'tasks':
        return <Tasks clients={clients} tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />;
      case 'query':
        return <PublicQuery />;
      case 'certificates':
        return <Certificates />;
      case 'fiscal':
        return <FiscalSituation />;
      default:
        return <Dashboard clients={clients} obligations={obligations} tasks={tasks} />;
    }
  };

  return (
    <div className="flex h-screen bg-light">
      <Sidebar currentView={view} setView={setView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light p-6 relative">
          {renderView()}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
      </div>
    </div>
  );
};

export default App;