import { ImagePlus, MoreVertical, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { uploadImage } from '../../services/uploadService.js';

const createEmptyForm = () => ({
  name: '',
  description: '',
  image_url: '',
  is_active: true,
});

const buildPayload = (form) => {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    image_url: form.image_url || null,
    is_active: Boolean(form.is_active),
  };
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const editingCategory = useMemo(
    () => categories.find((category) => Number(category.categoryId) === Number(editingId)),
    [categories, editingId]
  );

  async function loadCategories() {
    setIsLoading(true);
    setError('');

    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không thể tải danh mục');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const data = await uploadImage(file, 'camstore/categories');
      setForm((current) => ({ ...current, image_url: data.url }));
      setMessage('Đã upload ảnh đại diện danh mục.');
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Không upload được ảnh danh mục');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  function startEdit(category) {
    setEditingId(category.categoryId);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: Boolean(category.is_active),
    });
    setMessage('');
    setError('');
    setOpenActionId(null);
    setIsFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
  }

  function openCreateModal() {
    resetForm();
    setMessage('');
    setError('');
    setOpenActionId(null);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    resetForm();
    setMessage('');
    setError('');
    setIsFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (editingId) {
        await adminService.updateCategory(editingId, buildPayload(form));
        setMessage('Danh mục đã được cập nhật.');
      } else {
        await adminService.createCategory(buildPayload(form));
        setMessage('Danh mục mới đã được tạo.');
      }

      resetForm();
      setIsFormOpen(false);
      await loadCategories();
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Không thể lưu danh mục');
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleCategory(category) {
    setError('');
    setMessage('');
    setIsLoading(true);
    setOpenActionId(null);

    try {
      await adminService.updateCategory(category.categoryId, { is_active: !category.is_active });
      setMessage(category.is_active ? 'Danh mục đã được ẩn.' : 'Danh mục đã được kích hoạt lại.');
      await loadCategories();
    } catch (toggleError) {
      setError(toggleError.response?.data?.message || 'Không thể cập nhật trạng thái danh mục');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleActionMenu(categoryId) {
    setOpenActionId((currentId) => (currentId === categoryId ? null : categoryId));
  }

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Danh mục sản phẩm</h1>
          <p>Quản lý danh mục chính, ảnh đại diện và trạng thái hiển thị trên cửa hàng.</p>
        </div>
        <button type="button" className="admin-btn primary large" onClick={openCreateModal}>
          <Plus size={24} /> Thêm danh mục
        </button>
      </section>

      {!isFormOpen && message && <p className="form-success admin-page-message">{message}</p>}
      {!isFormOpen && error && <p className="form-error admin-page-message">{error}</p>}

      {isFormOpen && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <div>
                <h2>{editingId ? `Sửa danh mục ${editingCategory?.name || ''}` : 'Thêm danh mục'}</h2>
                <p>Slug do hệ thống quản lý, không cần nhập thủ công.</p>
              </div>
              <button type="button" className="admin-modal-close" aria-label="Đóng form" onClick={closeFormModal}>
                <X size={20} />
              </button>
            </div>
            <form className="admin-category-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="span-2">
                  <span>Tên danh mục</span>
                  <input name="name" value={form.name} onChange={updateField} required />
                </label>
                <label className="span-2 admin-file-control">
                  <span className="field-label">Ảnh đại diện</span>
                  <span className="admin-file-trigger">
                    <ImagePlus size={20} />
                    {isUploading ? 'Đang upload...' : 'Chọn ảnh từ máy'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
                {form.image_url && (
                  <div className="admin-upload-preview span-2">
                    <img src={form.image_url} alt="Ảnh danh mục đã upload" />
                    <small>Ảnh đã sẵn sàng để lưu cùng danh mục.</small>
                  </div>
                )}
                <label className="span-2">
                  <span>Mô tả</span>
                  <textarea name="description" value={form.description} onChange={updateField} rows={3} />
                </label>
              </div>
              {message && <p className="form-success">{message}</p>}
              {error && <p className="form-error">{error}</p>}
              <div className="profile-form-actions">
                <button className="admin-btn primary" type="submit" disabled={isLoading || isUploading}>
                  <Plus size={20} /> {editingId ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
                <button className="admin-btn light" type="button" onClick={closeFormModal}>
                  Hủy
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="admin-table-card has-row-menu">
        <div className="admin-categories-table admin-table-head-row">
          <span>Danh mục</span>
          <span>Slug</span>
          <span>Thao tác</span>
        </div>
        {categories.map((category) => (
          <div className="admin-categories-table admin-table-row" key={category.categoryId}>
            <div className="admin-category-name">
              {category.image_url && <img src={category.image_url} alt={category.name} />}
              <div>
                <strong>{category.name}</strong>
                <small>{category.description || 'Không có mô tả'}</small>
              </div>
            </div>
            <span>{category.slug}</span>
            <div className="admin-row-actions">
              <button
                type="button"
                className="admin-row-action"
                aria-label="Mở thao tác danh mục"
                onClick={() => toggleActionMenu(category.categoryId)}
              >
                <MoreVertical size={21} />
              </button>
              {openActionId === category.categoryId && (
                <div className="admin-row-menu">
                  <button type="button" onClick={() => startEdit(category)}>
                    Chỉnh sửa
                  </button>
                  <button type="button" onClick={() => toggleCategory(category)}>
                    {category.is_active ? 'Ẩn danh mục' : 'Kích hoạt lại'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && !isLoading && (
          <div className="empty-state inline">
            <h2>Chưa có danh mục</h2>
            <p>Tạo danh mục đầu tiên để gắn sản phẩm vào cửa hàng.</p>
          </div>
        )}
      </section>
    </main>
  );
}
