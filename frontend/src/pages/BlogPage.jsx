import { ArrowRight, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { fetchBlogs, fetchFeaturedBlog, subscribeNewsletter } from '../store/slices/blogSlice.js';

const blogTabs = ['Tất cả', 'Kinh nghiệm', 'Đánh giá', 'Tin tức', 'Cảm hứng'];
const pageSize = 8;

export default function BlogPage() {
  const dispatch = useDispatch();
  const { posts, featuredPost, isLoading, isSubscribing, error, newsletterMessage, pagination } = useSelector(
    (state) => state.blog
  );
  const [category, setCategory] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState('');
  const heroPost = featuredPost || posts[0];
  const gridPosts = useMemo(() => {
    return heroPost ? posts.filter((post) => post.id !== heroPost.id) : posts;
  }, [heroPost, posts]);
  const totalPages = Math.max(1, pagination.totalPages || 1);

  useEffect(() => {
    dispatch(fetchFeaturedBlog());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  useEffect(() => {
    dispatch(fetchBlogs({ page, limit: pageSize, category, sort: 'latest' }));
  }, [category, dispatch, page]);

  async function handleSubscribe(event) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    try {
      await dispatch(subscribeNewsletter(email.trim())).unwrap();
      setEmail('');
    } catch {
      // Redux state already carries the visible error.
    }
  }

  return (
    <main className="blog-page">
      <section className="container blog-hero">
        <h1>Tạp chí Nhiếp ảnh</h1>
        <div className="blog-tabs">
          {blogTabs.map((tab) => (
            <button
              type="button"
              className={category === tab ? 'active' : ''}
              key={tab}
              onClick={() => setCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading && !heroPost ? (
          <LoadingSpinner label="Đang tải bài viết" />
        ) : heroPost ? (
          <article className="blog-featured">
            <img src={heroPost.image} alt={heroPost.title} />
            <div>
              <span>{heroPost.category}</span>
              <h2>{heroPost.title}</h2>
              <p>{heroPost.excerpt}</p>
              <footer>
                <div className="blog-avatar" aria-hidden="true" />
                <div>
                  <strong>{heroPost.author}</strong>
                  <small>{heroPost.date}</small>
                </div>
                <Link to={`/blog/${heroPost.id}`} aria-label="Xem bài viết nổi bật">
                  <ArrowRight size={20} />
                </Link>
              </footer>
            </div>
          </article>
        ) : (
          <div className="empty-state inline">
            <h2>Chưa có bài viết</h2>
            <p>Blog sẽ hiển thị sau khi admin xuất bản bài viết.</p>
          </div>
        )}
      </section>

      <section className="container blog-grid">
        {error && (
          <div className="empty-state inline">
            <h2>Không thể tải blog</h2>
            <p>{error}</p>
          </div>
        )}

        {gridPosts.map((post) => (
          <article className="blog-card" key={post.id}>
            <img src={post.image} alt={post.title} />
            <div>
              <span>{post.category} · {post.readTime}</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <Link to={`/blog/${post.id}`}>
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
          <form onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit" disabled={isSubscribing}>
              {isSubscribing ? 'Đang đăng ký...' : 'Đăng ký ngay'}
            </button>
          </form>
          {newsletterMessage && <p className="form-success">{newsletterMessage}</p>}
        </article>
      </section>

      {pagination.total > pageSize && (
        <nav className="blog-pagination container" aria-label="Phân trang blog">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
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
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </main>
  );
}
