'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Calendar from '@/components/shared/Calendar';
import Button from '@/components/shared/Button';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import StatusBadge from '@/components/shared/StatusBadge';
import DataTable from '@/components/shared/DataTable';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { CalendarDays, Plus, Clock } from 'lucide-react';

function BookingsContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    assetId: '',
    startTime: '',
    endTime: '',
  });

  const loadBookingsData = async () => {
    try {
      // Bookable assets are those with isBookable true
      const assetsList = await api.get('/assets');
      const bookable = assetsList.filter(a => a.isBookable);
      // Give them capacity if missing
      const resourcesList = bookable.map(a => ({
        id: a.id,
        name: a.name,
        capacity: a.category?.metadataSchema?.capacity || 10
      }));
      setResources(resourcesList);

      const bookingsList = await api.get('/bookings');
      setBookings(bookingsList);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookingsData();
    }
  }, [user]);

  // Handle clicking slot in calendar
  const handleSlotSelect = (resource, hour) => {
    const startStr = new Date(selectedDate);
    startStr.setHours(hour, 0, 0, 0);
    const endStr = new Date(selectedDate);
    endStr.setHours(hour + 1, 0, 0, 0);

    // Format to datetime-local format 'YYYY-MM-DDTHH:MM'
    const formatDT = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${date}T${hours}:${mins}`;
    };

    setNewBooking({
      assetId: resource.id.toString(),
      startTime: formatDT(startStr),
      endTime: formatDT(endStr),
    });
    setIsBookModalOpen(true);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    // Verification check: validate overlap client-side for immediate user feedback
    const start = new Date(newBooking.startTime);
    const end = new Date(newBooking.endTime);

    if (start >= end) {
      showToast('Start time must precede end time.', 'warning');
      return;
    }

    const overlap = bookings.find((b) => {
      if (b.assetId !== parseInt(newBooking.assetId)) return false;
      if (b.status === 'cancelled') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      // Overlap: true overlap. Adjacent meetings (e.g. 10:00-11:00 and 11:00-12:00) do NOT overlap.
      return start < bEnd && end > bStart;
    });

    if (overlap) {
      showToast('Overlapping reservations. The selected time slot is already reserved.', 'error');
      return;
    }

    try {
      await api.post('/bookings', {
        assetId: parseInt(newBooking.assetId),
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
      showToast('Room/Resource booked successfully!', 'success');
      setIsBookModalOpen(false);
      loadBookingsData();
    } catch (err) {
      showToast(err.message || 'Booking reservation failed', 'error');
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}/cancel`, {});
      showToast('Booking cancelled.', 'success');
      loadBookingsData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  // Active bookings list
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  const bookingColumns = [
    { key: 'resource', label: 'Resource / Room', render: (_, row) => row.asset?.name },
    { key: 'user', label: 'Reserved By', render: (_, row) => row.user?.name || row.bookedBy },
    { key: 'startTime', label: 'Start Time', render: (val) => new Date(val).toLocaleString() },
    { key: 'endTime', label: 'End Time', render: (val) => new Date(val).toLocaleString() },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="booking" status={val} /> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">SHARED RESOURCE BOOKING</h1>
            <p className="text-steel text-sm mt-1">Book shared conference rooms, workspaces, testing devices, or fleet vehicles.</p>
          </div>
          <Button variant="primary" onClick={() => {
            setNewBooking({ assetId: '', startTime: '', endTime: '' });
            setIsBookModalOpen(true);
          }} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Book Room / Resource
          </Button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-4 bg-surface-raised border border-hairline p-4 rounded-[10px] shadow-xs">
          <Clock className="w-5 h-5 text-steel" />
          <FormField
            type="date"
            name="selectedDate"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="!mb-0"
          />
          <span className="text-xs text-steel font-mono">
            Displaying schedules for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Interactive Calendar grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-accent" /> Hourly Reservation Grid
          </h2>
          <Calendar
            resources={resources}
            bookings={bookings}
            selectedDate={selectedDate}
            onSlotSelect={handleSlotSelect}
          />
        </div>

        {/* Current reservations table */}
        <div className="border-t border-hairline pt-6 flex flex-col gap-4">
          <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider">
            All Current Active Bookings
          </h2>
          <DataTable
            columns={bookingColumns}
            data={activeBookings}
            rowActions={[
              {
                label: 'Cancel Reservation',
                onClick: (row) => handleCancelBooking(row.id),
                disabled: (row) => row.status === 'completed' || row.status === 'cancelled'
              }
            ]}
          />
        </div>

        {/* Modal: Book Room / Resource */}
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title="Create Resource Booking"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="book-form">Confirm Booking</Button>
            </>
          }
        >
          <form id="book-form" onSubmit={handleCreateBooking} className="space-y-4">
            <FormField
              label="Select Resource"
              type="select"
              required
              placeholder="Choose room or bookable device"
              value={newBooking.assetId}
              onChange={(e) => setNewBooking({ ...newBooking, assetId: e.target.value })}
              options={resources.map(r => ({ value: r.id, label: r.name }))}
            />

            <FormField
              label="Reservation Start Time"
              type="datetime-local"
              required
              value={newBooking.startTime}
              onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
            />

            <FormField
              label="Reservation End Time"
              type="datetime-local"
              required
              value={newBooking.endTime}
              onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
              helperText="Adjacent reservations are allowed (e.g. 10:00 and 11:00). Direct time overlaps will be blocked."
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function BookingsPage() {
  return (
    <ToastProvider>
      <BookingsContent />
    </ToastProvider>
  );
}
