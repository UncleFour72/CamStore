import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { fetchBlog } from '../store/slices/blogSlice.js';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentPost, isLoading, error } = useSelector((state) => state.blog);

  useEffect(() => {
    dispatch(fetchBlog(slug));
  }, [dispatch, slug]);

  if (isLoading && !currentPost) {
    return (
      <main className="policy-page">
        <article className="policy-container">
          <LoadingSpinner label="Đang tải bài viết" />
        </article>
      </main>
    );
  }

  if (error && !currentPost) {
    return (
      <main className="policy-page">
        <article className="policy-container">
          <div className="empty-state">
            <h1>Không thể tải bài viết</h1>
            <p>{error}</p>
            <Link className="button secondary" to="/blog">
              Quay lại blog
            </Link>
          </div>
        </article>
      </main>
    );
  }

  if (!currentPost) {
    return null;
  }

  return (
    <main className="policy-page">
      <article className="policy-container blog-detail">
        <Link className="text-link" to="/blog">
          <ChevronLeft size={16} /> Quay lại blog
        </Link>
        <header className="policy-hero">
          <span className="eyebrow">{currentPost.category}</span>
          <h1>{currentPost.title}</h1>
          <p>{currentPost.excerpt}</p>
          <small>{currentPost.author} · {currentPost.date} · {currentPost.readTime}</small>
        </header>
        <img className="blog-detail-cover" src={currentPost.image} alt={currentPost.title} />
        <section className="policy-section blog-detail-content">
          <div dangerouslySetInnerHTML={{ __html: currentPost.content }} />
        </section>
      </article>
    </main>
  );
}
