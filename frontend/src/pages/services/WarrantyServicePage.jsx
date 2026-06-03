import { MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { lookupWarranties } from '../../services/warrantyService.js';

const warrantyRows = [
  ['Máy ảnh & body', '12-24 tháng tùy sản phẩm, áp dụng lỗi phần cứng do nhà sản xuất.'],
  ['Ống kính', '12 tháng cho lỗi AF, chống rung, vòng zoom/focus và lỗi quang học phát sinh từ nhà sản xuất.'],
  ['Phụ kiện điện tử', '6-12 tháng cho flash, gimbal, mic, monitor, pin sạc chính hãng.'],
  ['Dịch vụ sửa chữa', 'Bảo hành 30-90 ngày cho hạng mục đã sửa tại CamStore.'],
];

export default function WarrantyServicePage() {
  const [query, setQuery] = useState('');
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await lookupWarranties(query.trim());
      setWarranties(result);

      if (result.length === 0) {
        setError('Không tìm thấy phiếu bảo hành phù hợp.');
      }
    } catch (lookupError) {
      setError(lookupError.response?.data?.message || 'Không thể tra cứu bảo hành.');
      setWarranties([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="policy-page">
      <article className="policy-container">
        <header className="policy-hero">
          <h1>Chính sách Bảo hành</h1>
          <p>Quy định tiếp nhận, kiểm tra và hỗ trợ bảo hành thiết bị chính hãng tại CamStore.</p>
        </header>

        <section className="policy-section">
          <h2>1. Phạm vi bảo hành</h2>
          <p>
            CamStore hỗ trợ bảo hành cho các sản phẩm được phân phối chính hãng,
            còn nguyên tem, serial hợp lệ và chưa can thiệp phần cứng bởi đơn vị
            ngoài hệ thống.
          </p>
          <ul>
            <li><strong>Sản phẩm áp dụng:</strong> Body, lens, flash, gimbal, phụ kiện quay chụp và dịch vụ sửa chữa tại CamStore.</li>
            <li><strong>Điều kiện:</strong> Sản phẩm còn thời hạn bảo hành, không rơi vỡ, vô nước, cháy nổ hoặc nấm mốc nặng do bảo quản sai.</li>
            <li><strong>Chứng từ:</strong> Khách hàng cung cấp hóa đơn mua hàng hoặc thông tin số điện thoại đã đăng ký.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>2. Thời hạn bảo hành</h2>
          <p>Thời hạn cụ thể được ghi trên phiếu bảo hành hoặc hóa đơn điện tử:</p>
          <div className="policy-table">
            <div className="policy-table-head">
              <span>Nhóm sản phẩm</span>
              <span>Thời hạn & điều kiện</span>
            </div>
            {warrantyRows.map(([group, detail]) => (
              <div className="policy-table-row" key={group}>
                <strong>{group}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
          <small className="policy-note">
            CamStore luôn ưu tiên đổi mới trong 7 ngày nếu phát hiện lỗi kỹ thuật
            từ nhà sản xuất và sản phẩm còn đầy đủ hộp, phụ kiện.
          </small>
        </section>

        <section className="policy-section">
          <h2>3. Quy trình tiếp nhận</h2>
          <div className="policy-steps">
            {[
              ['Tiếp nhận thông tin', 'Nhân viên ghi nhận serial, tình trạng lỗi và phụ kiện đi kèm.'],
              ['Kiểm tra kỹ thuật', 'Kỹ thuật viên kiểm tra lỗi thực tế, đối chiếu điều kiện bảo hành và đưa ra thời gian xử lý.'],
              ['Hoàn tất & bàn giao', 'CamStore thông báo kết quả, bàn giao thiết bị và cập nhật lịch sử bảo hành cho khách hàng.'],
            ].map(([title, description], index) => (
              <div className="policy-step" key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="policy-help">
          <h2>Cần kiểm tra bảo hành?</h2>
          <p>Nhập số điện thoại, mã đơn hàng, mã bảo hành hoặc serial để kiểm tra nhanh trạng thái bảo hành.</p>
          <form className="warranty-lookup-form" onSubmit={handleLookup}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="SĐT / mã đơn / serial / mã bảo hành"
              required
            />
            <button className="button primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang tra...' : 'Tra cứu'}
            </button>
          </form>
          {error && <p className="form-error">{error}</p>}
          {warranties.length > 0 && (
            <div className="warranty-results">
              {warranties.map((warranty) => (
                <article key={warranty.id}>
                  <strong>{warranty.productName}</strong>
                  <span>Mã BH: {warranty.code}</span>
                  <span>Đơn hàng: {warranty.orderNumber}</span>
                  <span>Serial: {warranty.serialNumber}</span>
                  <span>Hiệu lực: {warranty.startDate} - {warranty.endDate}</span>
                  <b>{warranty.status}</b>
                </article>
              ))}
            </div>
          )}
          <div>
            <a className="button primary" href="tel:19008888">
              <Phone size={17} /> Hotline: 1900 8888
            </a>
            <a className="button secondary" href="mailto:support@camstore.vn">
              <MessageSquare size={17} /> Chat với chuyên viên
            </a>
          </div>
          <ShieldCheck className="policy-help-mark" size={34} />
        </section>
      </article>
    </main>
  );
}
