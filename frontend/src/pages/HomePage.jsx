import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ProductCard from '../components/common/ProductCard.jsx';
import {
  assets,
  storefrontCategories,
  testimonials,
} from '../data/assets.js';
import { fetchProducts } from '../store/slices/productSlice.js';

export default function HomePage() {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 5, sort: 'popular' }));
  }, [dispatch]);

  const categoryTiles = storefrontCategories;

  const bestSellers = products.slice(0, 5);

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
          <Link className="category-tile category-tile-large category-tile-camera" to={`/products?category=${categoryTiles[0].id}`}>
            <img src={categoryTiles[0].image} alt={categoryTiles[0].title} />
            <span>{categoryTiles[0].title}</span>
            <p>{categoryTiles[0].subtitle}</p>
          </Link>
          <Link className="category-tile category-tile-tall category-tile-lens" to={`/products?category=${categoryTiles[1].id}`}>
            <img src={categoryTiles[1].image} alt={categoryTiles[1].title} />
            <span>{categoryTiles[1].title}</span>
            <p>{categoryTiles[1].subtitle}</p>
          </Link>
          <div className="category-tile-stack">
            {categoryTiles.slice(2).map((category) => (
              <Link
                className={`category-tile category-tile-${category.id}`}
                key={category.id}
                to={`/products?category=${category.id}`}
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

          {isLoading && bestSellers.length === 0 ? (
            <LoadingSpinner label="Đang tải sản phẩm" />
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state inline">
              <h2>Chưa có sản phẩm nổi bật</h2>
              <p>Hãy thêm sản phẩm trong admin để hiển thị tại trang chủ.</p>
            </div>
          )}
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
