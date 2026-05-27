import { MessageSquare, Phone, ShieldCheck } from 'lucide-react';

const gradingRows = [
  ['Loại A (99%)', 'Thiết bị như mới, không trầy xước, số shot thấp (dưới 5.000 shot), đầy đủ phụ kiện zin và hộp.'],
  ['Loại B (95%)', 'Hoạt động hoàn hảo, trầy xước cực nhẹ ở các góc khó thấy, cao su không bong tróc, có đủ phụ kiện cơ bản.'],
  ['Loại C (90%)', 'Có dấu hiệu sử dụng rõ ràng, trầy xước hoặc mòn lớp sơn, cao su có thể hơi dãn nhưng máy vẫn hoạt động ổn định.'],
  ['Loại D (Dưới 90%)', 'Thiết bị cũ, ngoại quan xấu, thiếu phụ kiện hoặc có một số lỗi nhỏ không ảnh hưởng đến chất lượng ảnh.'],
];

const processSteps = [
  ['Kiểm tra & Thẩm định', 'Kỹ thuật viên kiểm tra ngoại quan, số shot và các tính năng vận hành trực tiếp tại cửa hàng trong khoảng 15-20 phút.'],
  ['Định giá & Chốt phương án', 'Dựa trên tình trạng thực tế và giá thị trường, CamStore đưa ra mức giá thu mua cuối cùng và mức trợ giá nếu có.'],
  ['Thanh toán hoặc Nâng cấp', 'Khách hàng thanh toán khoản chênh lệch để nhận máy mới hoặc nhận tiền mặt/chuyển khoản nếu chỉ có nhu cầu bán lại máy cũ.'],
];

export default function TradeInServicePage() {
  return (
    <main className="policy-page">
      <article className="policy-container">
        <header className="policy-hero">
          <h1>Quy định Thu cũ Đổi mới</h1>
          <p>Chi tiết điều khoản, tiêu chuẩn định giá và quy trình nâng cấp thiết bị tại CamStore.</p>
        </header>

        <section className="policy-section">
          <h2>1. Đối tượng áp dụng</h2>
          <p>
            Chương trình "Thu cũ Đổi mới" (Trade-in) tại CamStore được áp dụng
            cho tất cả khách hàng cá nhân và doanh nghiệp có nhu cầu nâng cấp
            thiết bị nhiếp ảnh chuyên nghiệp.
          </p>
          <ul>
            <li><strong>Khách hàng:</strong> Mọi khách hàng sở hữu thiết bị cũ hợp pháp, không giới hạn nguồn gốc mua hàng.</li>
            <li><strong>Thiết bị áp dụng:</strong> Thân máy ảnh, ống kính thuộc các thương hiệu Sony, Canon, Fujifilm, Nikon, Panasonic, Leica.</li>
            <li><strong>Phạm vi:</strong> Áp dụng tại tất cả showroom CamStore toàn quốc và hỗ trợ thẩm định từ xa cho khách hàng ở tỉnh.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>2. Tiêu chuẩn định giá thiết bị</h2>
          <p>
            CamStore áp dụng hệ thống phân loại tình trạng thiết bị minh bạch để
            đảm bảo quyền lợi cao nhất cho khách hàng:
          </p>
          <div className="policy-table">
            <div className="policy-table-head">
              <span>Phân loại</span>
              <span>Mô tả tình trạng</span>
            </div>
            {gradingRows.map(([grade, description]) => (
              <div className="policy-table-row" key={grade}>
                <strong>{grade}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <small className="policy-note">
            Lưu ý: CamStore không thu mua thiết bị đã qua sửa chữa phần cứng,
            máy bị vào nước, nấm mốc nặng hoặc lỗi cảm biến.
          </small>
        </section>

        <section className="policy-section">
          <h2>3. Quyền lợi khách hàng</h2>
          <p>Khi tham gia chương trình Trade-in, khách hàng sẽ nhận được các ưu đãi đặc quyền:</p>
          <ul>
            <li><strong>Trợ giá nâng cấp:</strong> Tặng thêm từ 1.000.000đ đến 5.000.000đ vào giá trị thu mua khi khách hàng lên đời dòng máy cao hơn.</li>
            <li><strong>Giá thu mua cạnh tranh:</strong> CamStore cam kết định giá sát với thị trường, không ép giá dựa trên tình trạng ảo.</li>
            <li><strong>Hỗ trợ kỹ thuật:</strong> Miễn phí vệ sinh thiết bị mới, hỗ trợ chuyển dữ liệu và thiết lập profile từ máy cũ sang máy mới.</li>
            <li><strong>Trả góp 0%:</strong> Hỗ trợ trả góp phần chênh lệch qua thẻ tín dụng với lãi suất 0%.</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Quy trình thu đổi</h2>
          <div className="policy-steps">
            {processSteps.map(([title, description], index) => (
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
          <h2>Cần hỗ trợ thêm?</h2>
          <p>Nếu bạn có thắc mắc về tình trạng máy của mình hoặc muốn nhận báo giá nhanh qua điện thoại.</p>
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
