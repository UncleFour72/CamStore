import {
  CheckCircle2,
  ChevronRight,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assets, products } from '../data/catalog.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/helpers.js';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { addItem } = useCart();
  const product = products.find((item) => item.id === productId) || products[0];
  const [selectedImage, setSelectedImage] = useState(product.gallery?.[0] || product.image);
  const [combo, setCombo] = useState('body');

  useEffect(() => {
    setSelectedImage(product.gallery?.[0] || product.image);
    setCombo('body');
  }, [product]);

  const relatedProducts = useMemo(
    () => products.slice(6, 10),
    [product]
  );

  const basePrice = product.detailPrice || product.price;
  const kitPrice = basePrice + 6500000;

  return (
    <main className="pdp-page">
      <section className="container pdp-top">
        <div className="pdp-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/products">Máy ảnh</Link>
          <ChevronRight size={14} />
          <span>{product.detailName || product.name}</span>
        </div>

        <div className="pdp-grid">
          <div className="pdp-gallery">
            <div className="pdp-thumbs">
              {(product.gallery || [product.image]).map((image) => (
                <button
                  type="button"
                  className={selectedImage === image ? 'active' : ''}
                  key={image}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`${product.name} thumbnail`} />
                </button>
              ))}
            </div>
            <div className="pdp-main-image">
              <img src={selectedImage} alt={product.name} />
            </div>
          </div>

          <div className="pdp-info">
            <span className="pdp-eyebrow">{product.eyebrow}</span>
            <h1>{product.detailName || product.name}</h1>
            <div className="pdp-rating">
              <span>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={18} fill="currentColor" />
                ))}
              </span>
              <p>({product.reviews} đánh giá)</p>
            </div>
            <strong className="pdp-price">{formatPrice(basePrice)}</strong>
            <p className="pdp-description">{product.description}</p>

            <div className="pdp-combos">
              <span>Lựa chọn combo</span>
              <label className={combo === 'body' ? 'active' : ''}>
                <input
                  type="radio"
                  name="combo"
                  checked={combo === 'body'}
                  onChange={() => setCombo('body')}
                />
                <p>Chỉ thân máy (Body Only)</p>
                <strong>{formatPrice(basePrice)}</strong>
              </label>
              <label className={combo === 'kit' ? 'active' : ''}>
                <input
                  type="radio"
                  name="combo"
                  checked={combo === 'kit'}
                  onChange={() => setCombo('kit')}
                />
                <p>Body + Lens 28-70mm Kit</p>
                <strong>{formatPrice(kitPrice)}</strong>
              </label>
            </div>

            <div className="pdp-actions">
              <button
                className="button dark full"
                type="button"
                onClick={() => addItem(product.id, 1)}
              >
                <ShoppingCart size={20} /> Thêm vào giỏ hàng
              </button>
              <Link className="button primary full" to="/checkout">
                Mua ngay
              </Link>
            </div>

            <div className="pdp-assurance">
              <span><CheckCircle2 size={18} /> Bảo hành 24 tháng chính hãng</span>
              <span><Truck size={18} /> Giao hàng miễn phí toàn quốc</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container pdp-tabs">
        <a className="active" href="#description">Mô tả chi tiết</a>
        <a href="#specs">Thông số kỹ thuật</a>
        <a href="#reviews">Đánh giá khách hàng</a>
        <a href="#accessories">Phụ kiện tương thích</a>
      </section>

      <section className="container pdp-detail-block" id="description">
        <div>
          <h2>Cảm biến 33MP thế hệ mới</h2>
          <p>
            Cảm biến hình ảnh Exmor R CMOS full-frame 33,0 megapixel mới mang
            đến tốc độ đọc dữ liệu cực nhanh, độ nhạy cao, độ nhiễu thấp và tái
            tạo màu sắc cực kỳ chính xác. Bạn sẽ cảm nhận được độ chi tiết đáng
            kinh ngạc trong từng pixel ảnh.
          </p>
          <img src={assets.sensor} alt="Cảm biến máy ảnh" />
        </div>

        <div id="specs">
          <h2>Thông số nổi bật</h2>
          <div className="pdp-spec-table">
            {product.specs.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pdp-related" id="accessories">
        <div className="pdp-related-head">
          <div>
            <h2>Sản phẩm liên quan</h2>
            <p>Có thể bạn sẽ quan tâm đến những lựa chọn này</p>
          </div>
          <Link to="/products">Xem tất cả</Link>
        </div>
        <div className="pdp-related-grid">
          {relatedProducts.map((item) => (
            <Link className="pdp-related-card" to={`/products/${item.id}`} key={item.id}>
              {item.badge && <span>{item.badge}</span>}
              <img src={item.image} alt={item.name} />
              <div>
                <strong>{item.fullName || item.name}</strong>
                <b>{formatPrice(item.price)}</b>
                <small>Xem chi tiết</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
