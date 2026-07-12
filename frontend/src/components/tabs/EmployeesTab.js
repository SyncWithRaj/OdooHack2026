'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Loader2, UserCircle, Shield, MoreVertical } from 'lucide-react';

export default function EmployeesTab({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Unauthorized');
    }
  }, [user]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await api.get('/employees');
        setEmployees(res.data.data.employees);
      } catch (err) {
        toast.error('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') fetchEmployees();
  }, [user]);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Employee Directory</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage user roles, departments, and access levels.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No employees found.</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <UserCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                          <div className="text-sm text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {emp.role === 'admin' && <Shield className="h-4 w-4 mr-2 text-red-500" />}
                        <span className="text-sm text-gray-900 capitalize">{emp.role.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-blue-600">Change Role</button>
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
