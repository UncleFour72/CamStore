import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldOff,
  Star,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { formatPrice } from '../../utils/helpers.js';

const pageSize = 10;

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: pageSize };

    if (search.trim()) {
      next.search = search.trim();
    }

    if (status) {
      next.is_active = status === 'active';
    }

    return next;
  }, [page, search, status]);

  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminService.getCustomers(params);

        if (!ignore) {
          setCustomers(data.customers);
          setMetrics(data.metrics || {});
          setPagination({
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            totalPages: data.totalPages,
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Khong tai duoc danh sach khach hang.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      ignore = true;
    };
  }, [params]);

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const toggleCustomerStatus = async (customer) => {
    setUpdatingId(customer.id);
    setNotice('');
    setError('');

    try {
      await adminService.updateUserStatus(customer.id, !customer.is_active);
      setNotice(customer.is_active ? 'Da khoa tai khoan khach hang.' : 'Da mo lai tai khoan khach hang.');
      const data = await adminService.getCustomers(params);
      setCustomers(data.customers);
      setMetrics(data.metrics || {});
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Khong cap nhat duoc trang thai khach hang.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quan ly khach hang</h1>
          <p>Theo doi thong tin va trang thai tai khoan khach hang tu user-service.</p>
        </div>
        <a className="admin-btn primary" href="/admin/orders">
          <UserPlus size={22} /> Xem don hang
        </a>
      </section>

      <section className="admin-customer-filters">
        <div className="admin-filter-card customers-search">
          <label>
            <Search size={21} />
            <input
              placeholder="Tim theo ten, email hoac so dien thoai..."
              value={search}
              onChange={handleSearchChange}
            />
          </label>
          <label className="admin-inline-select">
            <ShieldCheck size={20} />
            <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
              <option value="">Tat ca trang thai</option>
              <option value="active">Dang hoat dong</option>
              <option value="inactive">Da khoa</option>
            </select>
            <ChevronDown size={18} />
          </label>
        </div>
        <div className="loyal-card">
          <span>
            <Star size={24} />
          </span>
          <div>
            <strong>Tai khoan khach hang</strong>
            <small>Du lieu lay truc tiep tu user-service</small>
          </div>
          <button
            type="button"
            aria-label="Dat lai bo loc khach hang"
            onClick={() => {
              setSearch('');
              handleStatusChange('');
            }}
          />
        </div>
      </section>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-customers-table admin-table-head-row">
          <span>Khach hang</span>
          <span>Lien he</span>
          <span>Tong chi tieu</span>
          <span>Don hang</span>
          <span>Ngay dang ky</span>
          <span>Thao tac</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Dang tai danh sach khach hang...</div>
        ) : customers.length === 0 ? (
          <div className="admin-empty-row">Chua co khach hang phu hop voi bo loc.</div>
        ) : (
          customers.map((customer) => {
            const isUpdating = updatingId === customer.id;

            return (
              <div className="admin-customers-table admin-table-row" key={customer.id}>
                <div className="admin-customer-profile">
                  <img src={customer.avatar_url || fallbackAvatar} alt={customer.name} />
                  <div>
                    <strong>{customer.name}</strong>
                    <span className={`customer-tier ${customer.is_active ? 'member' : 'silver'}`}>
                      {customer.is_active ? 'DANG HOAT DONG' : 'DA KHOA'}
                    </span>
                  </div>
                </div>
                <div>
                  <p>{customer.email}</p>
                  <small>{customer.phone || 'Chua cap nhat so dien thoai'}</small>
                </div>
                <b>{formatPrice(customer.totalSpent)}</b>
                <span className="order-count-pill">{customer.ordersCount}</span>
                <span>{customer.registeredAt || '-'}</span>
                <button
                  type="button"
                  className={customer.is_active ? 'admin-btn danger small' : 'admin-btn light small'}
                  disabled={isUpdating}
                  onClick={() => toggleCustomerStatus(customer)}
                >
                  {customer.is_active ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                  {customer.is_active ? 'Khoa' : 'Mo'}
                </button>
              </div>
            );
          })
        )}

        <div className="admin-table-footer">
          <p>
            Dang hien thi {customers.length} / {pagination.total} khach hang
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

      <section className="customer-metric-grid">
        <article>
          <span>
            Tai khoan dang hoat dong <BarChart3 size={24} />
          </span>
          <strong>{Number(metrics.active_customers || 0).toLocaleString('vi-VN')}</strong>
          <p>Khach hang co the dang nhap va mua hang</p>
        </article>
        <article>
          <span>
            Tai khoan da khoa <BarChart3 size={24} />
          </span>
          <strong>{Number(metrics.inactive_customers || 0).toLocaleString('vi-VN')}</strong>
          <p>Khach hang tam thoi khong the dang nhap</p>
        </article>
        <article>
          <span>
            Tong khach hang <UserPlus size={24} />
          </span>
          <strong>{Number(metrics.total_customers || pagination.total || 0).toLocaleString('vi-VN')}</strong>
          <p>Du lieu lay tu bang users</p>
        </article>
      </section>
    </main>
  );
}
