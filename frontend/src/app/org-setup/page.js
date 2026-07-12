'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Tabs from '@/components/shared/Tabs';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import Avatar from '@/components/shared/Avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { Plus, Users, ShieldAlert, FolderHeart, Landmark } from 'lucide-react';

function OrgSetupContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Forms state
  const [newDept, setNewDept] = useState({ name: '', code: '', departmentHeadId: '', parentId: '' });
  const [newCat, setNewCat] = useState({ name: '', description: '', metadataSchema: '' });
  const [roleEdit, setRoleEdit] = useState({ employeeId: '', name: '', role: 'employee' });

  const loadData = async () => {
    try {
      const deptList = await api.get('/departments');
      setDepartments(deptList);

      const catList = await api.get('/categories');
      setCategories(catList);

      const empList = await api.get('/employees');
      setEmployees(empList);
    } catch (err) {
      console.error('Failed to load org setup data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        showToast('Access denied: Admin role required.', 'error');
        router.push('/dashboard');
        return;
      }
      loadData();
    }
  }, [user]);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', newDept);
      showToast(`Department ${newDept.name} created!`, 'success');
      setIsDeptModalOpen(false);
      setNewDept({ name: '', code: '', departmentHeadId: '', parentId: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create department', 'error');
    }
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    try {
      let schema = {};
      if (newCat.metadataSchema) {
        try {
          schema = JSON.parse(newCat.metadataSchema);
        } catch {
          throw new Error('Invalid JSON format for metadata schema.');
        }
      }
      await api.post('/categories', { ...newCat, metadataSchema: schema });
      showToast(`Asset Category ${newCat.name} created!`, 'success');
      setIsCatModalOpen(false);
      setNewCat({ name: '', description: '', metadataSchema: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/employees/${roleEdit.employeeId}/role`, { role: roleEdit.role });
      showToast(`Promoted role for ${roleEdit.name} to ${roleEdit.role.replace('_', ' ')}!`, 'success');
      setIsRoleModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update employee role', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  // DataTable columns definitions
  const deptColumns = [
    { key: 'name', label: 'Department Name', sortable: true },
    { key: 'code', label: 'Code', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'head', label: 'Department Head', render: (val) => val?.name || <span className="text-steel italic">None</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="audit" status={val || 'active'} /> }, // reusing audit open/closed badge colors
  ];

  const catColumns = [
    { key: 'name', label: 'Category Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'metadataSchema', label: 'Custom Fields Schema', render: (val) => <span className="font-mono text-[11px] text-steel">{val ? JSON.stringify(val) : '{}'}</span> },
  ];

  const empColumns = [
    { key: 'avatar', label: '', render: (_, row) => <Avatar name={row.name} size="sm" /> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'System Role', render: (val) => <span className="font-mono text-xs uppercase text-accent-ink bg-accent/15 px-2 py-0.5 rounded-[4px]">{val?.replace('_', ' ')}</span> },
    { key: 'department', label: 'Department', render: (val) => val?.name || 'Unassigned' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="audit" status={val || 'active'} /> },
  ];

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'categories', label: 'Asset Categories' },
    { id: 'employees', label: 'Employee Directory' },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">ORGANIZATION SETUP</h1>
          <p className="text-steel text-sm mt-1">Configure company structure, inventory metadata schemas, and employee privileges.</p>
        </div>

        {/* Tab Selection */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Panel contents */}
        {activeTab === 'departments' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4.5 h-4.5 text-accent" /> Departments
              </h2>
              <Button variant="primary" onClick={() => setIsDeptModalOpen(true)} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Department
              </Button>
            </div>
            
            <DataTable
              columns={deptColumns}
              data={departments}
              rowActions={[
                { label: 'Edit Department', onClick: (row) => showToast('Details editing not supported in this version', 'info') }
              ]}
            />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
                <FolderHeart className="w-4.5 h-4.5 text-accent" /> Asset Categories
              </h2>
              <Button variant="primary" onClick={() => setIsCatModalOpen(true)} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Create Category
              </Button>
            </div>
            
            <DataTable
              columns={catColumns}
              data={categories}
            />
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-accent" /> Employee Directory
              </h2>
            </div>
            
            <DataTable
              columns={empColumns}
              data={employees}
              rowActions={[
                {
                  label: 'Modify System Role',
                  onClick: (row) => {
                    setRoleEdit({ employeeId: row.id, name: row.name, role: row.role });
                    setIsRoleModalOpen(true);
                  }
                }
              ]}
            />
          </div>
        )}

        {/* Modal: Add Department */}
        <Modal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          title="Create Department"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="dept-form">Save</Button>
            </>
          }
        >
          <form id="dept-form" onSubmit={handleCreateDept}>
            <FormField
              label="Department Name"
              placeholder="e.g. Finance & Accounting"
              required
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            />
            <FormField
              label="Department Code"
              placeholder="e.g. FIN"
              required
              value={newDept.code}
              onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
            />
            <FormField
              label="Select Head"
              type="select"
              placeholder="Choose head employee"
              value={newDept.departmentHeadId}
              onChange={(e) => setNewDept({ ...newDept, departmentHeadId: e.target.value })}
              options={employees.map(e => ({ value: e.id, label: e.name }))}
            />
            <FormField
              label="Parent Department (Optional)"
              type="select"
              placeholder="Select parent"
              value={newDept.parentId}
              onChange={(e) => setNewDept({ ...newDept, parentId: e.target.value })}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
          </form>
        </Modal>

        {/* Modal: Add Category */}
        <Modal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          title="Create Asset Category"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCatModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="cat-form">Create</Button>
            </>
          }
        >
          <form id="cat-form" onSubmit={handleCreateCat}>
            <FormField
              label="Category Name"
              placeholder="e.g. Laptops"
              required
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            />
            <FormField
              label="Category Description"
              placeholder="Provide context for registry users..."
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
            />
            <FormField
              label="Metadata Custom Fields (JSON)"
              type="textarea"
              placeholder='e.g. { "ram_gb": 16, "brand": "" }'
              value={newCat.metadataSchema}
              onChange={(e) => setNewCat({ ...newCat, metadataSchema: e.target.value })}
              helperText="Define key-value schema pairs representing specialized parameters."
            />
          </form>
        </Modal>

        {/* Modal: Modify Role */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title="Modify Employee Role"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="role-form">Update Role</Button>
            </>
          }
        >
          <form id="role-form" onSubmit={handleUpdateRole}>
            <div className="mb-4">
              <span className="text-xs font-semibold text-steel block mb-1">Target Employee:</span>
              <div className="flex items-center gap-2 p-3 bg-surface border border-hairline rounded-[6px]">
                <Avatar name={roleEdit.name} size="sm" />
                <span className="font-semibold text-sm text-ink">{roleEdit.name}</span>
              </div>
            </div>
            
            <FormField
              label="System Authority Role"
              type="select"
              required
              value={roleEdit.role}
              onChange={(e) => setRoleEdit({ ...roleEdit, role: e.target.value })}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'department_head', label: 'Department Head' },
                { value: 'asset_manager', label: 'Asset Manager' },
                { value: 'admin', label: 'Administrator' },
              ]}
              helperText="This promotion escalates org-wide panel privileges. No client-side override allowed."
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function OrgSetupPage() {
  return (
    <ToastProvider>
      <OrgSetupContent />
    </ToastProvider>
  );
}
