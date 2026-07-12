import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Package, CalendarCheck, Wrench } from 'lucide-react';

export default function DashboardCalendar({ allocations, bookings, maintenance, onEventClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Get padding days for the first row of the calendar
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const paddingDays = Array.from({ length: firstDayOfMonth }).map((_, i) => i);

  // Group events by date
  const getEventsForDate = (date) => {
    const events = [];

    allocations?.forEach(a => {
      if (a.expectedReturnDate && isSameDay(new Date(a.expectedReturnDate), date)) {
        events.push({
          id: `alloc-${a.id}`,
          type: 'allocation',
          title: `Return: ${a.asset?.name}`,
          icon: Package,
          color: 'bg-status-lost/20 text-status-lost border-status-lost/30',
          data: a,
          action: 'allocations'
        });
      }
    });

    bookings?.forEach(b => {
      if (b.startTime && isSameDay(new Date(b.startTime), date)) {
        events.push({
          id: `book-${b.id}`,
          type: 'booking',
          title: `Book: ${b.asset?.name}`,
          icon: CalendarCheck,
          color: 'bg-accent/20 text-accent-ink border-accent/30',
          data: b,
          action: 'bookings'
        });
      }
    });

    maintenance?.forEach(m => {
      if (m.createdAt && isSameDay(new Date(m.createdAt), date)) {
        events.push({
          id: `maint-${m.id}`,
          type: 'maintenance',
          title: `Fix: ${m.asset?.name}`,
          icon: Wrench,
          color: 'bg-status-maintenance/20 text-status-maintenance border-status-maintenance/30',
          data: m,
          action: 'maintenance'
        });
      }
    });

    return events;
  };

  return (
    <div className="bg-white border border-hairline rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-hairline bg-surface">
        <h3 className="text-lg font-bold font-display uppercase tracking-wider text-ink">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded border border-transparent hover:border-hairline transition-all">
            <ChevronLeft className="w-5 h-5 text-steel" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-xs font-bold uppercase hover:bg-white rounded border border-transparent hover:border-hairline transition-all text-steel">
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded border border-transparent hover:border-hairline transition-all">
            <ChevronRight className="w-5 h-5 text-steel" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-hairline bg-surface/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-steel border-r border-hairline last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {paddingDays.map(p => (
            <div key={`pad-${p}`} className="bg-surface/30 border-r border-b border-hairline last:border-r-0" />
          ))}
          
          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            const events = getEventsForDate(day);
            
            return (
              <div key={day.toString()} className={`min-h-[100px] border-r border-b border-hairline last:border-r-0 p-1 flex flex-col gap-1 transition-colors hover:bg-surface/50 ${isToday ? 'bg-accent/5' : 'bg-white'}`}>
                <div className="flex justify-between items-center px-1">
                  <span className={`text-xs font-bold ${isToday ? 'bg-accent text-accent-ink w-6 h-6 rounded-full flex items-center justify-center' : 'text-steel'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                  {events.map(event => {
                    const Icon = event.icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event.action)}
                        title={event.title}
                        className={`flex items-center gap-1.5 w-full text-left p-1 rounded border text-[10px] font-semibold truncate transition-transform hover:scale-[1.02] ${event.color}`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
