import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  MoreVertical,
  Plus,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import { formatPrice } from '../../utils/helpers.js';

const orderStats = [
  ['Đang xử lý', '24', ClipboardList, 'blue'],
  ['Đang giao', '12', Truck, 'orange'],
  ['Hoàn thành', '156', CheckCircle2, 'indigo'],
  ['Đã hủy', '8', XCircle, 'red'],
];

const orderRows = [
  ['#ORD-88291', 'Lê Hoàng Nam', 'namlh@gmail.com', '14:20, 24/10/2023', 45200000, 'CHUYỂN KHOẢN', 'Mới', 'new'],
  ['#ORD-88285', 'Minh Tuấn', 'tuan.minh@outlook.com', '09:15, 24/10/2023', 12500000, 'TIỀN MẶT (COD)', 'Đang giao', 'shipping'],
  ['#ORD-88280', 'Hương Anh', 'huonganh_9x@yahoo.com', '18:45, 23/10/2023', 89000000, 'CHUYỂN KHOẢN', 'Hoàn thành', 'done'],
  ['#ORD-88275', 'Quốc Khánh', 'khanh.q@fpt.com.vn', '11:30, 23/10/2023', 5400000, 'VÍ ĐIỆN TỬ', 'Đã hủy', 'cancel'],
];

export default function AdminOrders() {
  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi và xử lý các đơn hàng từ hệ thống CamStore.</p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="admin-btn light"><Download size={20} /> Xuất báo cáo</button>
          <button type="button" className="admin-btn primary"><Plus size={22} /> Tạo đơn mới</button>
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
        <button type="button">Tất cả trạng thái</button>
        <span>Thời gian:</span>
        <button type="button">Hôm nay <ChevronDown size={18} /></button>
        <button type="button" className="solid">Lọc dữ liệu</button>
        <button type="button" className="ghost">Xóa lọc</button>
      </section>

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
        {orderRows.map((order) => (
          <div className="admin-orders-table admin-table-row" key={order[0]}>
            <a href="/admin/orders">{order[0]}</a>
            <div className="admin-customer-cell">
              <span>{order[1].split(' ').map((part) => part[0]).slice(-2).join('')}</span>
              <div>
                <strong>{order[1]}</strong>
                <small>{order[2]}</small>
              </div>
            </div>
            <span>{order[3]}</span>
            <b>{formatPrice(order[4])}</b>
            <span className="payment-badge">{order[5]}</span>
            <span className={`admin-status ${order[7]}`}>{order[6]}</span>
            <button type="button" className="admin-row-action" aria-label="Hành động"><MoreVertical size={22} /></button>
          </div>
        ))}
        <div className="admin-table-footer">
          <p>Hiển thị 1 - 10 trên 1.250 đơn hàng</p>
          <div className="admin-pagination">
            <button type="button" disabled><ChevronLeft size={18} /></button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">125</button>
            <button type="button"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      <section className="admin-order-bottom">
        <article className="admin-card admin-bar-card">
          <h2><BarChart3 size={24} /> Biểu đồ tăng trưởng đơn hàng</h2>
          <div className="admin-bars">
            {[38, 58, 72, 46, 86].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>
        <article className="admin-card admin-activity-card">
          <h2><RotateCcw size={24} /> Hoạt động mới nhất</h2>
          <div>
            <span><Truck size={22} /></span>
            <p><strong>Đơn hàng mới #88291</strong>Lê Hoàng Nam vừa đặt một Sony A7 IV.</p>
          </div>
          <div>
            <span><CheckCircle2 size={22} /></span>
            <p><strong>Thanh toán hoàn tất</strong>Đơn #88280 đã xác nhận chuyển khoản.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
