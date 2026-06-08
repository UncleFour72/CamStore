import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Save,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';

const pageSize = 10;

const emptyForm = {
  order_id: '',
  product_id: '',
  product_name: '',
  serial_number: '',
  customer_name: '',
  customer_phone: '',
  duration_months: 12,
  start_date: '',
  end_date: '',
  status: 'active',
};

const statusLabels = {
  active: 'Đang bảo hành',
  expired: 'Hết hạn',
  claimed: 'Đã tiếp nhận',
  voided: 'Đã hủy',
};

const statusOptions = ['active', 'expired', 'claimed', 'voided'];

const toDateInput = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const cleanPayload = (payload) => {
  return Object.entries(payload).reduce((result, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      result[key] = value;
    }

    return result;
  }, {});
};

export default function AdminWarranty() {
  const [warranties, setWarranties] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serialStatus, setSerialStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [serialDrafts, setSerialDrafts] = useState({});
  const [savingSerialId, setSavingSerialId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: pageSize };

    if (search.trim()) {
      next.search = search.trim();
    }

    if (status) {
      next.status = status;
    }

    if (serialStatus) {
      next.serial_status = serialStatus;
    }

    return next;
  }, [page, search, status, serialStatus]);

  const loadWarranties = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminService.getWarranties(params);
      setWarranties(data.items);
      setSerialDrafts(
        data.items.reduce((result, warranty) => {
          result[warranty.id] = warranty.serialNumberRaw || '';
          return result;
        }, {})
      );
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách bảo hành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNotice('');
    setError('');
  };

  const startEdit = (warranty) => {
    setEditingId(warranty.id);
    setForm({
      order_id: warranty.order_id || '',
      product_id: warranty.product_id || '',
      product_name: warranty.product_name || '',
      serial_number: warranty.serial_number || '',
      customer_name: warranty.customer_name || '',
      customer_phone: warranty.customer_phone || '',
      duration_months: warranty.duration_months || 12,
      start_date: toDateInput(warranty.start_date),
      end_date: toDateInput(warranty.end_date),
      status: warranty.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildCreatePayload = () =>
    cleanPayload({
      ...form,
      order_id: Number(form.order_id),
      product_id: Number(form.product_id),
      duration_months: Number(form.duration_months || 12),
    });

  const buildUpdatePayload = () =>
    cleanPayload({
      serial_number: form.serial_number,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      duration_months: Number(form.duration_months || 12),
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      if (editingId) {
        await adminService.updateWarranty(editingId, buildUpdatePayload());
        setNotice('Đã cập nhật phiếu bảo hành.');
      } else {
        await adminService.createWarranty(buildCreatePayload());
        setNotice('Đã tạo phiếu bảo hành mới.');
      }

      resetForm();
      await loadWarranties();
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được phiếu bảo hành.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (warranty, nextStatus) => {
    setError('');
    setNotice('');

    try {
      await adminService.updateWarranty(warranty.id, { status: nextStatus });
      setNotice('Đã cập nhật trạng thái bảo hành.');
      await loadWarranties();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái bảo hành.');
    }
  };

  const updateSerialDraft = (warrantyId, value) => {
    setSerialDrafts((current) => ({
      ...current,
      [warrantyId]: value,
    }));
  };

  const saveSerialNumber = async (warranty) => {
    setError('');
    setNotice('');
    setSavingSerialId(warranty.id);

    try {
      await adminService.updateWarranty(warranty.id, {
        serial_number: serialDrafts[warranty.id] || '',
      });
      setNotice('Đã cập nhật serial bảo hành.');
      await loadWarranties();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được serial bảo hành.');
    } finally {
      setSavingSerialId(null);
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý bảo hành</h1>
          <p>Tra cứu, tạo và cập nhật trạng thái phiếu bảo hành cho sản phẩm đã bán.</p>
        </div>
        <button type="button" className="admin-btn primary large" onClick={resetForm}>
          <Plus size={22} /> Tạo phiếu mới
        </button>
      </section>

      <section className="admin-table-card admin-category-form-card">
        <form className="admin-category-form" onSubmit={handleSubmit}>
          <label>
            Mã đơn hàng nội bộ
            <input
              disabled={Boolean(editingId)}
              value={form.order_id}
              onChange={(event) => updateField('order_id', event.target.value)}
              placeholder="VD: 1024"
              required={!editingId}
            />
          </label>
          <label>
            Mã sản phẩm
            <input
              disabled={Boolean(editingId)}
              value={form.product_id}
              onChange={(event) => updateField('product_id', event.target.value)}
              placeholder="VD: 15"
              required={!editingId}
            />
          </label>
          <label>
            Tên sản phẩm
            <input
              disabled={Boolean(editingId)}
              value={form.product_name}
              onChange={(event) => updateField('product_name', event.target.value)}
              placeholder="Sony A7 IV Body"
              required={!editingId}
            />
          </label>
          <label>
            Serial number
            <input
              value={form.serial_number}
              onChange={(event) => updateField('serial_number', event.target.value)}
              placeholder="SN-..."
            />
          </label>
          <label>
            Khách hàng
            <input
              value={form.customer_name}
              onChange={(event) => updateField('customer_name', event.target.value)}
              placeholder="Tên khách hàng"
            />
          </label>
          <label>
            Số điện thoại
            <input
              value={form.customer_phone}
              onChange={(event) => updateField('customer_phone', event.target.value)}
              placeholder="09..."
            />
          </label>
          <label>
            Thời hạn (tháng)
            <input
              type="number"
              min="1"
              value={form.duration_months}
              onChange={(event) => updateField('duration_months', event.target.value)}
            />
          </label>
          <label>
            Ngày bắt đầu
            <input type="date" value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} />
          </label>
          <label>
            Ngày hết hạn
            <input type="date" value={form.end_date} onChange={(event) => updateField('end_date', event.target.value)} />
          </label>
          <label>
            Trạng thái
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {statusLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <Save size={20} /> {editingId ? 'Lưu thay đổi' : 'Tạo phiếu'}
            </button>
            {editingId && (
              <button className="admin-btn light" type="button" onClick={resetForm}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-filter-card product-filter">
        <label>
          <Search size={22} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã BH, đơn hàng, sản phẩm, serial hoặc SĐT..."
          />
        </label>
        <label className="admin-inline-select">
          <ShieldCheck size={22} />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabels[option]}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
        <label className="admin-inline-select">
          <ShieldCheck size={22} />
          <select
            value={serialStatus}
            onChange={(event) => {
              setSerialStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả serial</option>
            <option value="missing">Thiếu serial</option>
            <option value="filled">Đã có serial</option>
          </select>
          <ChevronDown size={18} />
        </label>
      </section>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-warranty-table admin-table-head-row">
          <span>Phiếu BH</span>
          <span>Khách hàng</span>
          <span>Sản phẩm</span>
          <span>Serial</span>
          <span>Hạn bảo hành</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Đang tải phiếu bảo hành...</div>
        ) : warranties.length === 0 ? (
          <div className="admin-empty-row">Chưa có phiếu bảo hành phù hợp.</div>
        ) : (
          warranties.map((warranty) => (
            <div className="admin-warranty-table admin-table-row" key={warranty.id}>
              <div>
                <strong>{warranty.code}</strong>
                <small>{warranty.orderNumber}</small>
              </div>
              <div>
                <p>{warranty.customerName}</p>
                <small>{warranty.customerPhone}</small>
              </div>
              <div>
                <p>{warranty.productName}</p>
                <small>ID #{warranty.product_id}</small>
              </div>
              <div className={warranty.hasSerial ? 'admin-serial-cell' : 'admin-serial-cell missing'}>
                <input
                  value={serialDrafts[warranty.id] ?? ''}
                  onChange={(event) => updateSerialDraft(warranty.id, event.target.value)}
                  placeholder="Nhập serial"
                />
                <button
                  type="button"
                  className="admin-btn light"
                  disabled={savingSerialId === warranty.id}
                  onClick={() => saveSerialNumber(warranty)}
                >
                  {savingSerialId === warranty.id ? 'Lưu...' : 'Lưu'}
                </button>
              </div>
              <span>
                <CalendarDays size={16} /> {warranty.endDate}
              </span>
              <label className="admin-status-select">
                <select value={warranty.status} onChange={(event) => updateStatus(warranty, event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {statusLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="admin-row-action" aria-label="Sửa" onClick={() => startEdit(warranty)}>
                <Edit3 size={20} />
              </button>
            </div>
          ))
        )}

        <div className="admin-table-footer">
          <p>
            Đang hiển thị {warranties.length} / {pagination.total} phiếu bảo hành
          </p>
          <div className="admin-pagination">
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="active">
              {pagination.page}
            </button>
            <span>/</span>
            <button type="button" disabled>
              {pagination.totalPages}
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
