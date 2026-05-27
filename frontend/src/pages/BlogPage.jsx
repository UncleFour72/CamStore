import { ArrowRight, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/catalog.js';

const blogTabs = ['Tất cả', 'Kinh nghiệm', 'Đánh giá', 'Tin tức', 'Cảm hứng'];

export default function BlogPage() {
  const [featuredPost, ...posts] = blogPosts;

  return (
    <main className="blog-page">
      <section className="container blog-hero">
        <h1>Tạp chí Nhiếp ảnh</h1>
        <div className="blog-tabs">
          {blogTabs.map((tab, index) => (
            <button type="button" className={index === 0 ? 'active' : ''} key={tab}>
              {tab}
            </button>
          ))}
        </div>

        <article className="blog-featured">
          <img src={featuredPost.image} alt={featuredPost.title} />
          <div>
            <span>{featuredPost.category}</span>
            <h2>{featuredPost.title}</h2>
            <p>{featuredPost.excerpt}</p>
            <footer>
              <div className="blog-avatar" aria-hidden="true" />
              <div>
                <strong>{featuredPost.author}</strong>
                <small>{featuredPost.date}</small>
              </div>
              <Link to="/blog" aria-label="Xem bài viết nổi bật">
                <ArrowRight size={20} />
              </Link>
            </footer>
          </div>
        </article>
      </section>

      <section className="container blog-grid">
        {posts.map((post) => (
          <article className="blog-card" key={post.id}>
            <img src={post.image} alt={post.title} />
            <div>
              <span>{post.category} · {post.readTime}</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <Link to="/blog">
                Xem thêm <ChevronRight size={15} />
              </Link>
            </div>
          </article>
        ))}

        <article className="blog-newsletter-card">
          <Mail size={42} />
          <h2>Đăng ký nhận bản tin</h2>
          <p>
            Nhận ngay các mẹo nhiếp ảnh hàng tuần và thông báo về các thiết bị
            mới nhất.
          </p>
          <input placeholder="Email của bạn" />
          <button type="button">Đăng ký ngay</button>
        </article>
      </section>

      <nav className="blog-pagination container" aria-label="Phân trang blog">
        <button type="button" aria-label="Trang trước"><ChevronLeft size={18} /></button>
        <button type="button" className="active">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <span>...</span>
        <button type="button">10</button>
        <button type="button" aria-label="Trang sau"><ChevronRight size={18} /></button>
      </nav>
    </main>
  );
}
