import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.js';
import { formatPrice, getCategoryLabel } from '../../utils/helpers.js';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <Link className="product-card-media" to={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="product-badge">{product.badge}</span>
      </Link>

      <div className="product-card-body">
        <div className="product-meta-row">
          <span>{getCategoryLabel(product.category)}</span>
          <span className="rating">
            <Star size={15} fill="currentColor" /> {product.rating}
          </span>
        </div>
        <Link className="product-title-link" to={`/products/${product.id}`}>
          {product.name}
        </Link>
        <p>{product.tagline}</p>
        <div className="product-card-footer">
          <div>
            <strong>{formatPrice(product.price)}</strong>
            <small>{formatPrice(product.oldPrice)}</small>
          </div>
          <div className="product-actions">
            <button type="button" className="icon-button subtle" aria-label="Yêu thích">
              <Heart size={19} />
            </button>
            <button
              type="button"
              className="icon-button primary"
              aria-label="Thêm vào giỏ"
              onClick={() => addItem(product.id)}
            >
              <ShoppingCart size={19} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
