import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TextInput, TextTextarea } from '../../components/auth/FormFields';
import Dropdown from '../../components/auth/Dropdown';
import DataTable from '../../components/ui/DataTable';
import FileChooser from '../../components/ui/FileChooser';
import {
  inventoryStatusOptions,
  medicineFormOptions
} from '../../data/pharmacyDashboard';
import { pharmacyService } from '../../services/pharmacyService';
import { resolveApiUrl } from '../../utils/apiUrl';

const emptyForm = {
  name: '',
  genericName: '',
  brandName: '',
  description: '',
  form: 'tablet',
  strength: '',
  category: 'General',
  sku: '',
  manufacturer: '',
  price: '',
  stockQuantity: '',
  reorderLevel: '10',
  requiresPrescription: true,
  isActive: true
};

const resolveImageUrl = (url) => resolveApiUrl(url);

const PharmacyInventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pharmacyService.listMedicines({
        q: query || undefined,
        status: status === 'all' ? undefined : status
      });
      setRows(res?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load inventory');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const nextStatus = searchParams.get('status');
    const nextQuery = searchParams.get('q');
    if (nextStatus) setStatus(nextStatus);
    if (nextQuery != null) setQuery(nextQuery);
  }, [searchParams]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      low: rows.filter((row) => row.stockQuantity <= row.reorderLevel).length
    }),
    [rows]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      genericName: row.genericName || '',
      brandName: row.brandName || '',
      description: row.description || '',
      form: row.form || 'tablet',
      strength: row.strength || '',
      category: row.category || 'General',
      sku: row.sku || '',
      manufacturer: row.manufacturer || '',
      price: row.price ?? '',
      stockQuantity: row.stockQuantity ?? '',
      reorderLevel: row.reorderLevel ?? 10,
      requiresPrescription: row.requiresPrescription !== false,
      isActive: row.isActive !== false
    });
    setImageFile(null);
    setImagePreview(resolveImageUrl(row.imageUrl));
    setOpen(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onImageChange = (file) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(editing?.imageUrl ? resolveImageUrl(editing.imageUrl) : '');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onImageClear = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const buildFormData = () => {
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      data.append(key, String(value));
    });
    if (imageFile) data.append('image', imageFile);
    return data;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Medicine name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = buildFormData();
      if (editing?._id) {
        await pharmacyService.updateMedicine(editing._id, payload);
        toast.success('Medicine updated');
      } else {
        await pharmacyService.createMedicine(payload);
        toast.success('Medicine added');
      }
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const removeMedicine = async (row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try {
      await pharmacyService.deleteMedicine(row._id);
      toast.success('Medicine deleted');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete medicine');
    }
  };

  const columns = [
    {
      key: 'imageUrl',
      label: 'Item',
      render: (_v, row) => (
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
            {row.imageUrl ? (
              <img src={resolveImageUrl(row.imageUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-400">
                RX
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-500">
              {[row.strength, row.form].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      )
    },
    { key: 'category', label: 'Category' },
    {
      key: 'price',
      label: 'Price',
      render: (value, row) => `UGX ${Number(value || 0).toLocaleString()}`
    },
    {
      key: 'stockQuantity',
      label: 'Stock',
      render: (value, row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            value <= row.reorderLevel ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {value} units
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            value ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeMedicine(row);
            }}
            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Inventory</h1>
          <p className="mt-1 text-sm text-ink-600">
            Add medicines with images, descriptions, pricing, and stock levels.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} /> Add medicine
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <div className="w-44">
          <Dropdown
            value={status}
            onChange={(value) => {
              setStatus(value);
              if (value === 'all') setSearchParams({});
              else setSearchParams({ status: value });
            }}
            options={inventoryStatusOptions}
          />
        </div>
        <p className="text-xs text-ink-500">
          {counts.all} shown · {counts.low} low stock
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No medicines in inventory yet."
        onRowClick={openEdit}
      />

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
              <button
                type="button"
                aria-label="Close medicine form"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
                onClick={() => setOpen(false)}
              />
              <form
                onSubmit={onSubmit}
                className="relative z-10 flex max-h-[min(640px,92vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
              >
                <div className="flex shrink-0 items-start justify-between border-b border-ink-100 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink-900">
                      {editing ? 'Edit medicine' : 'Add medicine'}
                    </h2>
                    <p className="mt-0.5 text-sm text-ink-500">
                      Upload image, pricing, and stock details for your catalog.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput label="Medicine name" name="name" value={form.name} onChange={onChange} required />
                    <TextInput label="Generic name" name="genericName" value={form.genericName} onChange={onChange} />
                    <TextInput label="Brand name" name="brandName" value={form.brandName} onChange={onChange} />
                    <TextInput label="Strength" name="strength" value={form.strength} onChange={onChange} placeholder="500mg" />
                    <Dropdown
                      label="Form"
                      value={form.form}
                      onChange={(value) => setForm((prev) => ({ ...prev, form: value }))}
                      options={medicineFormOptions}
                      placeholder="Select form"
                      portal
                    />
                    <TextInput label="Category" name="category" value={form.category} onChange={onChange} />
                    <TextInput label="SKU" name="sku" value={form.sku} onChange={onChange} />
                    <TextInput label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={onChange} />
                    <TextInput label="Price (UGX)" name="price" type="number" value={form.price} onChange={onChange} />
                    <TextInput
                      label="Stock quantity"
                      name="stockQuantity"
                      type="number"
                      value={form.stockQuantity}
                      onChange={onChange}
                    />
                    <TextInput
                      label="Reorder level"
                      name="reorderLevel"
                      type="number"
                      value={form.reorderLevel}
                      onChange={onChange}
                    />
                    <div className="sm:col-span-2">
                      <TextTextarea
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={onChange}
                        rows={3}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FileChooser
                        label="Medicine image"
                        previewUrl={imagePreview}
                        fileName={imageFile?.name || ''}
                        onChange={onImageChange}
                        onClear={onImageClear}
                        buttonLabel={imagePreview ? 'Replace image' : 'Choose file'}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        name="requiresPrescription"
                        checked={form.requiresPrescription}
                        onChange={onChange}
                        className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                      />
                      Requires prescription
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={onChange}
                        className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                      />
                      Active in catalog
                    </label>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 border-t border-ink-100 bg-ink-50/40 px-5 py-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save medicine'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default PharmacyInventory;
