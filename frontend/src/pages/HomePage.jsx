import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  assets,
  homeCategories,
  products,
  testimonials,
} from '../data/catalog.js';
import { formatPrice } from '../utils/helpers.js';

const bestSellers = products.slice(0, 5);

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-bg">
          <img src={assets.heroCamera} alt="Máy ảnh CamStore" />
        </div>
        <div className="container home-hero-content">
          <h1>Capture Every Precious Moment</h1>
          <p>
            Khám phá thế giới qua lăng kính chuyên nghiệp. Nơi hội tụ những thiết
            bị nhiếp ảnh hàng đầu thế giới từ Mirrorless đến Flycam.
          </p>
          <div className="home-hero-actions">
            <Link className="button primary" to="/products">
              Khám phá ngay
            </Link>
            <Link className="button dark" to="/products">
              Xem bộ sưu tập
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-section">
        <div className="home-section-heading">
          <h2>Danh mục nổi bật</h2>
          <p>Trang bị tối tân cho mọi nhu cầu sáng tạo</p>
        </div>

        <div className="featured-category-grid">
          <Link className="category-tile category-tile-large category-tile-camera" to="/products?category=camera">
            <img src={homeCategories[0].image} alt={homeCategories[0].title} />
            <span>{homeCategories[0].title}</span>
            <p>{homeCategories[0].subtitle}</p>
          </Link>
          <Link className="category-tile category-tile-tall category-tile-lens" to="/products?category=lens">
            <img src={homeCategories[1].image} alt={homeCategories[1].title} />
            <span>{homeCategories[1].title}</span>
            <p>{homeCategories[1].subtitle}</p>
          </Link>
          <div className="category-tile-stack">
            {homeCategories.slice(2).map((category) => (
              <Link
                className={`category-tile category-tile-${category.id}`}
                key={category.id}
                to={category.id === 'accessory' ? '/products?category=accessory' : '/products'}
              >
                <img src={category.image} alt={category.title} />
                <span>{category.title}</span>
                <p>{category.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-products-band">
        <div className="container">
          <div className="home-section-heading with-actions">
            <div>
              <h2>Sản phẩm bán chạy</h2>
              <p>Những lựa chọn hàng đầu từ cộng đồng nhiếp ảnh</p>
            </div>
            <div className="tiny-arrows">
              <button type="button" aria-label="Trước">
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Sau">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="home-best-grid">
            {bestSellers.map((product) => (
              <Link className="home-product-card" to={`/products/${product.id}`} key={product.id}>
                <img src={product.image} alt={product.name} />
                <span>{product.brand}</span>
                <strong>{product.name}</strong>
                <small>
                  <Star size={12} fill="currentColor" /> {product.rating} ({product.reviews} đánh giá)
                </small>
                <b>{formatPrice(product.price)}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container home-recommendation">
        <img src={assets.photographerLandscape} alt="Nhiếp ảnh gia ngoài trời" />
        <div>
          <span>Recommendation</span>
          <h2>Tìm máy ảnh phù hợp với bạn</h2>
          <p>
            Bạn là người mới bắt đầu hay một nhiếp ảnh gia chuyên nghiệp? Hãy trả
            lời 3 câu hỏi nhanh để chúng tôi gợi ý thiết bị hoàn hảo cho phong
            cách của bạn.
          </p>
          <Link className="button primary" to="/products">
            Bắt đầu khảo sát <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="home-testimonials">
        <div className="container">
          <div className="home-section-heading centered">
            <h2>Được tin dùng bởi chuyên gia</h2>
            <p>Câu chuyện từ những người định hình nghệ thuật thị giác</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="testimonial-card">
                <div>
                  <img src={testimonial.avatar} alt={testimonial.name} />
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
                <p>“{testimonial.quote}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
