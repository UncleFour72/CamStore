import {
  Banknote,
  CalendarDays,
  Download,
  ShoppingBag,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { products } from '../../data/catalog.js';
import { formatPrice } from '../../utils/helpers.js';

const metrics = [
  {
    label: 'Doanh thu tháng',
    value: '1.280.000.000đ',
    change: '+12.5%',
    trend: 'up',
    icon: Banknote,
    tone: 'blue',
  },
  {
    label: 'Đơn hàng mới',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingBag,
    tone: 'indigo',
  },
  {
    label: 'Khách hàng mới',
    value: '89',
    change: '+5.1%',
    trend: 'up',
    icon: UserPlus,
    tone: 'orange',
  },
  {
    label: 'Tỷ lệ chuyển đổi',
    value: '4.82%',
    change: '-2.4%',
    trend: 'down',
    icon: Target,
    tone: 'red',
  },
];

const latestOrders = [
  ['#ORD-8821', 'Sony A7 IV + 24-70mm', 62500000, 'Đã thanh toán', products[0].image, 'paid'],
  ['#ORD-8820', 'Canon EOS R5 Body', 85900000, 'Đang xử lý', products[1].image, 'pending'],
  ['#ORD-8819', 'Nikon Z9 + FTZ II', 129000000, 'Chờ xác nhận', products[5].image, 'waiting'],
  ['#ORD-8818', 'Fujifilm X-T5 + 35mm f1.4', 48200000, 'Đã thanh toán', products[2].image, 'paid'],
  ['#ORD-8817', 'Leica M11 Silver', 215000000, 'Đang xử lý', products[4].image, 'pending'],
];

export default function AdminDashboard() {
  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Chào mừng trở lại! Đây là tóm tắt hoạt động kinh doanh hôm nay.</p>
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

      <section className="admin-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <article className="admin-metric-card" key={metric.label}>
              <div className={`admin-metric-icon ${metric.tone}`}>
                <Icon size={25} />
              </div>
              <span className={metric.trend === 'up' ? 'metric-change up' : 'metric-change down'}>
                {metric.change} <TrendIcon size={17} />
              </span>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card admin-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Doanh thu 7 ngày qua</h2>
              <p>Thống kê biến động từ ngày 18 - 24 Tháng 5</p>
            </div>
            <span className="chart-legend">Doanh số</span>
          </div>
          <div className="admin-line-chart" aria-label="Biểu đồ doanh thu">
            <svg viewBox="0 0 760 360" role="img">
              <defs>
                <linearGradient id="adminChartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006a9f" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#006a9f" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M26 306 C132 245 197 194 266 188 C335 182 354 265 404 238 C454 211 456 108 523 112 C590 116 583 278 642 250 C701 222 680 18 734 46 C760 60 768 122 768 122 L768 342 L26 342 Z"
                fill="url(#adminChartFill)"
              />
              <path
                d="M26 306 C132 245 197 194 266 188 C335 182 354 265 404 238 C454 211 456 108 523 112 C590 116 583 278 642 250 C701 222 680 18 734 46 C760 60 768 122 768 122"
                fill="none"
                stroke="#006a9f"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <div className="chart-days">
              <span>18/05</span>
              <span>19/05</span>
              <span>20/05</span>
              <span>21/05</span>
              <span>22/05</span>
              <span>23/05</span>
              <span>Hôm nay</span>
            </div>
          </div>
        </article>

        <article className="admin-card admin-latest-card">
          <div className="admin-card-head inline">
            <h2>Đơn hàng mới nhất</h2>
            <a href="/admin/orders">Xem tất cả</a>
          </div>
          <div className="latest-order-list">
            {latestOrders.map(([id, name, total, status, image, tone]) => (
              <div className="latest-order-item" key={id}>
                <img src={image} alt={name} />
                <div>
                  <strong>{id}</strong>
                  <p>{name}</p>
                </div>
                <div>
                  <span className={`admin-status ${tone}`}>{status}</span>
                  <b>{formatPrice(total)}</b>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
