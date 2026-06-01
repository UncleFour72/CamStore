import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { storefrontCategories } from '../data/assets.js';
import { fetchBrands, fetchProducts } from '../store/slices/productSlice.js';
import { formatPrice } from '../utils/helpers.js';

const conditions = [
  { label: 'Moi 100%', value: 'New 100%' },
  { label: 'Like New', value: 'Like New' },
  { label: 'Cu', value: 'Used' },
];
const pageSize = 8;
const defaultPriceLimit = 250000000;

export default function ProductListPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, brands, isLoading, error, pagination } = useSelector((state) => state.product);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [maxPrice, setMaxPrice] = useState(defaultPriceLimit);
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);
  const [page, setPage] = useState(1);
  const category = searchParams.get('category') || '';

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const pageButtons = useMemo(() => {
    const visible = Math.min(totalPages, 5);
    const start = Math.max(1, Math.min(page - 2, totalPages - visible + 1));

    return Array.from({ length: visible }, (_, index) => start + index);
  }, [page, totalPages]);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [category, condition, isPriceFilterActive, maxPrice, query, selectedBrand, sort]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        page,
        limit: pageSize,
        category,
        search: query.trim(),
        brand: selectedBrand,
        condition,
        maxPrice: isPriceFilterActive ? maxPrice : undefined,
        sort,
      })
    );
  }, [category, condition, dispatch, isPriceFilterActive, maxPrice, page, query, selectedBrand, sort]);

  function updateCategory(slug) {
    const nextParams = new URLSearchParams(searchParams);

    if (!slug || category === slug) {
      nextParams.delete('category');
    } else {
      nextParams.set('category', slug);
    }

    setSearchParams(nextParams);
  }

  return (
    <main className="store-page">
      <section className="container">
        <div className="store-head">
          <div>
            <h1>Cửa hàng</h1>
            <p>Khám phá các thiết bị nhiếp ảnh chuyên nghiệp tốt nhất.</p>
          </div>

          <div className="store-controls">
            <label className="store-search">
              <Search size={22} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
              />
            </label>
            <label className="store-sort">
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="popular">Bán chạy</option>
                <option value="rating">Đánh giá cao</option>
                <option value="price-high">Giá cao nhất</option>
                <option value="price-low">Giá thấp nhất</option>
              </select>
              <ChevronDown size={18} />
            </label>
          </div>
        </div>

        <div className="store-layout">
          <aside className="store-sidebar">
            <FilterGroup title="Danh mục">
              {storefrontCategories.map((item) => (
                <label className="store-check" key={item.id}>
                  <input
                    type="checkbox"
                    checked={category === item.id}
                    onChange={() => updateCategory(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Thương hiệu">
              {brands.map((brand) => (
                <label className="store-check" key={brand.id}>
                  <input
                    type="checkbox"
                    checked={selectedBrand === brand.name}
                    onChange={() => setSelectedBrand(selectedBrand === brand.name ? '' : brand.name)}
                  />
                  <span>{brand.name}</span>
                </label>
              ))}
            </FilterGroup>

            <div className="store-filter-group">
              <h2>Mức giá</h2>
              <input
                className="store-range"
                type="range"
                min="0"
                max={defaultPriceLimit}
                step="5000000"
                value={maxPrice}
                onChange={(event) => {
                  setIsPriceFilterActive(true);
                  setMaxPrice(Number(event.target.value));
                }}
              />
              <div className="store-range-labels">
                <span>0đ</span>
                <span>{isPriceFilterActive ? formatPrice(maxPrice) : 'Tất cả'}</span>
              </div>
              {isPriceFilterActive && (
                <button
                  className="store-filter-reset"
                  type="button"
                  onClick={() => {
                    setIsPriceFilterActive(false);
                    setMaxPrice(defaultPriceLimit);
                  }}
                >
                  Bỏ lọc giá
                </button>
              )}
            </div>

            <div className="store-filter-group">
              <h2>Tình trạng</h2>
              <div className="condition-pills">
                {conditions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={condition === item.value ? 'active' : ''}
                    onClick={() => setCondition(condition === item.value ? '' : item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="store-main">
            {isLoading && products.length === 0 ? (
              <LoadingSpinner label="Đang tải sản phẩm" />
            ) : error ? (
              <div className="empty-state">
                <h2>Không thể tải sản phẩm</h2>
                <p>{error}</p>
              </div>
            ) : products.length > 0 ? (
              <div className="store-product-grid">
                {products.map((product) => (
                  <Link className="store-product-card" to={`/products/${product.id}`} key={product.id}>
                    <img src={product.image} alt={product.name} />
                    <div>
                      <span>{product.brand}</span>
                      <strong>{product.name}</strong>
                      <b>{formatPrice(product.price)}</b>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>Không tìm thấy sản phẩm phù hợp</h2>
                <p>Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            )}

            {pagination.total > 0 && (
              <div className="store-pagination">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={20} />
                </button>
                {pageButtons.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="store-filter-group">
      <h2>{title}</h2>
      <div className="store-check-list">{children}</div>
    </div>
  );
}
