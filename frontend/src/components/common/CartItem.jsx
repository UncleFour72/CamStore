import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.js';
import { formatPrice } from '../../utils/helpers.js';

export default function CartItem({ item, compact = false }) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className={compact ? 'cart-line compact' : 'cart-line'}>
      <Link className="cart-line-image" to={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} />
      </Link>

      <div className="cart-line-main">
        <Link to={`/products/${product.id}`} className="cart-line-title">
          {product.name}
        </Link>
        <p>{product.eyebrow}</p>

        <div className="quantity-control" aria-label={`Số lượng ${product.name}`}>
          <button
            type="button"
            aria-label="Giảm số lượng"
            disabled={quantity <= 1}
            onClick={() => updateQuantity(item.id, quantity - 1)}
          >
            <Minus size={15} />
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => updateQuantity(item.id, quantity + 1)}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <strong className="cart-line-price">{formatPrice(product.price * quantity)}</strong>
      <button
        type="button"
        className="icon-button danger"
        aria-label="Xóa sản phẩm"
        onClick={() => removeItem(item.id)}
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
