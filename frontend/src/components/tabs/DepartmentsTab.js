'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Plus, Building, User, Edit, GitMerge } from 'lucide-react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function DepartmentsTab({ user }) {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [headId, setHeadId] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editHeadId, setEditHeadId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchDepartmentsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.data.departments || []);

      const empRes = await api.get('/employees');
      setEmployees(empRes.data.data.employees || []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      setSubmittingCreate(true);
      await api.post('/departments', {
        name,
        code: code.toUpperCase(),
        parentId: parentId ? parseInt(parentId) : undefined,
        departmentHeadId: headId ? parseInt(headId) : undefined
      });
      toast.success('Department created successfully');
      setIsCreateModalOpen(false);
      setName('');
      setCode('');
      setParentId('');
      setHeadId('');
      fetchDepartmentsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;

    try {
      setSubmittingEdit(true);
      await api.patch(`/departments/${selectedDept.id}`, {
        name: editName,
        code: editCode.toUpperCase(),
        parentId: editParentId ? parseInt(editParentId) : null,
        departmentHeadId: editHeadId ? parseInt(editHeadId) : null,
        status: editStatus
      });
      toast.success('Department updated successfully');
      setIsEditModalOpen(false);
      setSelectedDept(null);
      fetchDepartmentsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditParentId(dept.parentId || '');
    setEditHeadId(dept.departmentHeadId || '');
    setEditStatus(dept.status);
    setIsEditModalOpen(true);
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (row) => <span className="font-mono text-xs font-bold text-accent bg-accent/5 px-2.5 py-1 border border-accent/25 rounded">{row.code}</span>
    },
    {
      key: 'name',
      label: 'Department Name',
      sortable: true,
      render: (row) => <span className="font-bold text-ink">{row.name}</span>
    },
    {
      key: 'parent',
      label: 'Parent Department',
      sortable: true,
      render: (row) => row.parent ? (
        <span className="inline-flex items-center gap-1 text-xs text-steel font-medium">
          <GitMerge className="w-3.5 h-3.5 rotate-180" /> {row.parent.name}
        </span>
      ) : <span className="text-xs text-steel/40 font-medium">Root</span>
    },
    {
      key: 'head',
      label: 'Department Head',
      sortable: true,
      render: (row) => row.head ? (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-steel" />
          <span className="text-sm font-semibold text-ink">{row.head.name}</span>
        </div>
      ) : <span className="text-xs text-steel/50 font-medium">None</span>
    },
    {
      key: 'employees',
      label: 'Employees',
      render: (row) => <span className="font-mono text-xs font-semibold text-ink bg-surface border border-hairline px-2 py-0.5 rounded">{row._count?.users ?? 0}</span>
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
            Edit
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
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Departments Management</h2>
          <p className="mt-1 text-sm text-steel">
            Define corporate structures, designate heads of department, and link reporting parents.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchDepartmentsData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Create Department
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
            placeholder="Search departments by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredDepts}
        loading={loading}
        emptyTitle="No departments found"
        emptyDescription="There are no departments logged in the directory."
        emptyActionLabel="Create First Department"
        emptyOnAction={() => setIsCreateModalOpen(true)}
        emptyActionIcon={Plus}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Department"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <FormField
            label="Department Name"
            id="dept-name"
            required
            placeholder="e.g. Engineering, Sales, Human Resources"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormField
            label="Department Code"
            id="dept-code"
            required
            placeholder="e.g. ENG, SLS, HR"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <FormField
            label="Parent Department"
            id="dept-parent"
            type="select"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">No Parent (Root Department)</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
            ))}
          </FormField>

          <FormField
            label="Department Head"
            id="dept-head"
            type="select"
            value={headId}
            onChange={(e) => setHeadId(e.target.value)}
          >
            <option value="">Select Department Head...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
            ))}
          </FormField>

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingCreate}>Create Department</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDept(null);
        }}
        title="Edit Department"
      >
        {selectedDept && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <FormField
              label="Department Name"
              id="edit-dept-name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <FormField
              label="Department Code"
              id="edit-dept-code"
              required
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
            />

            <FormField
              label="Parent Department"
              id="edit-dept-parent"
              type="select"
              value={editParentId}
              onChange={(e) => setEditParentId(e.target.value)}
            >
              <option value="">No Parent (Root Department)</option>
              {departments
                .filter(d => d.id !== selectedDept.id)
                .map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
            </FormField>

            <FormField
              label="Department Head"
              id="edit-dept-head"
              type="select"
              value={editHeadId}
              onChange={(e) => setEditHeadId(e.target.value)}
            >
              <option value="">Select Department Head...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
              ))}
            </FormField>

            <FormField
              label="Department Status"
              id="edit-dept-status"
              type="select"
              required
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormField>

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedDept(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submittingEdit}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
