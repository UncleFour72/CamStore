import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  Map,
  ShieldCheck,
  Sparkles,
  Sun,
  Thermometer,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { assets } from '../../data/catalog.js';
import { formatPrice } from '../../utils/helpers.js';

const cleaningSteps = [
  ['Thổi bụi bề mặt', 'Sử dụng bóng thổi để loại bỏ cát và bụi lớn trên thân máy và ống kính. Tuyệt đối không dùng miệng thổi.'],
  ['Làm sạch thấu kính', 'Dùng bút lau lens hoặc khăn microfiber chuyên dụng lau nhẹ theo tâm ra ngoài theo hình vòng tròn.'],
  ['Vệ sinh các điểm tiếp xúc', 'Dùng tăm bông khô lau nhẹ các chân tiếp xúc kim loại giữa lens và body để đảm bảo kết nối ổn định.'],
];

const careGuides = [
  ['Kiểm soát độ ẩm', 'Luôn duy trì độ ẩm trong tủ chống ẩm ở mức 40% - 50%. Đây là ngưỡng lý tưởng để ngăn chặn nấm mốc phát triển.', Thermometer],
  ['Tránh nhiệt độ cao', 'Không để máy ảnh trong cốp xe hoặc dưới ánh nắng trực tiếp quá lâu, điều này có thể làm chảy lớp keo và biến dạng linh kiện.', Sun],
  ['Vệ sinh sau khi sử dụng', 'Sau mỗi lần chụp ngoài biển, bụi bẩn, hãy lau sạch muối và mồ hôi trên thân máy trước khi cất vào tủ.', Beaker],
];

const servicePlans = [
  {
    title: 'Vệ sinh cơ bản',
    price: 200000,
    features: ['Làm sạch vỏ ngoài thân máy', 'Vệ sinh thấu kính trước & sau', 'Thổi bụi khoang máy'],
  },
  {
    title: 'Vệ sinh chuyên sâu',
    price: 500000,
    popular: true,
    features: ['Bao gồm gói cơ bản', 'Vệ sinh Sensor chuyên dụng', 'Làm sạch gương lật & Viewfinder', 'Khử nấm mốc bằng tia UV'],
  },
  {
    title: 'Kiểm tra định kỳ',
    price: 350000,
    features: ['Kiểm tra số Shot (Shutter count)', 'Kiểm tra sai lệch Focus', 'Cập nhật Firmware mới nhất'],
  },
];

