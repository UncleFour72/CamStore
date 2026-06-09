import {
  Banknote,
  CalendarDays,
  Download,
  ShoppingBag,
  Target,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { formatPrice } from '../../utils/helpers.js';

const fallbackProductImage =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=120&q=80';

const statusTones = {
  pending: 'waiting',
  confirmed: 'paid',
  processing: 'pending',
  shipping: 'shipping',
  delivered: 'done',
  cancelled: 'waiting',
};

const formatDateLabel = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
};

const buildOrderName = (order) => {
  const names = (order.items || []).map((item) => item.productName).filter(Boolean);

  if (names.length === 0) {
    return order.customerName || 'Đơn hàng mới';
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names[0]} và ${names.length - 1} sản phẩm khác`;
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadSummary = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminService.getDashboardSummary({ days: 7, recent_limit: 5 });

        if (!ignore) {
          setSummary(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Không tải được dữ liệu tổng quan.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      ignore = true;
    };
  }, []);

  const metrics = summary?.metrics || {};
  const chart = summary?.revenue_chart || [];
  const maxRevenue = useMemo(() => Math.max(...chart.map((point) => Number(point.revenue || 0)), 0), [chart]);

  const metricCards = [
    {
      label: 'Doanh thu tháng',
      value: formatPrice(metrics.monthly_revenue || 0),
      change: 'Đã giao + đã thanh toán',
      icon: Banknote,
      tone: 'blue',
    },
    {
      label: 'Đơn ghi nhận doanh thu',
      value: Number(metrics.completed_orders_count ?? metrics.orders_count ?? 0).toLocaleString('vi-VN'),
      change: `${Number(metrics.created_orders_count || 0).toLocaleString('vi-VN')} đơn đã tạo`,
      icon: ShoppingBag,
      tone: 'indigo',
    },
    {
      label: 'Giá trị đơn trung bình',
      value: formatPrice(metrics.average_order_value || 0),
      change: 'Tính trên đơn ghi nhận',
      icon: Target,
      tone: 'orange',
    },
    {
      label: 'Khách hàng mới',
      value: Number(metrics.new_customers_count || 0).toLocaleString('vi-VN'),
      change: 'Tài khoản customer',
      icon: UserPlus,
      tone: 'red',
    },
  ];

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Chào mừng trở lại! Đây là tóm tắt hoạt động kinh doanh lấy trực tiếp từ backend.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn light">
            <CalendarDays size={20} /> 7 ngày qua
          </button>
          <button type="button" className="admin-btn primary">
            <Download size={20} /> Xuất báo cáo
          </button>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="admin-metric-grid">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="admin-metric-card" key={metric.label}>
              <div className={`admin-metric-icon ${metric.tone}`}>
                <Icon size={25} />
              </div>
              <span className="metric-change up">
                {metric.change} <TrendingUp size={17} />
              </span>
              <p>{metric.label}</p>
              <strong>{loading ? '...' : metric.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card admin-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Doanh thu 7 ngày qua</h2>
              <p>Chỉ ghi nhận đơn đã giao và có thanh toán hoàn tất, không tính đơn đang xử lý hoặc đã hủy.</p>
            </div>
            <span className="chart-legend">Doanh thu</span>
          </div>
          <div className="admin-line-chart" aria-label="Biểu đồ doanh thu">
            {loading ? (
              <div className="admin-empty-row">Đang tải biểu đồ...</div>
            ) : (
              <>
                <div className="admin-bars">
                  {chart.map((point) => {
                    const height = maxRevenue > 0 ? Math.max(12, Math.round((point.revenue / maxRevenue) * 100)) : 12;

                    return (
                      <span
                        key={point.date}
                        style={{ height: `${height}%` }}
                        title={`${formatDateLabel(point.date)}: ${formatPrice(point.revenue || 0)}`}
                      />
                    );
                  })}
                </div>
                <div className="chart-days">
                  {chart.map((point) => (
                    <span key={point.date}>{formatDateLabel(point.date)}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>

        <article className="admin-card admin-latest-card">
          <div className="admin-card-head inline">
            <h2>Đơn hàng mới nhất</h2>
            <a href="/admin/orders">Xem tất cả</a>
          </div>
          <div className="latest-order-list">
            {loading ? (
              <div className="admin-empty-row">Đang tải đơn hàng...</div>
            ) : summary?.recent_orders?.length ? (
              summary.recent_orders.map((order) => {
                const firstItem = order.items?.[0];

                return (
                  <div className="latest-order-item" key={order.id}>
                    <img src={firstItem?.productImage || fallbackProductImage} alt={buildOrderName(order)} />
                    <div>
                      <strong>{order.orderNumber || `#${order.id}`}</strong>
                      <p>{buildOrderName(order)}</p>
                    </div>
                    <div>
                      <span className={`admin-status ${statusTones[order.status] || 'waiting'}`}>
                        {order.statusLabel}
                      </span>
                      <b>{formatPrice(order.total)}</b>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-empty-row">Chưa có đơn hàng mới.</div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
