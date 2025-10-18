import React, { useMemo } from 'react';
import Card from './ui/Card';
import { type Client, type Obligation } from '../types';

interface WeeklyCalendarProps {
  clients: Client[];
  obligations: Obligation[];
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ clients, obligations }) => {
  const { weekDates, todayString } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    const weekDates: Date[] = [];
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Start week on Sunday

    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(day.getDate() + i);
      weekDates.push(day);
    }
    return { weekDates, todayString };
  }, []);

  const obligationsByDate = useMemo(() => {
    const map = new Map<string, Obligation[]>();
    obligations.forEach(ob => {
      const dateKey = ob.dueDate; // Key is 'YYYY-MM-DD'
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(ob);
    });
    return map;
  }, [obligations]);

  const formatDateToKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <h3 className="text-xl font-semibold text-primary mb-4">Calendário da Semana</h3>
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dateKey = formatDateToKey(date);
          const isToday = dateKey === todayString;
          const dayObligations = obligationsByDate.get(dateKey) || [];

          return (
            <div key={index} className="bg-extralight rounded-lg p-2 flex flex-col min-h-[120px]">
              <div className="text-center mb-2">
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </p>
                <p className={`font-bold text-lg ${isToday ? 'bg-secondary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-primary'}`}>
                  {date.getDate()}
                </p>
              </div>
              <div className="space-y-1 overflow-y-auto">
                {dayObligations.map(ob => {
                  const client = clients.find(c => c.id === ob.clientId);
                  return (
                    <div key={ob.id} className="bg-white p-1.5 rounded-md text-xs border-l-4 border-accent shadow-sm">
                      <p className="font-bold text-primary truncate" title={client?.name}>{client?.name || 'N/A'}</p>
                      <p className="text-gray-600 truncate" title={ob.name}>{ob.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WeeklyCalendar;