const accessories = [
  ['Tủ chống ẩm Andbon 30L', 1250000, 'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=600&q=80'],
  ['Bộ vệ sinh VSGO 7-in-1', 450000, 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=600&q=80'],
  ['Bóng thổi bụi silicon cao cấp', 120000, 'https://images.unsplash.com/photo-1583947581924-a6d0f0d311cf?auto=format&fit=crop&w=600&q=80'],
  ['Hạt hút ẩm Silica Gel (500g)', 85000, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'],
];

export default function CleaningServicePage() {
  return (
    <main className="cleaning-page">
      <section className="container cleaning-hero">
        <div>
          <span>Kiến thức & dịch vụ</span>
          <h1>Chăm sóc thiết bị, nâng tầm khung hình.</h1>
          <p>
            Tại CamStore, chúng tôi tin rằng một thiết bị sạch sẽ là khởi đầu
            của một bức ảnh đẹp. Khám phá bí quyết tự bảo quản hoặc ghé cửa
            hàng để nhận dịch vụ chuyên nghiệp.
          </p>
          <div>
            <a className="button primary" href="#plans">Dịch vụ tại cửa hàng</a>
            <a className="button secondary" href="#guide">Tự vệ sinh tại nhà</a>
          </div>
        </div>
        <figure>
          <img src={assets.sensor} alt="Vệ sinh cảm biến máy ảnh" />
          <figcaption>
            <Sparkles size={19} />
            <strong>Đồng hành cùng bạn</strong>
            <small>Kiến thức chuẩn chuyên gia</small>
          </figcaption>
        </figure>
      </section>

      <section className="container cleaning-guide" id="guide">
        <div>
          <h2>Hướng dẫn vệ sinh đúng cách</h2>
          <p>
            Đừng để bụi bẩn làm hỏng khoảnh khắc của bạn. Thực hiện theo các
            bước sau để giữ thiết bị luôn như mới:
          </p>
          <div className="cleaning-steps">
            {cleaningSteps.map(([title, description], index) => (
              <div key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="cleaning-warning">
            <strong>Lưu ý quan trọng:</strong>
            <p>Không tự lau Sensor tại nhà nếu không có bộ dụng cụ chuyên dụng và kỹ năng cần thiết. Rủi ro trầy xước rất cao.</p>
          </div>
        </div>
        <img src={assets.lensDark} alt="Ống kính máy ảnh" />
      </section>

      <section className="cleaning-care-band">
        <div className="container">
          <div className="cleaning-section-heading">
            <h2>Hướng dẫn bảo quản dài lâu</h2>
            <p>Môi trường nóng ẩm tại Việt Nam là kẻ thù số một của thiết bị nhiếp ảnh. Hãy bảo vệ chúng đúng cách.</p>
          </div>
          <div className="cleaning-care-grid">
            {careGuides.map(([title, description, Icon]) => (
              <article key={title}>
                <Icon size={24} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container cleaning-plans" id="plans">
        <div className="cleaning-section-heading">
          <h2>Dịch vụ chăm sóc chuyên nghiệp</h2>
          <p>Không cần đặt lịch, hãy ghé ngay cửa hàng để được kỹ thuật viên hỗ trợ trực tiếp.</p>
        </div>
        <div className="cleaning-plan-grid">
          {servicePlans.map((plan) => (
            <article className={plan.popular ? 'cleaning-plan featured' : 'cleaning-plan'} key={plan.title}>
              {plan.popular && <span>Khuyên dùng</span>}
              <div className="cleaning-plan-icon"><Wrench size={22} /></div>
              <h3>{plan.title}</h3>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><CheckCircle2 size={15} /> {feature}</li>
                ))}
              </ul>
              <strong>{formatPrice(plan.price)}</strong>
              <small>* Hoàn tất trong 30-90 phút</small>
            </article>
          ))}
        </div>

        <div className="cleaning-map-card">
          <div>
            <h3>Bạn đang ở gần CamStore?</h3>
            <p>Mang thiết bị đến ngay cửa hàng tại 123 Đường Máy Ảnh, Quận 1 để được kiểm tra miễn phí.</p>
          </div>
          <a className="button primary" href="https://maps.google.com" target="_blank" rel="noreferrer">
            <Map size={18} /> Xem bản đồ
          </a>
        </div>
      </section>

      <section className="container cleaning-accessories">
        <div className="cleaning-accessories-head">
          <div>
            <h2>Phụ kiện bảo quản</h2>
            <p>Công cụ hỗ trợ duy trì độ bền cho thiết bị của bạn.</p>
          </div>
          <Link to="/products?category=accessory">Xem tất cả <ArrowRight size={15} /></Link>
        </div>
        <div className="cleaning-accessory-grid">
          {accessories.map(([name, price, image]) => (
            <article key={name}>
              <img src={image} alt={name} />
              <strong>{name}</strong>
              <span>{formatPrice(price)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="container cleaning-process">
        <div>
          <h2>An tâm tuyệt đối với quy trình 6 bước</h2>
          <p>
            Từ tiếp nhận, làm sạch áp suất thấp đến kiểm tra dưới kính hiển vi.
            Chúng tôi chăm sóc thiết bị của bạn như chính đứa con tinh thần của mình.
          </p>
          <Link className="button secondary" to="/services/warranty">Khám phá quy trình</Link>
        </div>
        <img src={assets.cameraDark} alt="Vệ sinh thân máy" />
        <img src={assets.lensDark} alt="Vệ sinh ống kính" />
      </section>
    </main>
  );
}
