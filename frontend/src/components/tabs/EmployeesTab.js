'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Loader2, UserCircle, Shield, RefreshCw, Edit } from 'lucide-react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function EmployeesTab({ user }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Employee Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empRole, setEmpRole] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');
  const [empStatus, setEmpStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      setEmployees(res.data.data.employees || []);

      const deptRes = await api.get('/departments');
      setDepartments(deptRes.data.data.departments || []);
    } catch (err) {
      toast.error('Failed to fetch employees directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access Denied. Admins only.');
      return;
    }
    fetchEmployeesData();
  }, [user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    try {
      setSubmittingEdit(true);
      
      // Update role (endpoint: /employees/:id/role)
      if (empRole !== selectedEmp.role) {
        await api.patch(`/employees/${selectedEmp.id}/role`, {
          role: empRole
        });
      }

      // Update dept & status (endpoint: /employees/:id)
      await api.patch(`/employees/${selectedEmp.id}`, {
        departmentId: empDeptId ? parseInt(empDeptId) : null,
        status: empStatus
      });

      toast.success('Employee profile updated successfully');
      setIsEditModalOpen(false);
      setSelectedEmp(null);
      fetchEmployeesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee details');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setEmpRole(emp.role);
    setEmpDeptId(emp.departmentId || '');
    setEmpStatus(emp.status);
    setIsEditModalOpen(true);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      label: 'Employee Info',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <UserCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-ink">{row.name}</span>
            <span className="text-xs text-steel/60">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Access Role',
      sortable: true,
      render: (row) => (
        <div className="flex items-center">
          {row.role === 'admin' && <Shield className="h-4 w-4 mr-1.5 text-status-lost shrink-0" />}
          <span className="text-sm text-ink capitalize font-medium">{row.role.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (row) => <span className="text-steel font-medium">{row.department?.name || 'Unassigned'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
          row.status === 'active' ? 'bg-status-available/10 text-status-available border border-status-available/20' :
          'bg-status-lost/10 text-status-lost border border-status-lost/20'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => openEditModal(row)}
            icon={Edit}
            className="!p-1.5 !px-3 font-semibold text-xs"
          >
            Manage
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Employee Directory</h2>
          <p className="mt-1 text-sm text-steel">
            Manage employee system roles, department alignments, and account activation states.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchEmployeesData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 bg-white border border-hairline rounded-lg shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search employees by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        loading={loading}
        emptyTitle="No employees found"
        emptyDescription="There are no users registered matching your criteria."
      />

      {/* Edit Role & Department Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmp(null);
        }}
        title="Manage Employee Profile"
      >
        {selectedEmp && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="p-4 bg-surface border border-hairline rounded">
              <span className="text-xs uppercase font-bold text-steel">Modifying Account</span>
              <p className="text-sm font-bold text-ink mt-0.5">{selectedEmp.name}</p>
              <p className="text-xs text-steel">{selectedEmp.email}</p>
            </div>

            <FormField
              label="System Role"
              id="emp-role-select"
              type="select"
              required
              value={empRole}
              onChange={(e) => setEmpRole(e.target.value)}
            >
              <option value="employee">Employee</option>
              <option value="department_head">Department Head</option>
              <option value="asset_manager">Asset Manager</option>
              <option value="admin">Administrator</option>
            </FormField>

            <FormField
              label="Department Alignment"
              id="emp-dept-select"
              type="select"
              value={empDeptId}
              onChange={(e) => setEmpDeptId(e.target.value)}
            >
              <option value="">Unassigned / Independent</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
              ))}
            </FormField>

            <FormField
              label="Account Status"
              id="emp-status-select"
              type="select"
              required
              value={empStatus}
              onChange={(e) => setEmpStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormField>

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEmp(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submittingEdit}>Save Alignment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
