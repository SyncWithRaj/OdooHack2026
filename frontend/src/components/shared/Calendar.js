import React from 'react';

export default function Calendar({
  resources = [],
  bookings = [],
  selectedDate = new Date(),
  onSlotSelect,
}) {
  // Generate hours from 08:00 to 18:00
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
  };

  const getBookingsForResourceAndHour = (resourceId, hour) => {
    return bookings.filter((b) => {
      if (b.assetId !== resourceId && b.resourceId !== resourceId) return false;
      if (b.status === 'cancelled' || b.status === 'Cancelled') return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);

      const targetStart = new Date(selectedDate);
      targetStart.setHours(hour, 0, 0, 0);
      const targetEnd = new Date(selectedDate);
      targetEnd.setHours(hour + 1, 0, 0, 0);

      // Overlap check
      return start < targetEnd && end > targetStart;
    });
  };

  return (
    <div className="border border-hairline rounded-[10px] bg-surface-raised shadow-sm overflow-hidden flex flex-col">
      {/* Grid Header */}
      <div className="grid grid-cols-12 bg-surface border-b border-hairline font-semibold text-xs text-steel uppercase tracking-wider">
        <div className="col-span-2 p-4 border-r border-hairline">Time</div>
        {resources.map((res) => (
          <div
            key={res.id}
            className="col-span-3 p-4 text-center border-r border-hairline last:border-r-0 font-display text-ink"
          >
            {res.name}
            <span className="block text-[10px] font-mono text-steel mt-0.5">
              Cap: {res.capacity || 'N/A'}
            </span>
          </div>
        ))}
        {resources.length === 0 && (
          <div className="col-span-10 p-4 text-center text-steel italic">
            No bookable resources registered.
          </div>
        )}
      </div>

      {/* Grid Hours */}
      <div className="flex flex-col divide-y divide-hairline">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-12 min-h-[64px]">
            {/* Time label */}
            <div className="col-span-2 p-3 bg-surface border-r border-hairline flex flex-col justify-between text-xs font-mono text-steel select-none">
              <span>{formatHour(hour)}</span>
              <span className="text-[10px] opacity-50">{formatHour(hour + 1)}</span>
            </div>

            {/* Resource booking columns */}
            {resources.map((res) => {
              const slots = getBookingsForResourceAndHour(res.id, hour);
              const isBooked = slots.length > 0;
              const hasConflict = slots.length > 1;

              return (
                <div
                  key={res.id}
                  onClick={() => !isBooked && onSlotSelect && onSlotSelect(res, hour)}
                  className={`col-span-3 p-2 border-r border-hairline last:border-r-0 relative flex flex-col justify-center transition-colors ${
                    isBooked
                      ? 'bg-status-allocated/5 cursor-not-allowed'
                      : 'hover:bg-accent/5 cursor-pointer'
                  }`}
                >
                  {isBooked ? (
                    slots.map((b) => (
                      <div
                        key={b.id}
                        className={`text-xs p-1.5 rounded-[4px] border font-medium ${
                          hasConflict
                            ? 'bg-status-lost/10 border-status-lost text-status-lost'
                            : 'bg-status-allocated/10 border-status-allocated text-status-allocated'
                        }`}
                        title={
                          hasConflict
                            ? 'Booking Conflict Detected!'
                            : `Booked by: ${b.user?.name || b.bookedBy || 'Employee'}`
                        }
                      >
                        <div className="font-semibold truncate">
                          {hasConflict ? 'CONFLICT' : b.user?.name || b.bookedBy || 'Booked'}
                        </div>
                        <div className="text-[9px] font-mono opacity-80">
                          {new Date(b.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(b.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-steel opacity-0 hover:opacity-100 font-mono text-center">
                      + Select Slot
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
