'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Plus, Tag, Edit, Trash, HelpCircle, Code } from 'lucide-react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function CategoriesTab({ user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Custom Schema builder helper
  const [customFields, setCustomFields] = useState([{ name: '', type: 'text' }]);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCustomFields, setEditCustomFields] = useState([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data.categories || []);
    } catch (err) {
      toast.error('Failed to load asset categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddField = (isEdit = false) => {
    if (isEdit) {
      setEditCustomFields([...editCustomFields, { name: '', type: 'text' }]);
    } else {
      setCustomFields([...customFields, { name: '', type: 'text' }]);
    }
  };

  const handleRemoveField = (index, isEdit = false) => {
    if (isEdit) {
      const copy = [...editCustomFields];
      copy.splice(index, 1);
      setEditCustomFields(copy);
    } else {
      const copy = [...customFields];
      copy.splice(index, 1);
      setCustomFields(copy);
    }
  };

  const handleFieldChange = (index, key, value, isEdit = false) => {
    if (isEdit) {
      const copy = [...editCustomFields];
      copy[index][key] = value;
      setEditCustomFields(copy);
    } else {
      const copy = [...customFields];
      copy[index][key] = value;
      setCustomFields(copy);
    }
  };

  const buildSchema = (fields) => {
    const schema = {};
    fields.forEach(f => {
      const trimmed = f.name.trim().toLowerCase().replace(/[\s-]/g, '_');
      if (trimmed) {
        schema[trimmed] = f.type === 'number' ? 0 : '';
      }
    });
    return schema;
  };

  const parseSchema = (schema) => {
    if (!schema || typeof schema !== 'object') return [];
    return Object.keys(schema).map(key => ({
      name: key.replace(/_/g, ' '),
      type: typeof schema[key] === 'number' ? 'number' : 'text'
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    const metadataSchema = buildSchema(customFields);

    try {
      setSubmittingCreate(true);
      await api.post('/categories', {
        name,
        description,
        metadataSchema
      });
      toast.success('Asset category created successfully');
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      setCustomFields([{ name: '', type: 'text' }]);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCat) return;

    const metadataSchema = buildSchema(editCustomFields);

    try {
      setSubmittingEdit(true);
      await api.patch(`/categories/${selectedCat.id}`, {
        name: editName,
        description: editDescription,
        metadataSchema
      });
      toast.success('Asset category updated successfully');
      setIsEditModalOpen(false);
      setSelectedCat(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openEditModal = (cat) => {
    setSelectedCat(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditCustomFields(parseSchema(cat.metadataSchema) || []);
    setIsEditModalOpen(true);
  };

  const filteredCats = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 border border-accent/20 rounded text-accent">
            <Tag className="w-4 h-4" />
          </div>
          <span className="font-bold text-ink">{row.name}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <span className="text-sm text-steel block max-w-sm truncate">{row.description || 'No description'}</span>
    },
    {
      key: 'metadataSchema',
      label: 'Custom Spec Fields',
      render: (row) => {
        const fields = row.metadataSchema ? Object.keys(row.metadataSchema) : [];
        if (fields.length === 0) return <span className="text-xs text-steel/40">None defined</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {fields.map(f => (
              <span key={f} className="text-[10px] font-mono font-semibold bg-surface border border-hairline px-2 py-0.5 rounded capitalize text-steel">
                {f.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'assets',
      label: 'Total Assets',
      sortable: true,
      render: (row) => <span className="font-mono text-xs font-semibold text-ink bg-surface border border-hairline px-2 py-0.5 rounded">{row._count?.assets ?? 0}</span>
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
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Asset Categories</h2>
          <p className="mt-1 text-sm text-steel">
            Define classification rules, specify schema fields, and track asset counts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchCategories()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Create Category
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
            placeholder="Search categories by name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredCats}
        loading={loading}
        emptyTitle="No categories found"
        emptyDescription="There are no asset categories defined in the registry."
        emptyActionLabel="Create First Category"
        emptyOnAction={() => setIsCreateModalOpen(true)}
        emptyActionIcon={Plus}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Asset Category"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <FormField
            label="Category Name"
            id="cat-name"
            required
            placeholder="e.g. Laptops, Vehicles, Office Desks"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormField
            label="Description"
            id="cat-desc"
            type="textarea"
            placeholder="e.g. Portable computing units, vehicles allocated to field operations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Dynamic Spec Fields builder */}
          <div className="flex flex-col gap-3 border-t border-hairline pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-steel flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-accent" /> Custom Attribute Fields
              </span>
              <Button
                variant="secondary"
                onClick={() => handleAddField(false)}
                icon={Plus}
                className="!py-0.5 !px-2 text-xs"
              >
                Add Field
              </Button>
            </div>
            
            <p className="text-xs text-steel">
              Specify custom parameters that assets belonging to this category will require (e.g. warranty_period, brand).
            </p>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Field Name (e.g. Ram GB)"
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value, false)}
                    className="block flex-1 px-3 py-1.5 border border-hairline rounded bg-white text-ink text-xs focus:ring-accent focus:border-accent"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(idx, 'type', e.target.value, false)}
                    className="block w-28 px-3 py-1.5 border border-hairline rounded bg-white text-ink text-xs focus:ring-accent focus:border-accent"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx, false)}
                    disabled={customFields.length === 1}
                    className="p-1.5 border border-hairline hover:border-status-lost rounded hover:text-status-lost disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingCreate}>Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCat(null);
        }}
        title="Edit Asset Category"
      >
        {selectedCat && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <FormField
              label="Category Name"
              id="edit-cat-name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <FormField
              label="Description"
              id="edit-cat-desc"
              type="textarea"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            {/* Dynamic Spec Fields builder */}
            <div className="flex flex-col gap-3 border-t border-hairline pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-steel flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-accent" /> Custom Attribute Fields
                </span>
                <Button
                  variant="secondary"
                  onClick={() => handleAddField(true)}
                  icon={Plus}
                  className="!py-0.5 !px-2 text-xs"
                >
                  Add Field
                </Button>
              </div>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {editCustomFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Field Name (e.g. Warranty Months)"
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value, true)}
                      className="block flex-1 px-3 py-1.5 border border-hairline rounded bg-white text-ink text-xs focus:ring-accent focus:border-accent"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, 'type', e.target.value, true)}
                      className="block w-28 px-3 py-1.5 border border-hairline rounded bg-white text-ink text-xs focus:ring-accent focus:border-accent"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx, true)}
                      className="p-1.5 border border-hairline hover:border-status-lost rounded hover:text-status-lost"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCat(null);
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
