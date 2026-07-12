'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Loader2, MoreVertical, Package, X } from 'lucide-react';

export default function AssetsTab({ user }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', categoryId: '', serialNumber: '', condition: 'New', 
    location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetRes, catRes] = await Promise.all([
        api.get('/assets'),
        api.get('/categories')
      ]);
      setAssets(assetRes.data.data.assets);
      setCategories(catRes.data.data.categories || []);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, categoryId: parseInt(form.categoryId) };
      if (payload.acquisitionCost) payload.acquisitionCost = parseFloat(payload.acquisitionCost);
      else delete payload.acquisitionCost;
      
      if (!payload.acquisitionDate) delete payload.acquisitionDate;

      await api.post('/assets', payload);
      toast.success('Asset registered successfully');
      setShowModal(false);
      setForm({ name: '', categoryId: '', serialNumber: '', condition: 'New', location: '', acquisitionDate: '', acquisitionCost: '', isBookable: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(search.toLowerCase()) || 
    asset.assetTag.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      allocated: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      retired: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assets Inventory</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage hardware and software assets in the organization.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {['admin', 'asset_manager'].includes(user?.role) && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.assetTag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.category?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.condition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Register New Asset</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="register-form" onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                  <input required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Dell XPS 15" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. HQ - IT Dept" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.acquisitionDate} onChange={e => setForm({...form, acquisitionDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost ($)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="0.00" value={form.acquisitionCost} onChange={e => setForm({...form, acquisitionCost: e.target.value})} />
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" id="isBookable" className="h-4 w-4 text-blue-600 rounded border-gray-300" checked={form.isBookable} onChange={e => setForm({...form, isBookable: e.target.checked})} />
                  <label htmlFor="isBookable" className="ml-2 block text-sm text-gray-700">Can be booked by users</label>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" form="register-form" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">Register Asset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
