import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products } from '../data/catalog.js';
import { formatPrice } from '../utils/helpers.js';

const brands = ['Sony', 'Canon', 'Fujifilm', 'Nikon', 'Leica'];
const productTypes = ['Máy ảnh Mirrorless', 'Máy ảnh DSLR', 'Ống kính Prime', 'Ống kính Zoom'];
const conditions = ['Mới 100%', 'Like New', 'Cũ'];

export default function ProductListPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [condition, setCondition] = useState('Mới 100%');
  const category = searchParams.get('category') || '';

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = !category || product.category === category;
      const matchesBrand = !selectedBrand || product.brand === selectedBrand;
      const matchesType = !selectedType || product.productType === selectedType;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesBrand && matchesType && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'price-low') return a.price - b.price;
      return b.reviews - a.reviews;
    });
  }, [category, query, selectedBrand, selectedType, sort]);

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
                <option value="price-high">Giá cao nhất</option>
                <option value="price-low">Giá thấp nhất</option>
              </select>
              <ChevronDown size={18} />
            </label>
          </div>
        </div>

        <div className="store-layout">
          <aside className="store-sidebar">
            <FilterGroup title="Thương hiệu">
              {brands.map((brand) => (
                <label className="store-check" key={brand}>
                  <input
                    type="checkbox"
                    checked={selectedBrand === brand}
                    onChange={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Loại sản phẩm">
              {productTypes.map((type) => (
                <label className="store-check" key={type}>
                  <input
                    type="checkbox"
                    checked={selectedType === type}
                    onChange={() => setSelectedType(selectedType === type ? '' : type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </FilterGroup>

            <div className="store-filter-group">
              <h2>Mức giá</h2>
              <input className="store-range" type="range" min="0" max="200000000" defaultValue="95000000" />
              <div className="store-range-labels">
                <span>0đ</span>
                <span>200.000.000đ</span>
              </div>
            </div>

            <div className="store-filter-group">
              <h2>Tình trạng</h2>
              <div className="condition-pills">
                {conditions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={condition === item ? 'active' : ''}
                    onClick={() => setCondition(condition === item ? '' : item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="store-main">
            {visibleProducts.length > 0 ? (
              <div className="store-product-grid">
                {visibleProducts.slice(0, 8).map((product) => (
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

            <div className="store-pagination">
              <button type="button" aria-label="Trang trước">
                <ChevronLeft size={20} />
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">12</button>
              <button type="button" aria-label="Trang sau">
                <ChevronRight size={20} />
              </button>
            </div>
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
