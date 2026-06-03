import {
  CheckCircle2,
  ChevronRight,
  Heart,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ToastNotification from '../components/common/ToastNotification.jsx';
import { assets } from '../data/assets.js';
import { useCart } from '../hooks/useCart.js';
import { fetchOrders } from '../store/slices/orderSlice.js';
import { clearCurrentProduct, fetchProduct, fetchProducts } from '../store/slices/productSlice.js';
import { clearReviewError, createReview, fetchProductReviews } from '../store/slices/reviewSlice.js';
import { fetchWishlist, toggleWishlist } from '../store/slices/wishlistSlice.js';
import { formatPrice } from '../utils/helpers.js';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { currentProduct: product, products, isLoading, error } = useSelector((state) => state.product);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { orders: deliveredOrders } = useSelector((state) => state.order);
  const { reviews, isLoading: reviewsLoading, error: reviewError } = useSelector((state) => state.review);
  const {
    productIds: wishlistProductIds,
    hasLoaded: wishlistLoaded,
    isLoading: wishlistLoading,
  } = useSelector((state) => state.wishlist);
  const [selectedImage, setSelectedImage] = useState('');
  const [combo, setCombo] = useState('body');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    dispatch(fetchProduct(productId));

    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setSelectedImage(product.gallery?.[0] || product.image);
    setCombo('body');
    dispatch(fetchProducts({ category: product.category, limit: 4, sort: 'popular' }));
    dispatch(fetchProductReviews({ productId: product.productId || product.apiId, page: 1, pageSize: 5 }));

    if (isAuthenticated) {
      dispatch(fetchOrders({ status: 'delivered', limit: 100 }));

      if (!wishlistLoaded) {
        dispatch(fetchWishlist());
      }
    }
  }, [dispatch, isAuthenticated, product, wishlistLoaded]);

  const relatedProducts = useMemo(() => {
    return products.filter((item) => item.id !== product?.id).slice(0, 4);
  }, [product?.id, products]);
  const eligibleOrder = useMemo(() => {
    const productApiId = Number(product?.productId || product?.apiId);

    if (!productApiId) {
      return null;
    }

    return deliveredOrders.find((order) =>
      order.status === 'delivered' && order.items.some((item) => Number(item.productId) === productApiId)
    );
  }, [deliveredOrders, product?.apiId, product?.productId]);
  const isWishlisted = useMemo(() => {
    const productApiId = Number(product?.productId || product?.apiId);
    return wishlistProductIds.some((id) => Number(id) === productApiId);
  }, [product?.apiId, product?.productId, wishlistProductIds]);

  function updateReviewForm(event) {
    dispatch(clearReviewError());
    setReviewMessage('');
    setReviewForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!eligibleOrder || !product) {
      return;
    }

    try {
      await dispatch(
        createReview({
          productId: product.productId || product.apiId,
          orderId: eligibleOrder.orderId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        })
      ).unwrap();
      setReviewForm({ rating: 5, comment: '' });
      setReviewMessage('Đánh giá của bạn đã được gửi.');
    } catch {
      // Redux state already carries the visible error.
    }
  }

  function handleToggleWishlist() {
    if (!product) {
      return;
    }

    dispatch(toggleWishlist(product.productId || product.apiId));
  }

  async function handleAddToCart({ goToCheckout = false } = {}) {
    if (!product) {
      return;
    }

    if (stockQuantity <= 0) {
      setCartMessage('Sản phẩm đang tạm hết hàng.');
      return;
    }

    try {
      await addItem(product.productId || product.apiId, 1).unwrap();

      if (goToCheckout) {
        navigate('/checkout');
        return;
      }

      setCartMessage('Đã thêm sản phẩm vào giỏ hàng.');
    } catch (err) {
      setCartMessage(
        typeof err === 'string' ? err : err?.message || 'Chưa thể thêm sản phẩm vào giỏ hàng.'
      );
    }
  }

  if (isLoading && !product) {
    return (
      <main className="pdp-page">
        <section className="container">
          <LoadingSpinner label="Đang tải sản phẩm" />
        </section>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="pdp-page">
        <section className="container">
          <div className="empty-state">
            <h1>Không thể tải sản phẩm</h1>
            <p>{error}</p>
            <Link className="button secondary" to="/products">
              Quay lại cửa hàng
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const basePrice = product.detailPrice || product.price;
  const kitPrice = basePrice + 6500000;
  const stockQuantity = Number(product.stock || 0);
  const specs = Array.isArray(product.specs) ? product.specs : [];

  return (
    <main className="pdp-page">
      <ToastNotification message={cartMessage} onClose={() => setCartMessage('')} />
      <section className="container pdp-top">
        <div className="pdp-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${product.category}`}>{product.categoryName || 'Sản phẩm'}</Link>
          <ChevronRight size={14} />
          <span>{product.detailName || product.name}</span>
        </div>

        <div className="pdp-grid">
          <div className="pdp-gallery">
            <div className="pdp-thumbs">
              {gallery.map((image) => (
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
              <img src={selectedImage || product.image} alt={product.name} />
            </div>
          </div>

          <div className="pdp-info">
            <span className="pdp-eyebrow">{product.eyebrow || product.brand}</span>
            <h1>{product.detailName || product.name}</h1>
            <div className="pdp-rating">
              <span>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={18} fill="currentColor" />
                ))}
              </span>
              <p>
                {Number(product.rating || 0).toFixed(1)} ({product.reviews || 0} đánh giá)
              </p>
            </div>
            <strong className="pdp-price">{formatPrice(basePrice)}</strong>
            <p className="pdp-description">{product.description || product.tagline}</p>

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
                onClick={() => handleAddToCart()}
                disabled={stockQuantity <= 0}
              >
                <ShoppingCart size={20} /> {stockQuantity > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
              </button>
              <button
                className="button primary full"
                type="button"
                disabled={stockQuantity <= 0}
                onClick={() => handleAddToCart({ goToCheckout: true })}
              >
                Mua ngay
              </button>
              <button
                className="button secondary full"
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Đã lưu wishlist' : 'Lưu vào wishlist'}
              </button>
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
        <a href="#accessories">Sản phẩm liên quan</a>
      </section>

      <section className="container pdp-detail-block" id="description">
        <div>
          <h2>{product.short_description || `Chi tiết ${product.name}`}</h2>
          <p>{product.description || product.tagline || 'Thông tin sản phẩm đang được cập nhật.'}</p>
          <img src={gallery[1] || product.image || assets.sensor} alt={product.name} />
        </div>

        <div id="specs">
          <h2>Thông số kỹ thuật chi tiết</h2>
          {specs.length > 0 ? (
            <div className="pdp-spec-table">
              {specs.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state inline">
              <h2>Chưa có thông số kỹ thuật</h2>
              <p>CamStore sẽ cập nhật bảng thông số cho sản phẩm này sớm.</p>
            </div>
          )}
        </div>
      </section>

      <section className="container pdp-reviews" id="reviews">
        <div className="pdp-related-head">
          <div>
            <h2>Đánh giá khách hàng</h2>
            <p>Phản hồi thật từ các đơn hàng đã giao</p>
          </div>
        </div>

        {reviewsLoading && reviews.length === 0 ? (
          <LoadingSpinner label="Đang tải đánh giá" />
        ) : reviews.length > 0 ? (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-head">
                  <div>
                    <strong>{review.userName}</strong>
                    <small>{review.createdAt}</small>
                  </div>
                  <span className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </span>
                </div>
                <p>{review.comment || 'Khách hàng chưa để lại nội dung đánh giá.'}</p>
                {review.images.length > 0 && (
                  <div className="review-images">
                    {review.images.map((image) => (
                      <img key={image} src={image} alt="Ảnh đánh giá sản phẩm" />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state inline">
            <h2>Chưa có đánh giá</h2>
            <p>Hãy là người đầu tiên chia sẻ trải nghiệm sau khi đơn hàng được giao.</p>
          </div>
        )}

        {reviewMessage && <p className="form-success">{reviewMessage}</p>}
        {reviewError && <p className="form-error">{reviewError}</p>}

        {isAuthenticated && eligibleOrder ? (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="form-grid">
              <label>
                <span>Số sao</span>
                <select name="rating" value={reviewForm.rating} onChange={updateReviewForm}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} sao
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                <span>Nội dung đánh giá</span>
                <textarea
                  name="comment"
                  value={reviewForm.comment}
                  onChange={updateReviewForm}
                  placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
                  rows={4}
                  required
                />
              </label>
            </div>
            <button className="button primary" type="submit" disabled={reviewsLoading}>
              {reviewsLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        ) : (
          <p className="field-note">
            {isAuthenticated
              ? 'Chỉ khách đã nhận hàng thành công mới có thể viết đánh giá cho sản phẩm này.'
              : 'Đăng nhập sau khi mua hàng để viết đánh giá sản phẩm.'}
          </p>
        )}
      </section>

      <section className="container pdp-related" id="accessories">
        <div className="pdp-related-head">
          <div>
            <h2>Sản phẩm liên quan</h2>
            <p>Có thể bạn sẽ quan tâm đến những lựa chọn này</p>
          </div>
          <Link to="/products">Xem tất cả</Link>
        </div>
        {relatedProducts.length > 0 ? (
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
        ) : (
          <div className="empty-state inline">
            <h2>Chưa có sản phẩm liên quan</h2>
            <p>Hãy quay lại cửa hàng để khám phá thêm thiết bị khác.</p>
          </div>
        )}
      </section>
    </main>
  );
}
