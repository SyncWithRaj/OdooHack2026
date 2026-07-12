import React from 'react';
import { Calendar, Hammer, Repeat, Trash2, ShieldAlert } from 'lucide-react';

export default function Timeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-steel">
        No history records found for this asset.
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'allocation':
      case 'allocate':
      case 'return':
        return <Calendar className="w-4 h-4 text-status-allocated" />;
      case 'maintenance':
      case 'repair':
        return <Hammer className="w-4 h-4 text-status-maintenance" />;
      case 'transfer':
        return <Repeat className="w-4 h-4 text-status-reserved" />;
      case 'audit':
        return <ShieldAlert className="w-4 h-4 text-status-lost" />;
      case 'dispose':
      case 'retire':
        return <Trash2 className="w-4 h-4 text-status-disposed" />;
      default:
        return <Calendar className="w-4 h-4 text-steel" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-hairline"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-surface border border-hairline flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-ink font-medium">
                        {event.title}{' '}
                        {event.description && (
                          <span className="text-steel font-normal text-xs block mt-0.5">
                            {event.description}
                          </span>
                        )}
                      </p>
                      {event.actor && (
                        <p className="text-xs text-steel font-mono mt-1">
                          By: {event.actor}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs font-mono text-steel whitespace-nowrap pt-0.5">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
