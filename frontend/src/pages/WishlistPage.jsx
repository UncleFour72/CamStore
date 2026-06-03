import { Edit3, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ToastNotification from '../components/common/ToastNotification.jsx';
import { useCart } from '../hooks/useCart.js';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice.js';
import { formatPrice } from '../utils/helpers.js';

const MAX_WISHLIST_SELECTION = 50;

const getWishlistProductId = (product) => product.productId || product.apiId;

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { addItem } = useCart();
  const { items, isLoading, error, hasLoaded } = useSelector((state) => state.wishlist);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState('');

  const visibleProductIds = useMemo(
    () => items.map(getWishlistProductId).filter(Boolean).slice(0, MAX_WISHLIST_SELECTION),
    [items]
  );
  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    visibleProductIds.length > 0 && visibleProductIds.every((productId) => selectedIds.includes(productId));

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, hasLoaded]);

  useEffect(() => {
    setSelectedIds((currentIds) => currentIds.filter((productId) => visibleProductIds.includes(productId)));
  }, [visibleProductIds]);

  const toggleEditing = () => {
    setIsEditing((current) => !current);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleProductIds);
  };

  const toggleProductSelection = (productId) => {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(productId)) {
        return currentIds.filter((id) => id !== productId);
      }

      if (currentIds.length >= MAX_WISHLIST_SELECTION) {
        return currentIds;
      }

      return [...currentIds, productId];
    });
  };

  const handleBulkRemove = async () => {
    if (!selectedIds.length) {
      return;
    }

    try {
      await Promise.all(selectedIds.map((productId) => dispatch(removeFromWishlist(productId)).unwrap()));
      setMessage(`Đã bỏ thích ${selectedIds.length} sản phẩm.`);
      setSelectedIds([]);
    } catch (err) {
      setMessage(typeof err === 'string' ? err : err?.message || 'Không thể bỏ thích sản phẩm.');
    }
  };

  const handleAddToCart = async (product) => {
    const productId = getWishlistProductId(product);

    if (!productId) {
      return;
    }

    try {
      await addItem(productId, 1).unwrap();
      setMessage('Đã thêm sản phẩm vào giỏ hàng.');
    } catch (err) {
      setMessage(typeof err === 'string' ? err : err?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  return (
    <main className="store-page">
      <ToastNotification message={message} onClose={() => setMessage('')} />
      <section className="container">
        <div className="store-head">
          <div>
            <h1>Wishlist</h1>
            <p>Những thiết bị bạn đang quan tâm để quay lại xem nhanh.</p>
          </div>
          {items.length > 0 && (
            <button className="wishlist-edit-button" type="button" onClick={toggleEditing}>
              <Edit3 size={18} />
              {isEditing ? 'Xong' : 'Chỉnh sửa'}
            </button>
          )}
        </div>

        {isLoading && items.length === 0 ? (
          <LoadingSpinner label="Đang tải wishlist" />
        ) : error ? (
          <div className="empty-state">
            <h2>Không thể tải wishlist</h2>
            <p>{error}</p>
          </div>
        ) : items.length > 0 ? (
          <>
            {isEditing && (
              <div className="wishlist-edit-bar">
                <label className="wishlist-select-all">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                  <span>
                    Đã chọn {selectedCount}/{MAX_WISHLIST_SELECTION}
                  </span>
                </label>
                <button
                  className="wishlist-remove-selected"
                  type="button"
                  disabled={!selectedCount}
                  onClick={handleBulkRemove}
                >
                  <Trash2 size={16} />
                  Bỏ thích
                </button>
              </div>
            )}

            <div className="store-product-grid">
              {items.map((product) => {
                const productId = getWishlistProductId(product);
                const isSelected = selectedIds.includes(productId);

                return (
                  <article className="store-product-card wishlist-card" key={productId || product.id}>
                    <div className="wishlist-card-media">
                      <Link to={`/products/${product.id}`}>
                        <img src={product.image} alt={product.name} />
                      </Link>
                      {isEditing && productId && (
                        <label className="wishlist-card-check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelection(productId)}
                          />
                        </label>
                      )}
                      <button
                        className="wishlist-cart-button"
                        type="button"
                        aria-label="Thêm vào giỏ hàng"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                    <div>
                      <span>{product.brand}</span>
                      <strong>{product.name}</strong>
                      <b>{formatPrice(product.price)}</b>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>Wishlist đang trống</h2>
            <p>Bấm biểu tượng trái tim ở trang sản phẩm để lưu lại thiết bị bạn thích.</p>
            <Link className="button secondary" to="/products">
              Khám phá sản phẩm
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
