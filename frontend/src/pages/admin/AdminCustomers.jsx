import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  Star,
  UserPlus,
} from 'lucide-react';
import { formatPrice } from '../../utils/helpers.js';

const customers = [
  ['Nguyễn Thu Hà', 'thutha.nguyen@email.com', '0908 123 456', 125500000, 14, '12/05/2023', 'VIP GOLD', 'gold', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'],
  ['Lê Hoàng Nam', 'nam.lehoang@email.com', '0912 987 654', 8200000, 2, '28/10/2023', 'THÀNH VIÊN', 'member', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'],
  ['Phạm Minh Anh', 'minhanh.pham@email.com', '0945 456 789', 42000000, 6, '05/01/2024', 'VIP SILVER', 'silver', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80'],
  ['Trần Quốc Việt', 'viet.tran@email.com', '0989 111 222', 89000000, 11, '15/09/2023', 'VIP GOLD', 'gold', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'],
];

export default function AdminCustomers() {
  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Theo dõi hành trình và thông tin chi tiết của 1,284 khách hàng.</p>
        </div>
        <button type="button" className="admin-btn primary"><UserPlus size={22} /> Thêm khách hàng</button>
      </section>

      <section className="admin-customer-filters">
        <div className="admin-filter-card customers-search">
          <label>
            <Search size={21} />
            <input placeholder="Tìm theo tên, email hoặc số điện thoại..." />
          </label>
          <button type="button">Tất cả trạng thái <ChevronDown size={18} /></button>
        </div>
        <div className="loyal-card">
          <span><Star size={24} /></span>
          <div>
            <strong>Khách hàng thân thiết</strong>
            <small>Chi tiêu &gt; 50,000,000đ</small>
          </div>
          <button type="button" aria-label="Bật lọc khách hàng thân thiết" />
        </div>
      </section>

      <section className="admin-table-card">
        <div className="admin-customers-table admin-table-head-row">
          <span>Khách hàng</span>
          <span>Liên hệ</span>
          <span>Tổng chi tiêu</span>
          <span>Đơn hàng</span>
          <span>Ngày đăng ký</span>
          <span>Thao tác</span>
        </div>
        {customers.map((customer) => (
          <div className="admin-customers-table admin-table-row" key={customer[1]}>
            <div className="admin-customer-profile">
              <img src={customer[8]} alt={customer[0]} />
              <div>
                <strong>{customer[0]}</strong>
                <span className={`customer-tier ${customer[7]}`}>{customer[6]}</span>
              </div>
            </div>
            <div>
              <p>{customer[1]}</p>
              <small>{customer[2]}</small>
            </div>
            <b>{formatPrice(customer[3])}</b>
            <span className="order-count-pill">{customer[4]}</span>
            <span>{customer[5]}</span>
            <button type="button" className="admin-row-action" aria-label="Thao tác"><MoreVertical size={22} /></button>
          </div>
        ))}
        <div className="admin-table-footer">
          <p>Đang hiển thị 1 - 10 của 1,284 khách hàng</p>
          <div className="admin-pagination">
            <button type="button" disabled><ChevronLeft size={18} /></button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">129</button>
            <button type="button"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      <section className="customer-metric-grid">
        <article>
          <span>Tỷ lệ giữ chân <BarChart3 size={24} /></span>
          <strong>68.4%</strong>
          <p>↗ +2.4% so với tháng trước</p>
        </article>
        <article>
          <span>Giá trị trung bình <BarChart3 size={24} /></span>
          <strong>12,450k</strong>
          <p>Mỗi khách hàng / Năm</p>
        </article>
        <article>
          <span>Khách hàng mới <UserPlus size={24} /></span>
          <strong>142</strong>
          <p>Trong 30 ngày qua</p>
        </article>
      </section>
    </main>
  );
}
