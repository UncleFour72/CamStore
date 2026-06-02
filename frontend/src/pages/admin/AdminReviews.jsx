import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquareText,
  Search,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';

const pageSize = 10;

const renderStars = (rating) => '★'.repeat(Number(rating || 0)).padEnd(5, '☆');

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: pageSize };

    if (search.trim()) {
      next.search = search.trim();
    }

    if (status) {
      next.is_active = status === 'active';
    }

    if (rating) {
      next.rating = rating;
    }

    return next;
  }, [page, search, status, rating]);

  const loadReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminService.getAdminReviews(params);
      setReviews(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const toggleReview = async (review) => {
    setError('');
    setNotice('');

    try {
      await adminService.setReviewActive(review.id, !review.is_active);
      setNotice(review.is_active ? 'Đã ẩn đánh giá.' : 'Đã hiển thị lại đánh giá.');
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái đánh giá.');
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Kiểm duyệt đánh giá</h1>
          <p>Ẩn hoặc hiển thị lại đánh giá sản phẩm, lọc theo sao và trạng thái.</p>
        </div>
      </section>

      <section className="admin-filter-card product-filter">
        <label>
          <Search size={22} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm trong nội dung đánh giá..."
          />
        </label>
        <label className="admin-inline-select">
          <MessageSquareText size={22} />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>
          <ChevronDown size={18} />
        </label>
        <label className="admin-inline-select">
          <Star size={22} />
          <select
            value={rating}
            onChange={(event) => {
              setRating(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả số sao</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} sao
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
      </section>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-review-table admin-table-head-row">
          <span>Đánh giá</span>
          <span>Sản phẩm</span>
          <span>Khách hàng</span>
          <span>Số sao</span>
          <span>Ảnh</span>
          <span>Ngày tạo</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="admin-empty-row">Chưa có đánh giá phù hợp.</div>
        ) : (
          reviews.map((review) => (
            <div className="admin-review-table admin-table-row" key={review.id}>
              <div>
                <strong>{review.comment || 'Không có nội dung'}</strong>
                <small>{review.is_active ? 'Đang hiển thị' : 'Đã ẩn'}</small>
              </div>
              <span>#{review.productId}</span>
              <span>{review.userName}</span>
              <span className="admin-star-rating">{renderStars(review.rating)}</span>
              <span>{review.images.length} ảnh</span>
              <span>{review.createdAt || '-'}</span>
              <button type="button" className="admin-pill-button" onClick={() => toggleReview(review)}>
                {review.is_active ? <EyeOff size={17} /> : <Eye size={17} />}
                {review.is_active ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          ))
        )}

        <div className="admin-table-footer">
          <p>
            Đang hiển thị {reviews.length} / {pagination.total} đánh giá
          </p>
          <div className="admin-pagination">
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="active">
              {pagination.page}
            </button>
            <span>/</span>
            <button type="button" disabled>
              {pagination.totalPages}
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
