'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Eye, Edit, QrCode, RefreshCw, X, Calendar, DollarSign, MapPin, Tag, Wrench, ArrowRightLeft } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';
import Timeline from '../shared/Timeline';
import AssetRequestsTab from './AssetRequestsTab';

export default function AssetsTab({ user, assetsTriggerRefresh, refreshAssets, setActiveTab }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  
  // Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqCategoryId, setReqCategoryId] = useState('');
  const [reqJustification, setReqJustification] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBookable, setSelectedBookable] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Asset Details & History Modal state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Register Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState('New');
  const [location, setLocation] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [isBookable, setIsBookable] = useState(false);
  const [submittingRegister, setSubmittingRegister] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAssetId, setEditAssetId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editIsBookable, setEditIsBookable] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Query parameters
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedLocation) params.location = selectedLocation;
      if (selectedBookable) params.isBookable = selectedBookable;

      const res = await api.get('/assets', { params });
      setAssets(res.data.data.assets || []);
      
      // Check for pending requests for the badge
      const reqRes = await api.get('/asset-requests');
      const requestsArray = reqRes.data?.data || [];
      const pending = requestsArray.some(r => r.status && r.status.startsWith('pending'));
      setHasPendingRequests(pending);
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, [search, selectedCategory, selectedStatus, selectedLocation, selectedBookable, assetsTriggerRefresh]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Category is required');
      return;
    }

    try {
      setSubmittingRegister(true);
      await api.post('/assets', {
        name,
        categoryId: parseInt(categoryId),
        serialNumber,
        condition,
        location,
        acquisitionDate: acquisitionDate || undefined,
        acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
        isBookable
      });
      
      toast.success('Asset registered successfully');
      setIsRegisterModalOpen(false);
      // Reset fields
      setName('');
      setCategoryId('');
      setSerialNumber('');
      setCondition('New');
      setLocation('');
      setAcquisitionDate('');
      setAcquisitionCost('');
      setIsBookable(false);
      
      fetchAssets();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register asset');
    } finally {
      setSubmittingRegister(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEdit(true);
      await api.patch(`/assets/${editAssetId}`, {
        name: editName,
        condition: editCondition,
        location: editLocation,
        status: editStatus,
        isBookable: editIsBookable
      });

      toast.success('Asset updated successfully');
      setIsEditModalOpen(false);
      fetchAssets();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openAssetDetails = async (asset) => {
    setSelectedAsset(asset);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/assets/${asset.id}/history`);
      const { allocations = [], maintenance = [] } = res.data.data;
      
      // Combine and format timeline items
      const combinedTimeline = [
        ...allocations.map(a => ({
          id: `alloc-${a.id}`,
          action: `Asset Allocated to ${a.assignedToUser?.name || a.assignedToDept?.name || 'Department'}`,
          createdAt: a.allocationDate,
          timestamp: a.allocationDate,
          details: `Return expected by: ${a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : 'No date specified'}. Return Status: ${a.status}. Condition notes: ${a.returnConditionNotes || 'None'}`
        })),
        ...maintenance.map(m => ({
          id: `maint-${m.id}`,
          action: `Maintenance Ticket Raised (${m.priority} priority)`,
          createdAt: m.createdAt,
          timestamp: m.createdAt,
          details: `Issue: ${m.description}. Status: ${m.status}. Technician: ${m.technicianName || 'Not assigned'}. Resolution notes: ${m.resolutionNotes || 'None'}`
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAssetHistory(combinedTimeline);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load asset lifecycle history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEditModal = (asset) => {
    setEditAssetId(asset.id);
    setEditName(asset.name);
    setEditCondition(asset.condition || 'New');
    setEditLocation(asset.location || '');
    setEditStatus(asset.status);
    setEditIsBookable(asset.isBookable);
    setIsEditModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqCategoryId || !reqJustification) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmittingRequest(true);
      await api.post('/asset-requests', {
        categoryId: parseInt(reqCategoryId),
        justification: reqJustification
      });
      toast.success('Asset requested successfully');
      setIsRequestModalOpen(false);
      setReqCategoryId('');
      setReqJustification('');
      // Refresh pending badge
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const isManager = ['admin', 'asset_manager'].includes(user?.role);

  // DataTable columns
  const columns = [
    {
      key: 'assetTag',
      label: 'Tag',
      sortable: true,
      render: (row) => <AssetTagChip tag={row.assetTag} />
    },
    {
      key: 'name',
      label: 'Asset Name',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink">{row.name}</span>
          <span className="text-xs text-steel/60 font-mono">SN: {row.serialNumber || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => <span className="font-medium text-steel">{row.category?.name}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge domain="asset" status={row.status} />
    },
    {
      key: 'condition',
      label: 'Condition',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface border border-hairline text-ink">
          {row.condition || 'New'}
        </span>
      )
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (row) => <span className="text-steel">{row.location || '—'}</span>
    },
    {
      key: 'isBookable',
      label: 'Bookable',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-bold ${row.isBookable ? 'text-status-available' : 'text-steel/50'}`}>
          {row.isBookable ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => openAssetDetails(row)}
            icon={Eye}
            className="!p-1.5 !px-1.5"
            title="View Details"
          />
          {isManager && (
            <Button 
              variant="ghost" 
              onClick={() => openEditModal(row)}
              icon={Edit}
              className="!p-1.5 !px-1.5 hover:!text-accent"
              title="Edit Asset"
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Asset Directory</h2>
          <p className="mt-1 text-sm text-steel">
            Complete list of all software and hardware resources tracked within AssetFlow.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchAssets()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => setActiveTab('asset-requests')}
            className="relative"
          >
            {['admin', 'asset_manager'].includes(user?.role) ? 'Issue Requests' : 'View Requests'}
            {hasPendingRequests && (
              <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-status-lost ring-2 ring-white" />
            )}
          </Button>
          {['employee', 'department_head'].includes(user?.role) && (
            <Button
              variant="primary"
              onClick={() => setIsRequestModalOpen(true)}
              icon={Plus}
            >
              Request New Asset
            </Button>
          )}
          {isManager && (
            <Button
              variant="primary"
              onClick={() => setIsRegisterModalOpen(true)}
              icon={Plus}
            >
              Register Asset
            </Button>
          )}
        </div>
      </div>


          {/* Toolbar / Filters */}
      <div className="flex flex-col gap-4 p-4 bg-white border border-hairline rounded-lg shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search assets by name, tag or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          <Button 
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            icon={Filter}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-hairline animate-in fade-in duration-200">
            <FormField
              label="Category"
              id="filter-category"
              type="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </FormField>

            <FormField
              label="Status"
              id="filter-status"
              type="select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="reserved">Reserved</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="lost">Lost</option>
              <option value="retired">Retired</option>
              <option value="disposed">Disposed</option>
            </FormField>

            <FormField
              label="Location"
              id="filter-location"
              type="select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="HQ">HQ</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Remote">Remote</option>
            </FormField>

            <FormField
              label="Bookable Only"
              id="filter-bookable"
              type="select"
              value={selectedBookable}
              onChange={(e) => setSelectedBookable(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="true">Bookable Only</option>
              <option value="false">Non-Bookable Only</option>
            </FormField>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={assets}
        loading={loading}
        emptyTitle="No assets registered"
        emptyDescription={isManager ? "Let's register your organization's first asset now." : "No assets fit your current filters."}
        emptyActionLabel={isManager ? "Register First Asset" : null}
        emptyOnAction={isManager ? () => setIsRegisterModalOpen(true) : null}
        emptyActionIcon={Plus}
      />

      {/* Register Asset Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Asset"
      >
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset Name"
            id="reg-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MacBook Pro M3, Conference Room TV"
          />

          <FormField
            label="Category"
            id="reg-category"
            type="select"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select Category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Serial Number"
              id="reg-serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. C02X87HG..."
            />
            <FormField
              label="Condition"
              id="reg-condition"
              type="select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Location"
              id="reg-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. HQ, Warehouse A"
            />
            <FormField
              label="Acquisition Cost"
              id="reg-cost"
              type="number"
              step="0.01"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="e.g. 1999.99"
            />
          </div>

          <FormField
            label="Acquisition Date"
            id="reg-date"
            type="date"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              id="reg-bookable"
              type="checkbox"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
              className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
            />
            <label htmlFor="reg-bookable" className="text-xs font-semibold uppercase tracking-wider text-steel select-none cursor-pointer">
              Is this asset bookable? (e.g. conference room, pool car)
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingRegister}>Register Asset</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Asset Details"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset Name"
            id="edit-name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Condition"
              id="edit-condition"
              type="select"
              value={editCondition}
              onChange={(e) => setEditCondition(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </FormField>
            
            <FormField
              label="Status"
              id="edit-status"
              type="select"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="reserved">Reserved</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="lost">Lost</option>
              <option value="retired">Retired</option>
              <option value="disposed">Disposed</option>
            </FormField>
          </div>

          <FormField
            label="Location"
            id="edit-location"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              id="edit-bookable"
              type="checkbox"
              checked={editIsBookable}
              onChange={(e) => setEditIsBookable(e.target.checked)}
              className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
            />
            <label htmlFor="edit-bookable" className="text-xs font-semibold uppercase tracking-wider text-steel select-none cursor-pointer">
              Is this asset bookable?
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingEdit}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Asset Details & Timeline Modal */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={() => {
          setSelectedAsset(null);
          setAssetHistory(null);
        }}
        size="lg"
        title="Asset Profile & History"
      >
        {selectedAsset && (
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface border border-hairline rounded-lg">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AssetTagChip tag={selectedAsset.assetTag} />
                  <StatusBadge domain="asset" status={selectedAsset.status} />
                </div>
                <h3 className="text-lg font-bold text-ink leading-tight">{selectedAsset.name}</h3>
                <span className="text-xs text-steel">Category: <span className="font-semibold text-ink">{selectedAsset.category?.name}</span></span>
              </div>
              
              {/* QR Code Graphic Mock */}
              <div className="flex items-center gap-3 p-3 bg-white border border-hairline rounded shadow-sm self-start sm:self-auto">
                <QrCode className="w-10 h-10 text-ink" />
                <div className="flex flex-col font-mono text-[9px] text-steel">
                  <span>SYSTEM QR</span>
                  <span className="font-bold text-ink">{selectedAsset.assetTag}</span>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-hairline rounded flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-steel flex items-center gap-1">
                  <Tag className="w-3 h-3 text-accent" /> Serial Number
                </span>
                <span className="text-sm font-semibold text-ink font-mono">{selectedAsset.serialNumber || 'None'}</span>
              </div>
              <div className="p-4 border border-hairline rounded flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-steel flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent" /> Current Location
                </span>
                <span className="text-sm font-semibold text-ink">{selectedAsset.location || 'HQ'}</span>
              </div>
              <div className="p-4 border border-hairline rounded flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-steel flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-accent" /> Acquisition Cost
                </span>
                <span className="text-sm font-semibold text-ink font-mono">
                  {selectedAsset.acquisitionCost ? `$${parseFloat(selectedAsset.acquisitionCost).toLocaleString()}` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2">
                Lifecycle History & Logs
              </h4>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-sm text-steel">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Loading timeline...</span>
                </div>
              ) : (
                <Timeline items={assetHistory} />
              )}
            </div>

            <div className="flex justify-end border-t border-hairline pt-4">
              <Button 
                variant="secondary"
                onClick={() => {
                  setSelectedAsset(null);
                  setAssetHistory(null);
                }}
              >
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {/* Request New Asset Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setReqCategoryId('');
          setReqJustification('');
        }}
        title="Request New Asset"
      >
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset Category"
            id="req-category"
            type="select"
            required
            value={reqCategoryId}
            onChange={(e) => setReqCategoryId(e.target.value)}
          >
            <option value="">Select Category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </FormField>

          <FormField
            label="Justification"
            id="req-justification"
            type="textarea"
            required
            placeholder="Why do you need this asset?"
            value={reqJustification}
            onChange={(e) => setReqJustification(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingRequest}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
