'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Calendar, Plus, X, AlertCircle, Clock, Info } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function BookingsTab({ user }) {
  const [bookings, setBookings] = useState([]);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  
  // Book Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookAssetId, setBookAssetId] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [submittingBook, setSubmittingBook] = useState(false);

  const fetchBookingsData = async () => {
    try {
      setLoading(true);
      // Fetch bookings
      const params = {};
      if (selectedAssetId) params.assetId = selectedAssetId;
      const res = await api.get('/bookings', { params });
      setBookings(res.data.data.bookings || []);

      // Fetch assets and filter for bookable ones
      const assetsRes = await api.get('/assets', { params: { isBookable: 'true' } });
      setBookableAssets(assetsRes.data.data.assets || []);
    } catch (err) {
      toast.error('Failed to load bookings database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsData();
  }, [selectedAssetId]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookAssetId) {
      toast.error('Please select a resource');
      return;
    }

    const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${endDateStr}T${endTimeStr}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error('Please specify valid start and end dates/times');
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error('End time must be strictly after start time');
      return;
    }

    try {
      setSubmittingBook(true);
      await api.post('/bookings', {
        assetId: parseInt(bookAssetId),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      });
      toast.success('Resource booked successfully');
      setIsBookModalOpen(false);
      // Reset
      setBookAssetId('');
      setStartDateStr('');
      setStartTimeStr('');
      setEndDateStr('');
      setEndTimeStr('');
      fetchBookingsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conflict detected. Please choose another time slot.');
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleCancelBooking = async (id) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmCancel) return;

    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookingsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Build a nice TimeSlotGrid for the selected asset
  const getAssetBookingsForToday = () => {
    if (!selectedAssetId) return [];
    return bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing');
  };

  const activeAssetBookings = getAssetBookingsForToday();

  const columns = [
    {
      key: 'asset',
      label: 'Resource / Space',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <AssetTagChip tag={row.asset.assetTag} />
          <div className="flex flex-col">
            <span className="font-semibold text-ink">{row.asset.name}</span>
            <span className="text-xs text-steel/60">Location: {row.asset.location || 'HQ'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Booked By',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink">{row.user.name}</span>
          <span className="text-xs text-steel/60">{row.user.email}</span>
        </div>
      )
    },
    {
      key: 'startTime',
      label: 'Start Time',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-steel">
          {new Date(row.startTime).toLocaleString()}
        </span>
      )
    },
    {
      key: 'endTime',
      label: 'End Time',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-steel">
          {new Date(row.endTime).toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge domain="booking" status={row.status} />
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const canCancel = row.status === 'upcoming' && (row.userId === user.id || ['admin', 'asset_manager'].includes(user.role));
        if (canCancel) {
          return (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => handleCancelBooking(row.id)}
                icon={X}
                className="!p-1.5 !px-3 hover:!bg-status-lost/10 hover:!text-status-lost text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Resource Bookings</h2>
          <p className="mt-1 text-sm text-steel">
            Reserve company pool vehicles, key cards, rooms, or other shared resources.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchBookingsData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsBookModalOpen(true)}
            icon={Plus}
          >
            Book Resource
          </Button>
        </div>
      </div>

      {/* Toolbar / Select Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 p-4 bg-white border border-hairline rounded-lg shadow-sm">
          <FormField
            label="Filter schedule by resource"
            id="book-filter-select"
            type="select"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          >
            <option value="">All Shared Resources</option>
            {bookableAssets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag}) — {asset.location || 'HQ'}
              </option>
            ))}
          </FormField>
        </div>

        {selectedAssetId && (
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg flex flex-col gap-2">
            <span className="text-xs uppercase font-bold text-steel flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-accent" /> Schedule Info
            </span>
            <p className="text-xs text-steel">
              Showing active bookings for the selected resource. Adjacent slots are allowed, overlaps will conflict.
            </p>
          </div>
        )}
      </div>

      {/* Time Slot Grid View (Visible if asset selected) */}
      {selectedAssetId && activeAssetBookings.length > 0 && (
        <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-steel flex items-center gap-1">
            <Clock className="w-4 h-4 text-accent" /> Active Time Slots for Chosen Asset
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeAssetBookings.map((b) => (
              <div key={b.id} className="p-4 border border-hairline rounded bg-surface flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink">{b.user.name}</span>
                  <StatusBadge domain="booking" status={b.status} />
                </div>
                <p className="text-xs text-steel font-mono mt-1">
                  Start: {new Date(b.startTime).toLocaleString()}
                </p>
                <p className="text-xs text-steel font-mono">
                  End: {new Date(b.endTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        emptyTitle="No bookings found"
        emptyDescription="There are no active or historical bookings logged for this selection."
        emptyActionLabel="Book First Resource"
        emptyOnAction={() => setIsBookModalOpen(true)}
        emptyActionIcon={Plus}
      />

      {/* Book Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Shared Resource"
      >
        <form onSubmit={handleBookSubmit} className="flex flex-col gap-4">
          <FormField
            label="Resource / Space"
            id="book-asset-select"
            type="select"
            required
            value={bookAssetId}
            onChange={(e) => setBookAssetId(e.target.value)}
          >
            <option value="">Select Resource...</option>
            {bookableAssets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag}) — Location: {asset.location || 'HQ'}
              </option>
            ))}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-hairline pt-4">
            <FormField
              label="Start Date"
              id="book-start-date"
              type="date"
              required
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
            />
            <FormField
              label="Start Time"
              id="book-start-time"
              type="time"
              required
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="End Date"
              id="book-end-date"
              type="date"
              required
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
            />
            <FormField
              label="End Time"
              id="book-end-time"
              type="time"
              required
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingBook}>Confirm Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
