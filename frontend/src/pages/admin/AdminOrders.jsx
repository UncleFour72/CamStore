import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Truck,
  X,
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

const paymentMethodLabels = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  pos_card: 'Thẻ/POS',
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
const prepaidOnlineMethods = ['vnpay', 'momo', 'bank_transfer'];
const pageSize = 10;

const emptyInstoreOrder = {
  customer_name: '',
  customer_phone: '',
  payment_method: 'cash',
  note: '',
  items: [{ product_id: '', quantity: 1 }],
};

const isUnpaidPrepaidOnlineOrder = (order) => {
  return (
    order.purchase_channel === 'online' &&
    prepaidOnlineMethods.includes(order.paymentMethod) &&
    !order.isPaid
  );
};

const getStatusOptionsForOrder = (order) => {
  if (isUnpaidPrepaidOnlineOrder(order) && order.status === 'pending') {
    return ['pending', 'cancelled'];
  }

  return statusTransitions[order.status] || [order.status];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ page: 1, status: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [instoreOrder, setInstoreOrder] = useState(emptyInstoreOrder);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const productById = useMemo(() => {
    return new Map(products.map((product) => [String(product.productId), product]));
  }, [products]);

  const instoreTotal = useMemo(() => {
    return instoreOrder.items.reduce((total, item) => {
      const product = productById.get(String(item.product_id));
      return total + Number(product?.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [instoreOrder.items, productById]);

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

  async function loadProducts() {
    if (products.length > 0 || isProductLoading) {
      return;
    }

    setIsProductLoading(true);

    try {
      const data = await adminService.getProducts({ page: 1, limit: 100, status: 'active' });
      setProducts(data.items);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setIsProductLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.status]);

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  }

  function openInstoreModal() {
    setError('');
    setMessage('');
    setInstoreOrder(emptyInstoreOrder);
    setIsCreateOpen(true);
    loadProducts();
  }

  function updateInstoreField(field, value) {
    setInstoreOrder((current) => ({ ...current, [field]: value }));
  }

  function updateInstoreItem(index, field, value) {
    setInstoreOrder((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value,
            }
          : item
      ),
    }));
  }

  function addInstoreItem() {
    setInstoreOrder((current) => ({
      ...current,
      items: [...current.items, { product_id: '', quantity: 1 }],
    }));
  }

  function removeInstoreItem(index) {
    setInstoreOrder((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function createInstoreOrder(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const items = instoreOrder.items
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.product_id && item.quantity > 0);

    if (items.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm cho đơn tại quầy.');
      return;
    }

    setIsSavingOrder(true);

    try {
      await adminService.createInstoreOrder({
        customer_name: instoreOrder.customer_name.trim(),
        customer_phone: instoreOrder.customer_phone.trim(),
        payment_method: instoreOrder.payment_method,
        note: instoreOrder.note.trim(),
        items,
      });
      setIsCreateOpen(false);
      setMessage('Đã tạo đơn hàng tại quầy.');
      await loadOrders(filters);
    } catch (createError) {
      setError(createError.response?.data?.message || 'Không thể tạo đơn hàng tại quầy');
    } finally {
      setIsSavingOrder(false);
    }
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
          <p>Theo dõi và xử lý các đơn online lẫn đơn bán trực tiếp tại cửa hàng.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn primary" onClick={openInstoreModal}>
            <Plus size={20} /> Tạo đơn tại quầy
          </button>
          <button type="button" className="admin-btn light">
            <Download size={20} /> Xuất báo cáo
          </button>
        </div>
      </section>

      <section className="admin-order-stats">
        {orderStats.map(([label, value, Icon, tone]) => (
          <article key={label}>
            <span className={`admin-round-icon ${tone}`}>
              <Icon size={24} />
            </span>
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
        <button type="button" className="ghost" onClick={() => updateFilter('status', '')}>
          Xóa lọc
        </button>
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
        {orders.map((order) => {
          const allowedStatuses = getStatusOptionsForOrder(order);
          const prepaidLocked = isUnpaidPrepaidOnlineOrder(order);

          return (
            <div className="admin-orders-table admin-table-row" key={order.orderId}>
              <a href="/orders">{order.orderNumber}</a>
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
              <span
                className={`admin-status ${
                  order.status === 'cancelled'
                    ? 'cancel'
                    : order.status === 'delivered'
                      ? 'done'
                      : order.status === 'shipping'
                        ? 'shipping'
                        : 'new'
                }`}
              >
                {order.statusLabel}
              </span>
              <label className="admin-status-select" title={prepaidLocked ? 'Đơn online cần thanh toán xong trước khi xử lý' : ''}>
                <select
                  value={order.status}
                  onChange={(event) => handleStatusChange(order, event.target.value)}
                  disabled={isLoading || order.status === 'cancelled' || order.status === 'delivered'}
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
        {orders.length === 0 && !isLoading && (
          <div className="empty-state inline">
            <h2>Chưa có đơn hàng</h2>
            <p>Các đơn mới sẽ xuất hiện tại đây sau khi khách checkout hoặc admin tạo đơn tại quầy.</p>
          </div>
        )}
        <div className="admin-table-footer">
          <p>
            Hiển thị {orders.length} trên {pagination.total} đơn hàng
          </p>
          <div className="admin-pagination">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="active">
              {filters.page}
            </button>
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
          <h2>
            <BarChart3 size={24} /> Phân bổ trạng thái đơn hàng
          </h2>
          <div className="admin-bars">
            {statusOptions.slice(0, 5).map((status) => {
              const max = Math.max(1, ...statusOptions.map((item) => stats[item] || 0));
              return (
                <span
                  key={status}
                  style={{ height: `${Math.max(8, ((stats[status] || 0) / max) * 100)}%` }}
                />
              );
            })}
          </div>
        </article>
        <article className="admin-card admin-activity-card">
          <h2>
            <RotateCcw size={24} /> Hoạt động mới nhất
          </h2>
          {orders.slice(0, 2).map((order) => (
            <div key={order.orderId}>
              <span>
                <Truck size={22} />
              </span>
              <p>
                <strong>{order.orderNumber}</strong>
                {order.customerName || 'Khách hàng'} - {order.statusLabel}
              </p>
            </div>
          ))}
        </article>
      </section>

      {isCreateOpen && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-product-modal">
            <div className="admin-modal-head">
              <div>
                <h2>Tạo đơn tại quầy</h2>
                <p>Nhập thông tin khách mua trực tiếp và sản phẩm đã bán tại cửa hàng.</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="admin-category-form" onSubmit={createInstoreOrder}>
              <label>
                Tên khách hàng
                <input
                  value={instoreOrder.customer_name}
                  onChange={(event) => updateInstoreField('customer_name', event.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </label>
              <label>
                Số điện thoại
                <input
                  value={instoreOrder.customer_phone}
                  onChange={(event) => updateInstoreField('customer_phone', event.target.value)}
                  placeholder="VD: 0909123456"
                  required
                />
              </label>
              <label>
                Phương thức thanh toán
                <select
                  value={instoreOrder.payment_method}
                  onChange={(event) => updateInstoreField('payment_method', event.target.value)}
                >
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Ghi chú
                <textarea
                  value={instoreOrder.note}
                  onChange={(event) => updateInstoreField('note', event.target.value)}
                  rows={2}
                  placeholder="Số serial, ghi chú bảo hành hoặc yêu cầu thêm..."
                />
              </label>

              <div className="span-2 admin-spec-editor">
                <div className="admin-spec-head">
                  <span>Sản phẩm bán tại quầy</span>
                  <button type="button" onClick={addInstoreItem}>
                    <Plus size={16} /> Thêm dòng
                  </button>
                </div>
                <div className="admin-spec-rows">
                  {instoreOrder.items.map((item, index) => {
                    const product = productById.get(String(item.product_id));

                    return (
                      <div className="admin-spec-row admin-instore-row" key={`${index}-${item.product_id || 'new'}`}>
                        <select
                          value={item.product_id}
                          onChange={(event) => updateInstoreItem(index, 'product_id', event.target.value)}
                          required
                        >
                          <option value="">{isProductLoading ? 'Đang tải sản phẩm...' : 'Chọn sản phẩm'}</option>
                          {products.map((productOption) => (
                            <option key={productOption.productId} value={productOption.productId}>
                              {productOption.fullName} - {formatPrice(productOption.price)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateInstoreItem(index, 'quantity', event.target.value)}
                          required
                        />
                        <button type="button" onClick={() => removeInstoreItem(index)} disabled={instoreOrder.items.length === 1}>
                          <Trash2 size={16} />
                        </button>
                        <small>{product ? formatPrice(product.price * Number(item.quantity || 1)) : 'Chưa chọn sản phẩm'}</small>
                      </div>
                    );
                  })}
                </div>
                <small>Tổng đơn tại quầy: {formatPrice(instoreTotal)}</small>
              </div>

              <div className="admin-form-actions span-2">
                <button type="button" className="admin-btn light" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn primary" disabled={isSavingOrder || isProductLoading}>
                  <Save size={19} /> {isSavingOrder ? 'Đang tạo...' : 'Tạo đơn'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
