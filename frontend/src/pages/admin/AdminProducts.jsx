import { ChevronDown, ChevronLeft, ChevronRight, Filter, Plus, SlidersHorizontal, Archive, MoreVertical } from 'lucide-react';
import { products } from '../../data/catalog.js';
import { formatPrice } from '../../utils/helpers.js';

const adminProducts = [
  {
    name: 'Sony Alpha A7 IV',
    sku: 'SNY-A7M4-01',
    category: ['Máy ảnh', 'Mirrorless'],
    price: 59990000,
    stock: 12,
    status: 'Còn hàng',
    image: products[0].image,
  },
  {
    name: 'Fujifilm XF 35mm f/1.4 R',
    sku: 'FUJ-3514-R',
    category: ['Ống kính', 'Prime'],
    price: 12500000,
    stock: 0,
    status: 'Hết hàng',
    image: products[7].image,
  },
  {
    name: 'Canon EOS 5D Mark IV',
    sku: 'CAN-5D4-PRO',
    category: ['Máy ảnh', 'DSLR'],
    price: 48200000,
    stock: 5,
    status: 'Còn hàng',
    image: products[1].image,
  },
  {
    name: 'Manfrotto Befree Advanced',
    sku: 'MAN-BFA-TRP',
    category: ['Phụ kiện'],
    price: 4500000,
    stock: 28,
    status: 'Còn hàng',
    image: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=400&q=85',
  },
];

export default function AdminProducts() {
  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Danh sách sản phẩm</h1>
          <p>Quản lý và cập nhật thông tin kho hàng của bạn.</p>
        </div>
        <button type="button" className="admin-btn primary large">
          <Plus size={24} /> Thêm sản phẩm mới
        </button>
      </section>

      <section className="admin-filter-card product-filter">
        <button type="button"><Filter size={24} /> Tất cả danh mục <ChevronDown size={18} /></button>
        <button type="button"><SlidersHorizontal size={24} /> Mới nhất <ChevronDown size={18} /></button>
        <button type="button"><Archive size={24} /> Tất cả trạng thái <ChevronDown size={18} /></button>
      </section>

      <section className="admin-table-card products-table-card">
        <div className="admin-product-table admin-table-head-row">
          <span>Hình ảnh</span>
          <span>Sản phẩm</span>
          <span>Danh mục</span>
          <span>Giá bán</span>
          <span>Tồn kho</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>
        {adminProducts.map((product) => (
          <div className="admin-product-table admin-table-row" key={product.sku}>
            <img src={product.image} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <small>SKU: {product.sku}</small>
            </div>
            <div className="tag-stack">
              {product.category.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <b>{formatPrice(product.price)}</b>
            <span>{product.stock}</span>
            <span className={product.stock > 0 ? 'admin-stock in' : 'admin-stock out'}>{product.status}</span>
            <button type="button" className="admin-row-action" aria-label="Thao tác">
              <MoreVertical size={21} />
            </button>
          </div>
        ))}
        <div className="admin-table-footer">
          <p>Hiển thị <strong>1 - 4</strong> của <strong>128</strong> sản phẩm</p>
          <div className="admin-pagination">
            <button type="button"><ChevronLeft size={18} /></button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>
    </main>
  );
}
