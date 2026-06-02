import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Newspaper,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as adminService from '../../services/adminService.js';
import { uploadImage } from '../../services/uploadService.js';

const pageSize = 8;

const emptyForm = {
  title: '',
  category: '',
  excerpt: '',
  content: '',
  cover_image: '',
  is_featured: false,
  is_published: false,
};

const fallbackCover =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80';

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: pageSize, sort: 'newest' };

    if (search.trim()) {
      next.search = search.trim();
    }

    if (status) {
      next.status = status;
    }

    return next;
  }, [page, search, status]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminService.getAdminBlogs(params);
      setPosts(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNotice('');
    setError('');
  };

  const startEdit = (post) => {
    setEditingId(post.postId);
    setForm({
      title: post.title || '',
      category: post.category || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.cover_image || '',
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const data = await uploadImage(file, 'camstore/blog');
      updateField('cover_image', data.url);
      setNotice('Đã upload ảnh bìa.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không upload được ảnh bìa.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      if (editingId) {
        await adminService.updateBlog(editingId, form);
        setNotice('Đã cập nhật bài viết.');
      } else {
        await adminService.createBlog(form);
        setNotice('Đã tạo bài viết mới.');
      }

      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được bài viết.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post) => {
    setError('');
    setNotice('');

    try {
      await adminService.toggleBlogPublish(post.postId, !post.is_published);
      setNotice(post.is_published ? 'Đã chuyển bài viết về bản nháp.' : 'Đã xuất bản bài viết.');
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái xuất bản.');
    }
  };

  const toggleFeatured = async (post) => {
    setError('');
    setNotice('');

    try {
      await adminService.toggleBlogFeatured(post.postId, !post.is_featured);
      setNotice(post.is_featured ? 'Đã gỡ bài nổi bật.' : 'Đã đặt bài nổi bật.');
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được bài nổi bật.');
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`Xóa bài viết "${post.title}"?`)) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await adminService.deleteBlog(post.postId);
      setNotice('Đã xóa bài viết.');
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không xóa được bài viết.');
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý tin tức</h1>
          <p>Tạo, chỉnh sửa, xuất bản và chọn bài nổi bật cho trang blog CamStore.</p>
        </div>
        <button type="button" className="admin-btn primary large" onClick={resetForm}>
          <Plus size={22} /> Bài viết mới
        </button>
      </section>

      <section className="admin-table-card admin-category-form-card">
        <form className="admin-category-form admin-blog-form" onSubmit={handleSubmit}>
          <label>
            Tiêu đề
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
          </label>
          <label>
            Danh mục
            <input
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="Hướng dẫn, Đánh giá, Tin công nghệ..."
              required
            />
          </label>
          <label className="span-2">
            Tóm tắt
            <textarea
              value={form.excerpt}
              onChange={(event) => updateField('excerpt', event.target.value)}
              placeholder="Một đoạn mô tả ngắn cho bài viết"
              rows={3}
            />
          </label>
          <label className="admin-file-control span-2">
            <span className="field-label">Upload ảnh bìa</span>
            <span className="admin-file-trigger">
              <ImagePlus size={20} />
              {uploading ? 'Đang upload...' : 'Chọn ảnh'}
            </span>
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading} />
          </label>
          {form.cover_image && (
            <div className="admin-upload-preview span-2">
              <img src={form.cover_image} alt="Ảnh bìa đã upload" />
              <small>Ảnh bìa đã sẵn sàng để lưu cùng bài viết.</small>
            </div>
          )}
          <label className="span-2 admin-blog-editor">
            Nội dung
            <ReactQuill theme="snow" value={form.content} onChange={(value) => updateField('content', value)} />
          </label>
          <label className="admin-check-row">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(event) => updateField('is_published', event.target.checked)}
            />
            Xuất bản ngay
          </label>
          <label className="admin-check-row">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) => updateField('is_featured', event.target.checked)}
            />
            Đặt làm bài nổi bật
          </label>
          <div className="admin-form-actions span-2">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <Save size={20} /> {editingId ? 'Lưu bài viết' : 'Tạo bài viết'}
            </button>
            {editingId && (
              <button className="admin-btn light" type="button" onClick={resetForm}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
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
            placeholder="Tìm theo tiêu đề, danh mục, tác giả hoặc nội dung..."
          />
        </label>
        <label className="admin-inline-select">
          <Newspaper size={22} />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
          <ChevronDown size={18} />
        </label>
      </section>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-blog-table admin-table-head-row">
          <span>Bài viết</span>
          <span>Danh mục</span>
          <span>Tác giả</span>
          <span>Trạng thái</span>
          <span>Nổi bật</span>
          <span>Ngày</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Đang tải bài viết...</div>
        ) : posts.length === 0 ? (
          <div className="admin-empty-row">Chưa có bài viết phù hợp.</div>
        ) : (
          posts.map((post) => (
            <div className="admin-blog-table admin-table-row" key={post.postId}>
              <div className="admin-blog-title">
                <img src={post.cover_image || fallbackCover} alt={post.title} />
                <div>
                  <strong>{post.title}</strong>
                  <small>{post.excerpt || post.slug}</small>
                </div>
              </div>
              <span>{post.category}</span>
              <span>{post.author}</span>
              <button type="button" className="admin-pill-button" onClick={() => togglePublish(post)}>
                {post.is_published ? <Eye size={17} /> : <EyeOff size={17} />}
                {post.is_published ? 'Đã xuất bản' : 'Bản nháp'}
              </button>
              <button type="button" className={post.is_featured ? 'admin-pill-button active' : 'admin-pill-button'} onClick={() => toggleFeatured(post)}>
                <Star size={17} />
                {post.is_featured ? 'Nổi bật' : 'Thường'}
              </button>
              <span>{post.date}</span>
              <div className="admin-row-actions">
                <button type="button" className="admin-row-action" aria-label="Sửa" onClick={() => startEdit(post)}>
                  <Edit3 size={20} />
                </button>
                <button type="button" className="admin-row-action" aria-label="Xóa" onClick={() => deletePost(post)}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}

        <div className="admin-table-footer">
          <p>
            Đang hiển thị {posts.length} / {pagination.total} bài viết
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
