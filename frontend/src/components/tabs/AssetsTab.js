'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Loader2, MoreVertical, Package } from 'lucide-react';

export default function AssetsTab({ user }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assets');
      setAssets(res.data.data.assets);
    } catch (err) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
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
              onClick={() => toast('Register Asset form coming soon', { icon: '🚧' })}
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
    </div>
  );
}
