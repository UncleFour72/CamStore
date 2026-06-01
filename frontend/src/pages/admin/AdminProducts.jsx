import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ImagePlus,
  ListPlus,
  MoreVertical,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { uploadImage } from '../../services/uploadService.js';
import { formatPrice } from '../../utils/helpers.js';

const pageSize = 8;

const createEmptySpec = () => ({ spec_name: '', spec_value: '' });

const createEmptyForm = () => ({
  name: '',
  brand: '',
  sku: '',
  price: '',
  original_price: '',
  stock_quantity: '',
  category_id: '',
  condition: 'Mới 100%',
  badge: '',
  short_description: '',
  description: '',
  image_url: '',
  is_active: true,
  specs: [createEmptySpec()],
});

const buildPayload = (form) => {
  return {
    name: form.name.trim(),
    brand: form.brand.trim(),
    sku: form.sku.trim(),
    price: Number(form.price),
    original_price: form.original_price ? Number(form.original_price) : null,
    stock_quantity: Number(form.stock_quantity || 0),
    category_id: Number(form.category_id),
    condition: form.condition || null,
    badge: form.badge.trim() || null,
    short_description: form.short_description.trim() || null,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    is_active: Boolean(form.is_active),
    specs: form.specs
      .map((spec, index) => ({
        spec_name: spec.spec_name.trim(),
        spec_value: spec.spec_value.trim(),
        sort_order: index,
      }))
      .filter((spec) => spec.spec_name && spec.spec_value),
  };
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [filters, setFilters] = useState({ page: 1, category: '', status: 'all', sort: 'newest' });
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const activeCategories = useMemo(() => categories.filter((category) => category.is_active), [categories]);

  async function loadProducts(nextFilters = filters) {
    setIsLoading(true);
    setError('');

    try {
      const data = await adminService.getProducts({
        page: nextFilters.page,
        limit: pageSize,
        category: nextFilters.category,
        status: nextFilters.status,
        sort: nextFilters.sort,
      });
      setProducts(data.items);
      setPagination(data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không thể tải sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts(filters);
  }, [filters.page, filters.category, filters.status, filters.sort]);

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleImageUpload(event) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('Đang upload ảnh sản phẩm...');

    try {
      const uploaded = await uploadImage(file, 'camstore/products');
      setForm((current) => ({ ...current, image_url: uploaded.url }));
      setMessage('Ảnh đã upload, bấm lưu để cập nhật sản phẩm.');
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Không thể upload ảnh');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
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

  function startEdit(product) {
    const specs = product.specs?.length
      ? product.specs.map(([spec_name, spec_value]) => ({ spec_name, spec_value }))
      : [createEmptySpec()];

    setEditingId(product.productId || product.apiId);
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      sku: product.sku || '',
      price: product.price || '',
      original_price: product.original_price || '',
      stock_quantity: product.stock || '',
      category_id: product.rawCategory?.categoryId || product.category_id || '',
      condition: product.condition || '',
      badge: product.badge || '',
      short_description: product.short_description || '',
      description: product.description || '',
      image_url: product.image || '',
      is_active: Boolean(product.is_active),
      specs,
    });
    setMessage('');
    setError('');
    setOpenActionId(null);
    setIsFormOpen(true);
  }

  function updateSpec(index, field, value) {
    setForm((current) => ({
      ...current,
      specs: current.specs.map((spec, specIndex) =>
        specIndex === index ? { ...spec, [field]: value } : spec
      ),
    }));
  }

  function addSpecRow() {
    setForm((current) => ({
      ...current,
      specs: [...current.specs, createEmptySpec()],
    }));
  }

  function removeSpecRow(index) {
    setForm((current) => ({
      ...current,
      specs:
        current.specs.length > 1
          ? current.specs.filter((_, specIndex) => specIndex !== index)
          : [createEmptySpec()],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await adminService.updateProduct(editingId, buildPayload(form));
        setMessage('Sản phẩm đã được cập nhật.');
      } else {
        await adminService.createProduct(buildPayload(form));
        setMessage('Sản phẩm mới đã được tạo.');
      }

      resetForm();
      setIsFormOpen(false);
      await loadProducts(filters);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Không thể lưu sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleProductStatus(product) {
    const productId = product.productId || product.apiId;

    setIsLoading(true);
    setError('');
    setMessage('');
    setOpenActionId(null);

    try {
      if (product.is_active) {
        await adminService.deleteProduct(productId);
        setMessage('Sản phẩm đã được xóa khỏi cửa hàng.');
      } else {
        await adminService.updateProduct(productId, { is_active: true });
        setMessage('Sản phẩm đã được kích hoạt lại.');
      }

      await loadProducts(filters);
    } catch (toggleError) {
      setError(toggleError.response?.data?.message || 'Không thể cập nhật trạng thái sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleActionMenu(productId) {
    setOpenActionId((currentId) => (currentId === productId ? null : productId));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Danh sách sản phẩm</h1>
          <p>Quản lý và cập nhật thông tin kho hàng từ Product Service.</p>
        </div>
        <button type="button" className="admin-btn primary large" onClick={openCreateModal}>
          <Plus size={24} /> Thêm sản phẩm mới
        </button>
      </section>

      {!isFormOpen && message && <p className="form-success admin-page-message">{message}</p>}
      {!isFormOpen && error && <p className="form-error admin-page-message">{error}</p>}

      {isFormOpen && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-product-modal" role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <div>
                <h2>{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                <p>Slug do hệ thống quản lý, không cần nhập thủ công.</p>
              </div>
              <button type="button" className="admin-modal-close" aria-label="Đóng form" onClick={closeFormModal}>
                <X size={20} />
              </button>
            </div>
            <form className="admin-category-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  <span>Tên sản phẩm</span>
                  <input name="name" value={form.name} onChange={updateField} required />
                </label>
                <label>
                  <span>Thương hiệu</span>
                  <input name="brand" value={form.brand} onChange={updateField} required />
                </label>
                <label>
                  <span>SKU</span>
                  <input name="sku" value={form.sku} onChange={updateField} required />
                </label>
                <label>
                  <span>Danh mục</span>
                  <select name="category_id" value={form.category_id} onChange={updateField} required>
                    <option value="">Chọn danh mục</option>
                    {activeCategories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Giá bán</span>
                  <input name="price" type="number" min="0" value={form.price} onChange={updateField} required />
                </label>
                <label>
                  <span>Giá gốc</span>
                  <input name="original_price" type="number" min="0" value={form.original_price} onChange={updateField} />
                </label>
                <label>
                  <span>Tồn kho</span>
                  <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={updateField} required />
                </label>
                <label>
                  <span>Tình trạng</span>
                  <input name="condition" value={form.condition} onChange={updateField} />
                </label>
                <label>
                  <span>Badge</span>
                  <input name="badge" value={form.badge} onChange={updateField} />
                </label>
                <label className="span-2">
                  <span>Mô tả ngắn</span>
                  <input name="short_description" value={form.short_description} onChange={updateField} />
                </label>
                <label className="span-2">
                  <span>Mô tả chi tiết</span>
                  <textarea name="description" value={form.description} onChange={updateField} rows={3} />
                </label>
                <div className="admin-spec-editor span-2">
                  <div className="admin-spec-head">
                    <span>Thông số kỹ thuật</span>
                    <button type="button" className="admin-btn light" onClick={addSpecRow}>
                      <ListPlus size={18} /> Thêm dòng
                    </button>
                  </div>
                  <div className="admin-spec-rows">
                    {form.specs.map((spec, index) => (
                      <div className="admin-spec-row" key={index}>
                        <input
                          value={spec.spec_name}
                          onChange={(event) => updateSpec(index, 'spec_name', event.target.value)}
                          placeholder="VD: Cảm biến"
                        />
                        <input
                          value={spec.spec_value}
                          onChange={(event) => updateSpec(index, 'spec_value', event.target.value)}
                          placeholder="VD: Full-frame CMOS 33MP"
                        />
                        <button type="button" aria-label="Xóa thông số" onClick={() => removeSpecRow(index)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <small>Mỗi dòng gồm tên thông số và giá trị, ví dụ: ISO / 100 - 51,200.</small>
                </div>
                <label className="span-2 admin-file-control">
                  <span className="field-label">Ảnh sản phẩm</span>
                  <span className="admin-file-trigger">
                    <ImagePlus size={20} />
                    {isUploading ? 'Đang upload...' : 'Chọn ảnh từ máy'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
                {form.image_url && (
                  <div className="admin-upload-preview span-2">
                    <img src={form.image_url} alt="Ảnh sản phẩm đã upload" />
                    <small>Ảnh đã sẵn sàng để lưu cùng sản phẩm.</small>
                  </div>
                )}
                <label className="checkbox-line admin-compact-check">
                  <input name="is_active" type="checkbox" checked={form.is_active} onChange={updateField} />
                  <span>Đang bán</span>
                </label>
              </div>
              {message && <p className="form-success">{message}</p>}
              {error && <p className="form-error">{error}</p>}
              <div className="profile-form-actions">
                <button className="admin-btn primary" type="submit" disabled={isLoading || isUploading}>
                  <Save size={20} /> {editingId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
                <button className="admin-btn light" type="button" onClick={closeFormModal}>
                  Hủy
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="admin-filter-card product-filter">
        <label className="admin-inline-select">
          <Filter size={24} />
          <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
        <label className="admin-inline-select">
          <SlidersHorizontal size={24} />
          <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="price-high">Giá cao nhất</option>
            <option value="price-low">Giá thấp nhất</option>
            <option value="stock">Tồn kho</option>
          </select>
          <ChevronDown size={18} />
        </label>
        <label className="admin-inline-select">
          <Archive size={24} />
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Đã ẩn</option>
          </select>
          <ChevronDown size={18} />
        </label>
      </section>

      <section className="admin-table-card products-table-card has-row-menu">
        <div className="admin-product-table admin-table-head-row">
          <span>Hình ảnh</span>
          <span>Sản phẩm</span>
          <span>Danh mục</span>
          <span>Giá bán</span>
          <span>Tồn kho</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>
        {products.map((product) => (
          <div className="admin-product-table admin-table-row" key={product.productId || product.id}>
            <img src={product.image} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <small>SKU: {product.sku}</small>
            </div>
            <div className="tag-stack">
              <span>{product.categoryName || 'Chưa phân loại'}</span>
            </div>
            <b>{formatPrice(product.price)}</b>
            <span>{product.stock}</span>
            <span className={product.is_active ? 'admin-stock in' : 'admin-stock out'}>
              {product.is_active ? 'Đang bán' : 'Đã ẩn'}
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                className="admin-row-action"
                aria-label="Mở thao tác sản phẩm"
                onClick={() => toggleActionMenu(product.productId || product.apiId)}
              >
                <MoreVertical size={21} />
              </button>
              {openActionId === (product.productId || product.apiId) && (
                <div className="admin-row-menu">
                  <button type="button" onClick={() => startEdit(product)}>
                    Chỉnh sửa
                  </button>
                  <button type="button" onClick={() => handleToggleProductStatus(product)}>
                    {product.is_active ? 'Xóa sản phẩm' : 'Kích hoạt lại'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && !isLoading && (
          <div className="empty-state inline">
            <h2>Chưa có sản phẩm</h2>
            <p>Tạo sản phẩm đầu tiên để hiển thị trên cửa hàng.</p>
          </div>
        )}
        <div className="admin-table-footer">
          <p>
            Hiển thị <strong>{products.length}</strong> của <strong>{pagination.total}</strong> sản phẩm
          </p>
          <div className="admin-pagination">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="active">{filters.page}</button>
            <button
              type="button"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => updateFilter('page', Math.min(pagination.totalPages, filters.page + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
