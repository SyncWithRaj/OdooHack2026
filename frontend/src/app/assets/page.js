'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import SearchBar from '@/components/shared/SearchBar';
import DataTable from '@/components/shared/DataTable';
import AssetTagChip from '@/components/shared/AssetTagChip';
import StatusBadge from '@/components/shared/StatusBadge';
import Timeline from '@/components/shared/Timeline';
import Button from '@/components/shared/Button';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { Plus, QrCode, FileText, Calendar, MapPin, DollarSign, PenTool, LayoutGrid } from 'lucide-react';

function AssetDirectoryContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Registration Modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', categoryId: '', serialNumber: '', condition: 'New', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false
  });

  const loadAssetsData = async () => {
    try {
      const assetList = await api.get('/assets');
      setAssets(assetList);
      
      const catList = await api.get('/categories');
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load asset directory:', err);
    }
  };

  const loadTimeline = async (assetId) => {
    try {
      const history = await api.get(`/assets/${assetId}/history`);
      setTimelineEvents(history);
    } catch (err) {
      console.error('Failed to load asset history:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadAssetsData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAsset) {
      loadTimeline(selectedAsset.id);
    }
  }, [selectedAsset]);

  const handleAssetSelect = (row) => {
    setSelectedAsset(row);
  };

  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    try {
      const saved = await api.post('/assets', formData);
      showToast(`Asset registered successfully as ${saved.assetTag}!`, 'success');
      setIsRegModalOpen(false);
      setFormData({
        name: '', categoryId: '', serialNumber: '', condition: 'New', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false
      });
      loadAssetsData();
    } catch (err) {
      showToast(err.message || 'Failed to register asset', 'error');
    }
  };

  const handleEditAsset = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/assets/${selectedAsset.id}`, formData);
      showToast(`Asset details updated!`, 'success');
      setIsEditModalOpen(false);
      loadAssetsData();
      
      // Refresh current details panel
      const updatedList = await api.get('/assets');
      const updated = updatedList.find(a => a.id === selectedAsset.id);
      setSelectedAsset(updated);
    } catch (err) {
      showToast(err.message || 'Failed to update asset', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  // Filter Assets matching search and chips
  const filteredAssets = assets.filter((asset) => {
    // 1. Text Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = asset.name?.toLowerCase().includes(query);
      const matchTag = asset.assetTag?.toLowerCase().includes(query);
      const matchSerial = asset.serialNumber?.toLowerCase().includes(query);
      const matchLoc = asset.location?.toLowerCase().includes(query);
      if (!matchName && !matchTag && !matchSerial && !matchLoc) return false;
    }

    // 2. Chip Filters
    if (activeFilters.category && asset.categoryId !== parseInt(activeFilters.category)) return false;
    if (activeFilters.status && asset.status !== activeFilters.status) return false;
    if (activeFilters.condition && asset.condition !== activeFilters.condition) return false;

    return true;
  });

  const columns = [
    { key: 'tag', label: 'Tag Code', render: (_, row) => <AssetTagChip tag={row.assetTag} /> },
    { key: 'name', label: 'Asset Name', sortable: true },
    { key: 'category', label: 'Category', render: (_, row) => row.category?.name || 'Unknown' },
    { key: 'location', label: 'Location' },
    { key: 'condition', label: 'Condition' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="asset" status={val} /> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">ASSET DIRECTORY</h1>
            <p className="text-steel text-sm mt-1">Register hardware, rooms, machinery, and track visual lifecycles.</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'asset_manager') && (
            <Button variant="primary" onClick={() => setIsRegModalOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Register Asset
            </Button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-surface-raised border border-hairline rounded-[10px] shadow-xs">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by tag, name, serial number, or physical site location..."
            filters={[
              {
                key: 'category',
                label: 'Category',
                options: categories.map(c => ({ value: c.id.toString(), label: c.name }))
              },
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'available', label: 'Available' },
                  { value: 'allocated', label: 'Allocated' },
                  { value: 'under_maintenance', label: 'Maintenance' },
                ]
              },
              {
                key: 'condition',
                label: 'Condition',
                options: [
                  { value: 'New', label: 'New' },
                  { value: 'Good', label: 'Good' },
                  { value: 'Fair', label: 'Fair' },
                  { value: 'Damaged', label: 'Damaged' },
                ]
              }
            ]}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
          />
        </div>

        {/* Directory Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className={`${selectedAsset ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-4`}>
            <DataTable
              columns={columns}
              data={filteredAssets}
              onRowClick={handleAssetSelect}
              pageSize={10}
            />
          </div>

          {/* Details side drawer when selected */}
          {selectedAsset && (
            <div className="bg-surface-raised border border-hairline rounded-[10px] shadow-md overflow-hidden flex flex-col">
              {/* Drawer header */}
              <div className="p-6 border-b border-hairline bg-surface flex justify-between items-start">
                <div>
                  <div className="mb-2">
                    <AssetTagChip tag={selectedAsset.assetTag} />
                  </div>
                  <h3 className="font-bold text-lg text-ink font-display">{selectedAsset.name}</h3>
                  <span className="text-xs text-steel font-mono">SN: {selectedAsset.serialNumber || 'N/A'}</span>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-steel hover:text-ink font-mono text-xs hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Drawer details */}
              <div className="p-6 space-y-6">
                {/* QR preview */}
                <div className="flex items-center gap-4 bg-surface p-4 rounded-[6px] border border-hairline">
                  <QrCode className="w-12 h-12 text-ink" />
                  <div>
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider block">QR Code Stamp</span>
                    <button
                      onClick={() => showToast('Initiating printer setup for tag label...', 'info')}
                      className="text-xs text-accent hover:underline font-mono"
                    >
                      Print Sticker Label
                    </button>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-steel block">Location:</span>
                    <span className="font-medium text-ink flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-steel" /> {selectedAsset.location || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-steel block">Acquisition Date:</span>
                    <span className="font-medium text-ink flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-steel" /> {selectedAsset.acquisitionDate ? new Date(selectedAsset.acquisitionDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-steel block">Acquisition Cost:</span>
                    <span className="font-medium font-mono text-ink flex items-center gap-0.5 mt-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-steel" /> {selectedAsset.acquisitionCost ? parseFloat(selectedAsset.acquisitionCost).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-steel block">Resource Booking:</span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {selectedAsset.isBookable ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Edit Action */}
                {(user?.role === 'admin' || user?.role === 'asset_manager') && (
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-1.5"
                    onClick={() => {
                      setFormData({
                        name: selectedAsset.name,
                        categoryId: selectedAsset.categoryId,
                        serialNumber: selectedAsset.serialNumber || '',
                        condition: selectedAsset.condition || 'New',
                        location: selectedAsset.location || '',
                        acquisitionDate: selectedAsset.acquisitionDate ? selectedAsset.acquisitionDate.split('T')[0] : '',
                        acquisitionCost: selectedAsset.acquisitionCost || '',
                        isBookable: selectedAsset.isBookable || false
                      });
                      setIsEditModalOpen(true);
                    }}
                  >
                    <PenTool className="w-4 h-4" /> Edit Specifications
                  </Button>
                )}

                {/* Unified Timeline history list */}
                <div className="border-t border-hairline pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-steel mb-4">Unified Lifecycle Timeline</h4>
                  <Timeline events={timelineEvents} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Register Asset */}
        <Modal
          isOpen={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          title="Register Asset Specifications"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRegModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="reg-form">Save Asset</Button>
            </>
          }
        >
          <form id="reg-form" onSubmit={handleRegisterAsset} className="space-y-4">
            <FormField
              label="Asset Name"
              required
              placeholder="e.g. MacBook Pro M3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormField
              label="Asset Category"
              type="select"
              required
              placeholder="Choose category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <FormField
              label="Serial Number (S/N)"
              placeholder="e.g. SN-9830492"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
            <FormField
              label="Physical Location / Site"
              placeholder="e.g. HQ floor 3"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <FormField
              label="Acquisition Cost ($)"
              type="number"
              placeholder="e.g. 1999.00"
              value={formData.acquisitionCost}
              onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
            />
            <FormField
              label="Acquisition Date"
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
            />
            <FormField
              label="Condition"
              type="select"
              required
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' },
                { value: 'Damaged', label: 'Damaged' },
              ]}
            />
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isBookable"
                checked={formData.isBookable}
                onChange={(e) => setFormData({ ...formData, isBookable: e.target.checked })}
                className="w-4 h-4 rounded-[4px] border-hairline accent-accent"
              />
              <label htmlFor="isBookable" className="text-xs font-semibold text-ink">
                Mark as bookable shared resource / space
              </label>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Asset */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Asset Specifications"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="edit-form">Save Changes</Button>
            </>
          }
        >
          <form id="edit-form" onSubmit={handleEditAsset} className="space-y-4">
            <FormField
              label="Asset Name"
              required
              placeholder="e.g. MacBook Pro M3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormField
              label="Asset Category"
              type="select"
              required
              placeholder="Choose category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <FormField
              label="Serial Number (S/N)"
              placeholder="e.g. SN-9830492"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
            <FormField
              label="Physical Location / Site"
              placeholder="e.g. HQ floor 3"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <FormField
              label="Acquisition Cost ($)"
              type="number"
              placeholder="e.g. 1999.00"
              value={formData.acquisitionCost}
              onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
            />
            <FormField
              label="Acquisition Date"
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
            />
            <FormField
              label="Condition"
              type="select"
              required
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' },
                { value: 'Damaged', label: 'Damaged' },
              ]}
            />
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isBookable-edit"
                checked={formData.isBookable}
                onChange={(e) => setFormData({ ...formData, isBookable: e.target.checked })}
                className="w-4 h-4 rounded-[4px] border-hairline accent-accent"
              />
              <label htmlFor="isBookable-edit" className="text-xs font-semibold text-ink">
                Mark as bookable shared resource / space
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function AssetDirectoryPage() {
  return (
    <ToastProvider>
      <AssetDirectoryContent />
    </ToastProvider>
  );
}
