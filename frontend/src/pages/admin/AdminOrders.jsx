import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { formatPrice } from '../../utils/helpers.js';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusOptions = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const statusTransitions = {
  pending: ['pending', 'confirmed', 'processing', 'cancelled'],
  confirmed: ['confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
  processing: ['processing', 'shipping', 'delivered', 'cancelled'],
  shipping: ['shipping', 'delivered', 'cancelled'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};
const pageSize = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ page: 1, status: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const orderStats = useMemo(
    () => [
      ['Chờ xác nhận', stats.pending || 0, ClipboardList, 'blue'],
      ['Đang giao', stats.shipping || 0, Truck, 'orange'],
      ['Hoàn thành', stats.delivered || 0, CheckCircle2, 'indigo'],
      ['Đã hủy', stats.cancelled || 0, XCircle, 'red'],
    ],
    [stats]
  );

  async function loadOrders(nextFilters = filters) {
    setIsLoading(true);
    setError('');

    try {
      const [ordersData, statusData] = await Promise.all([
        adminService.getOrders({
          page: nextFilters.page,
          limit: pageSize,
          status: nextFilters.status,
        }),
        adminService.getOrderStatusStats(),
      ]);

      setOrders(ordersData.items);
      setPagination(ordersData);
      setStats(statusData.statuses || {});
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không thể tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(filters);
  }, [filters.page, filters.status]);

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }

  async function handleStatusChange(order, status) {
    if (order.status === status) {
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await adminService.updateOrderStatus(order.orderId, status, `Admin changed status to ${status}`);
      setMessage(`Đơn ${order.orderNumber} đã chuyển sang ${statusLabels[status]}.`);
      await loadOrders(filters);
    } catch (statusError) {
      setError(statusError.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi và xử lý các đơn hàng từ Order Service.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn light"><Download size={20} /> Xuất báo cáo</button>
        </div>
      </section>

      <section className="admin-order-stats">
        {orderStats.map(([label, value, Icon, tone]) => (
          <article key={label}>
            <span className={`admin-round-icon ${tone}`}><Icon size={24} /></span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-filter-card orders-filter">
        <span>Trạng thái:</span>
        <label className="admin-inline-select">
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
        <button type="button" className="ghost" onClick={() => updateFilter('status', '')}>Xóa lọc</button>
      </section>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-orders-table admin-table-head-row">
          <span>Mã đơn hàng</span>
          <span>Khách hàng</span>
          <span>Ngày đặt</span>
          <span>Tổng tiền</span>
          <span>Thanh toán</span>
          <span>Trạng thái</span>
          <span>Hành động</span>
        </div>
        {orders.map((order) => (
          <div className="admin-orders-table admin-table-row" key={order.orderId}>
            <a href={`/orders`}>{order.orderNumber}</a>
            <div className="admin-customer-cell">
              <span>{String(order.customerName || 'CS').slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{order.customerName || 'Khách hàng'}</strong>
                <small>{order.phoneNumber || 'Chưa có SĐT'}</small>
              </div>
            </div>
            <span>{order.date}</span>
            <b>{formatPrice(order.total)}</b>
            <span className={order.isPaid ? 'payment-badge paid' : 'payment-badge'}>
              {order.paymentMethodLabel}: {order.paymentStatusLabel}
            </span>
            <span className={`admin-status ${order.status === 'cancelled' ? 'cancel' : order.status === 'delivered' ? 'done' : order.status === 'shipping' ? 'shipping' : 'new'}`}>
              {order.statusLabel}
            </span>
            <label className="admin-status-select">
              <select
                value={order.status}
                onChange={(event) => handleStatusChange(order, event.target.value)}
                disabled={isLoading || order.status === 'cancelled' || order.status === 'delivered'}
              >
                {(statusTransitions[order.status] || [order.status]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        {orders.length === 0 && !isLoading && (
          <div className="empty-state inline">
            <h2>Chưa có đơn hàng</h2>
            <p>Các đơn mới sẽ xuất hiện tại đây sau khi khách checkout.</p>
          </div>
        )}
        <div className="admin-table-footer">
          <p>Hiển thị {orders.length} trên {pagination.total} đơn hàng</p>
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

      <section className="admin-order-bottom">
        <article className="admin-card admin-bar-card">
          <h2><BarChart3 size={24} /> Phân bổ trạng thái đơn hàng</h2>
          <div className="admin-bars">
            {statusOptions.slice(0, 5).map((status) => {
              const max = Math.max(1, ...statusOptions.map((item) => stats[item] || 0));
              return <span key={status} style={{ height: `${Math.max(8, ((stats[status] || 0) / max) * 100)}%` }} />;
            })}
          </div>
        </article>
        <article className="admin-card admin-activity-card">
          <h2><RotateCcw size={24} /> Hoạt động mới nhất</h2>
          {orders.slice(0, 2).map((order) => (
            <div key={order.orderId}>
              <span><Truck size={22} /></span>
              <p><strong>{order.orderNumber}</strong>{order.customerName || 'Khách hàng'} - {order.statusLabel}</p>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
