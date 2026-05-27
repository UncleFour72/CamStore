import { Globe2, Mail, Rss, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-column">
          <Link className="brand" to="/">
            CamStore
          </Link>
          <p>
            Hệ thống bán lẻ máy ảnh, ống kính và phụ kiện nhiếp ảnh chính hãng
            hàng đầu Việt Nam.
          </p>
          <div className="social-row">
            <a href="/" aria-label="Website"><Globe2 size={18} /></a>
            <a href="/" aria-label="Chia sẻ"><Share2 size={18} /></a>
            <a href="/" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>

        <div className="footer-column">
          <h3>Liên kết</h3>
          <Link to="/profile">Về chúng tôi</Link>
          <Link to="/services/warranty">Chính sách bảo hành</Link>
          <Link to="/services/trade-in">Thu cũ đổi mới</Link>
          <Link to="/services/cleaning">Vệ sinh lens & máy ảnh</Link>
        </div>

        <div className="footer-column">
          <h3>Hỗ trợ</h3>
          <Link to="/profile">Liên hệ</Link>
          <Link to="/orders">Câu hỏi thường gặp</Link>
          <Link to="/blog">Tạp chí nhiếp ảnh</Link>
        </div>

        <form className="footer-newsletter">
          <h3>Đăng ký nhận tin</h3>
          <p>Nhận thông báo về sản phẩm mới và ưu đãi độc quyền.</p>
          <div>
            <input placeholder="Email của bạn" />
            <button type="button">Gửi</button>
          </div>
          <span><Rss size={16} /> Hà Nội, Việt Nam · Hotline: 1800 6789</span>
        </form>
      </div>
      <div className="footer-bottom">© 2024 CamStore. Đẳng cấp nhiếp ảnh chuyên nghiệp.</div>
    </footer>
  );
}
