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

const tierLabels = {
  diamond: 'VIP DIAMOND',
  gold: 'VIP GOLD',
  silver: 'VIP SILVER',
  standard: 'THÀNH VIÊN',
  member: 'THÀNH VIÊN',
};

const tierClasses = {
  diamond: 'gold',
  gold: 'gold',
  silver: 'silver',
  standard: 'member',
  member: 'member',
};

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';

const formatPercent = (value) => `${Number(value || 0).toLocaleString('vi-VN')}%`;

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
          setError(err.response?.data?.message || 'Không tải được danh sách khách hàng.');
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
      setNotice(customer.is_active ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở lại tài khoản khách hàng.');
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
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái khách hàng.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Theo dõi thông tin, lịch sử mua hàng và trạng thái tài khoản khách hàng.</p>
        </div>
        <a className="admin-btn primary" href="/admin/orders">
          <UserPlus size={22} /> Xem đơn hàng
        </a>
      </section>

      <section className="admin-customer-filters">
        <div className="admin-filter-card customers-search">
          <label>
            <Search size={21} />
            <input
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              value={search}
              onChange={handleSearchChange}
            />
          </label>
          <label className="admin-inline-select">
            <ShieldCheck size={20} />
            <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
            <ChevronDown size={18} />
          </label>
        </div>
        <div className="loyal-card">
          <span>
            <Star size={24} />
          </span>
          <div>
            <strong>Khách hàng thân thiết</strong>
            <small>VIP từ 50,000,000đ tổng chi tiêu</small>
          </div>
          <button
            type="button"
            aria-label="Đặt lại bộ lọc khách hàng"
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
          <span>Khách hàng</span>
          <span>Liên hệ</span>
          <span>Tổng chi tiêu</span>
          <span>Đơn hàng</span>
          <span>Ngày đăng ký</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div className="admin-empty-row">Chưa có khách hàng phù hợp với bộ lọc.</div>
        ) : (
          customers.map((customer) => {
            const tier = customer.tier || 'member';
            const isUpdating = updatingId === customer.id;

            return (
              <div className="admin-customers-table admin-table-row" key={customer.id}>
                <div className="admin-customer-profile">
                  <img src={customer.avatar_url || fallbackAvatar} alt={customer.name} />
                  <div>
                    <strong>{customer.name}</strong>
                    <span className={`customer-tier ${tierClasses[tier] || 'member'}`}>
                      {tierLabels[tier] || 'THÀNH VIÊN'}
                    </span>
                  </div>
                </div>
                <div>
                  <p>{customer.email}</p>
                  <small>{customer.phone || 'Chưa cập nhật số điện thoại'}</small>
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
                  {customer.is_active ? 'Khóa' : 'Mở'}
                </button>
              </div>
            );
          })
        )}

        <div className="admin-table-footer">
          <p>
            Đang hiển thị {customers.length} / {pagination.total} khách hàng
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
            Tỷ lệ giữ chân <BarChart3 size={24} />
          </span>
          <strong>{formatPercent(metrics.retention_rate)}</strong>
          <p>{Number(metrics.repeat_customers || 0).toLocaleString('vi-VN')} khách quay lại mua hàng</p>
        </article>
        <article>
          <span>
            Giá trị đơn trung bình <BarChart3 size={24} />
          </span>
          <strong>{formatPrice(metrics.average_order_value || 0)}</strong>
          <p>Tính trên các đơn không bị hủy</p>
        </article>
        <article>
          <span>
            Tổng khách hàng <UserPlus size={24} />
          </span>
          <strong>{Number(metrics.total_customers || pagination.total || 0).toLocaleString('vi-VN')}</strong>
          <p>{Number(metrics.customers_with_orders || 0).toLocaleString('vi-VN')} khách đã phát sinh đơn</p>
        </article>
      </section>
    </main>
  );
}
