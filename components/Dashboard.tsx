import React, { useMemo } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import WeeklyCalendar from './WeeklyCalendar'; // Import the new component
import { ObligationStatus, type Client, type Obligation, type Task } from '../types';

interface DashboardProps {
  clients: Client[];
  obligations: Obligation[];
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, obligations, tasks }) => {
  const activeClients = useMemo(() => clients.filter(c => c.isActive).length, [clients]);
  const pendingObligations = useMemo(() => obligations.filter(o => o.status === ObligationStatus.Pendente).length, [obligations]);
  const overdueObligations = useMemo(() => obligations.filter(o => o.status === ObligationStatus.Vencido).length, [obligations]);
  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'Pendente').length, [tasks]);

  const upcomingObligations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return obligations
      .filter(o => o.status === ObligationStatus.Pendente || o.status === ObligationStatus.EmAndamento)
      .filter(o => new Date(o.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [obligations]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('pt-BR');
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clientes Ativos" value={activeClients.toString()} icon={<UsersIcon />} />
        <StatCard title="Obrigações Pendentes" value={pendingObligations.toString()} icon={<ClipboardListIcon />} />
        <StatCard title="Vencidas este Mês" value={overdueObligations.toString()} icon={<ExclamationIcon />} color="text-red-500" />
        <StatCard title="Tarefas Pendentes" value={pendingTasks.toString()} icon={<BellIcon />} color="text-yellow-500" />
      </div>

      {/* Weekly Calendar Added Here */}
      <div className="mt-8">
        <WeeklyCalendar obligations={obligations} clients={clients} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-semibold text-primary mb-4">Próximos Vencimentos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm font-semibold text-gray-600 border-b">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Obrigação</th>
                  <th className="py-2">Vencimento</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingObligations.map(ob => {
                  const client = clients.find(c => c.id === ob.clientId);
                  return (
                    <tr key={ob.id} className="border-b text-sm text-gray-700">
                      <td className="py-3">{client?.name || 'Cliente não encontrado'}</td>
                      <td className="py-3">{ob.name}</td>
                      <td className="py-3">{formatDate(ob.dueDate)}</td>
                      <td className="py-3"><Badge status={ob.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-xl font-semibold text-primary mb-4">Tarefas Pendentes Recentes</h3>
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm font-semibold text-gray-600 border-b">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === 'Pendente').slice(0, 5).map(task => {
                  const client = clients.find(c => c.id === task.clientId);
                  return (
                    <tr key={task.id} className="border-b text-sm text-gray-700">
                      <td className="py-3">{client?.name || 'Cliente não encontrado'}</td>
                      <td className="py-3">{task.description}</td>
                      <td className="py-3"><Badge status={task.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "text-secondary" }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-full bg-light ${color}`}>
            {icon}
        </div>
        <div className="mx-5">
            <h4 className="text-2xl font-semibold text-gray-700">{value}</h4>
            <div className="text-gray-500">{title}</div>
        </div>
    </Card>
);

const UsersIcon = () => <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.923"></path></svg>;
const ClipboardListIcon = () => <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>;
const ExclamationIcon = () => <svg className="w-6 h-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
const BellIcon = () => <svg className="w-6 h-6 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>;

export default Dashboard;