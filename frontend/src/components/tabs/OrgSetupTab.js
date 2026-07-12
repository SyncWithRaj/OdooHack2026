'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Loader2, X } from 'lucide-react';

export default function OrgSetupTab({ user }) {
  const [subTab, setSubTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deptRes, catRes, empRes] = await Promise.all([
        api.get('/departments'),
        api.get('/categories'),
        api.get('/employees'),
      ]);
      setDepartments(deptRes.data.data.departments || []);
      setCategories(catRes.data.data.categories || []);
      setEmployees(empRes.data.data.employees || []);
    } catch (err) {
      console.error('Failed to load org data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...addForm };
      
      if (subTab === 'categories' && payload.metadataSchema) {
        try {
          payload.metadataSchema = JSON.parse(payload.metadataSchema);
        } catch (e) {
          toast.error('Metadata Schema must be valid JSON');
          return;
        }
      }

      if (subTab === 'departments') {
        await api.post('/departments', payload);
        toast.success('Department created');
      } else if (subTab === 'categories') {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setShowAddModal(false);
      setAddForm({});
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleRoleChange = async (empId, newRole) => {
    try {
      await api.patch(`/employees/${empId}/role`, { role: newRole });
      toast.success('Role updated');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const tabs = ['departments', 'categories', 'employees'];

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border border-green-200',
      inactive: 'bg-red-100 text-red-800 border border-red-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex items-center gap-3 mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              subTab === t 
                ? 'bg-gray-800 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t === 'employees' ? 'Employee' : t}
          </button>
        ))}
        {subTab !== 'employees' && (
          <button
            onClick={() => { setShowAddModal(true); setAddForm({}); }}
            className="ml-auto inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* Departments Table */}
          {subTab === 'departments' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Head</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Dept</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{dept.head?.name || dept.departmentHead?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{dept.parent?.name || '—'}</td>
                      <td className="px-6 py-4">{getStatusBadge(dept.status || 'active')}</td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">No departments yet.</td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
                Editing a department here also drives the picklist in Asset & Allocation screens.
              </div>
            </div>
          )}

          {/* Categories Table */}
          {subTab === 'categories' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '—'}</td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan="2" className="px-6 py-12 text-center text-gray-500">No categories yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Employees Table */}
          {subTab === 'employees' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{emp.department?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{emp.role?.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="employee">Employee</option>
                          <option value="department_head">Dept Head</option>
                          <option value="asset_manager">Asset Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No employees.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">Add {subTab === 'departments' ? 'Department' : 'Category'}</h3>
              <button onClick={() => setShowAddModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={addForm.name || ''}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              {subTab === 'departments' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. ENG"
                      value={addForm.code || ''}
                      onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Department</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={addForm.parentId || ''}
                      onChange={(e) => setAddForm({ ...addForm, parentId: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">None (Top-level)</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={addForm.departmentHeadId || ''}
                      onChange={(e) => setAddForm({ ...addForm, departmentHeadId: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">Select head...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              {subTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      value={addForm.description || ''}
                      onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metadata Schema (JSON)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder='e.g. {"cpu":"string", "ram":"number"}'
                      value={addForm.metadataSchema || ''}
                      onChange={(e) => setAddForm({ ...addForm, metadataSchema: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional. Defines custom fields for assets in this category.</p>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
