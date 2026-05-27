import { PackageCheck } from 'lucide-react';
import { mockOrders } from '../data/catalog.js';
import { formatPrice } from '../utils/helpers.js';

export default function OrderHistoryPage() {
  return (
    <main className="page">
      <section className="container">
        <div className="page-heading">
          <span className="eyebrow">Order tracking</span>
          <h1>Lịch sử đơn hàng</h1>
          <p>Theo dõi trạng thái giao hàng và các sản phẩm đã mua tại CamStore.</p>
        </div>

        <div className="order-list">
          {mockOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <PackageCheck size={28} />
                <div>
                  <h2>{order.id}</h2>
                  <p>{order.date}</p>
                </div>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <strong>{formatPrice(order.total)}</strong>
              <span className="status-pill">{order.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
