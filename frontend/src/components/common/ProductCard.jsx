import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers.js';
import Badge from '../ui/Badge.jsx';

export default function ProductCard({ product }) {
  const productUrl = `/products/${product.id}`;
  const brand = product.brand || product.eyebrow || '';

  return (
    <article className="group grid min-w-0 overflow-hidden rounded-2xl border border-solid border-[#d9e2ec] bg-card shadow-soft transition duration-200 hover:-translate-y-1 hover:border-primary-bright/40 hover:shadow-lift">
      <Link className="relative block aspect-[4/3] overflow-hidden bg-surface-soft no-underline" to={productUrl}>
        <img
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        {product.badge && (
          <Badge className="absolute left-3.5 top-3.5" tone="light">
            {product.badge}
          </Badge>
        )}
      </Link>

      <div className="grid gap-3 p-5">
        {brand && <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-primary">{brand}</span>}

        <Link
          className="line-clamp-2 min-h-[48px] text-lg font-extrabold leading-snug text-ink no-underline transition hover:text-primary"
          to={productUrl}
        >
          {product.name}
        </Link>

        <div className="min-w-0">
          <strong className="block text-xl font-black text-primary">{formatPrice(product.price)}</strong>
          {product.oldPrice && Number(product.oldPrice) > Number(product.price) ? (
            <small className="block text-sm text-[#64748b] line-through">{formatPrice(product.oldPrice)}</small>
          ) : null}
        </div>
      </div>
    </article>
  );
}
