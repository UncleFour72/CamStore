import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ReceiptText,
  RotateCcw,
  Save,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { formatPrice } from '../../utils/helpers.js';

const pageSize = 10;

const paymentStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
const paymentMethods = ['cod', 'vnpay', 'momo', 'cash', 'bank_transfer', 'pos_card'];
const refundStatuses = ['pending', 'approved', 'completed', 'rejected'];

const statusLabels = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const methodLabels = {
  cod: 'COD',
  vnpay: 'VNPay',
  momo: 'MoMo',
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  pos_card: 'Thẻ tại quầy',
};

const emptyRefundForm = {
  paymentId: '',
  amount: '',
  reason: '',
  status: 'pending',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [refundForm, setRefundForm] = useState(emptyRefundForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: pageSize };

    if (status) {
      next.status = status;
    }

    if (method) {
      next.payment_method = method;
    }

    return next;
  }, [page, status, method]);

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminService.getPayments(params);
      setPayments(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const updateRefundField = (field, value) => {
    setRefundForm((current) => ({ ...current, [field]: value }));
  };

  const startRefund = (payment) => {
    setRefundForm({
      paymentId: payment.id,
      amount: payment.amount,
      reason: '',
      status: 'pending',
    });
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createRefund = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      await adminService.createRefund(refundForm.paymentId, {
        amount: Number(refundForm.amount),
        reason: refundForm.reason,
        status: refundForm.status,
      });
      setRefundForm(emptyRefundForm);
      setNotice('Đã tạo yêu cầu hoàn tiền.');
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được yêu cầu hoàn tiền.');
    } finally {
      setSaving(false);
    }
  };

  const updateRefundStatus = async (payment, refund, nextStatus) => {
    setError('');
    setNotice('');

    try {
      await adminService.updateRefundStatus(payment.id, refund.id, nextStatus);
      setNotice('Đã cập nhật trạng thái hoàn tiền.');
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái hoàn tiền.');
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý thanh toán</h1>
          <p>Theo dõi trạng thái thanh toán, phương thức trả tiền và các yêu cầu hoàn tiền.</p>
        </div>
      </section>

      <section className="admin-table-card admin-category-form-card">
        <form className="admin-category-form admin-refund-form" onSubmit={createRefund}>
          <label>
            Mã payment
            <input
              value={refundForm.paymentId}
              onChange={(event) => updateRefundField('paymentId', event.target.value)}
              placeholder="VD: 12"
              required
            />
          </label>
          <label>
            Số tiền hoàn
            <input
              type="number"
              min="1"
              value={refundForm.amount}
              onChange={(event) => updateRefundField('amount', event.target.value)}
              required
            />
          </label>
          <label>
            Trạng thái
            <select value={refundForm.status} onChange={(event) => updateRefundField('status', event.target.value)}>
              {refundStatuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Lý do hoàn tiền
            <textarea
              value={refundForm.reason}
              onChange={(event) => updateRefundField('reason', event.target.value)}
              placeholder="Khách hủy đơn, lỗi thanh toán, đổi trả..."
              rows={3}
              required
            />
          </label>
          <div className="admin-form-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <Save size={20} /> Tạo hoàn tiền
            </button>
          </div>
        </form>
      </section>

      <section className="admin-filter-card product-filter">
        <label className="admin-inline-select">
          <ReceiptText size={22} />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
        <label className="admin-inline-select">
          <CreditCard size={22} />
          <select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả phương thức</option>
            {paymentMethods.map((item) => (
              <option key={item} value={item}>
                {methodLabels[item]}
              </option>
            ))}
          </select>
          <ChevronDown size={18} />
        </label>
      </section>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="admin-table-card">
        <div className="admin-payment-table admin-table-head-row">
          <span>Thanh toán</span>
          <span>Đơn hàng</span>
          <span>Phương thức</span>
          <span>Số tiền</span>
          <span>Trạng thái</span>
          <span>Hoàn tiền</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className="admin-empty-row">Đang tải thanh toán...</div>
        ) : payments.length === 0 ? (
          <div className="admin-empty-row">Chưa có thanh toán phù hợp.</div>
        ) : (
          payments.map((payment) => (
            <div className="admin-payment-table admin-table-row" key={payment.id}>
              <div>
                <strong>#{payment.id}</strong>
                <small>{payment.transactionId || payment.createdAt || 'Chưa có giao dịch'}</small>
              </div>
              <span>#{payment.orderId}</span>
              <span>{methodLabels[payment.method] || payment.method}</span>
              <b>{formatPrice(payment.amount)}</b>
              <span className={`admin-status ${payment.status === 'completed' ? 'done' : payment.status === 'failed' ? 'cancel' : 'waiting'}`}>
                {statusLabels[payment.status] || payment.status}
              </span>
              <div className="admin-refund-stack">
                {payment.refunds.length === 0 ? (
                  <small>Chưa có</small>
                ) : (
                  payment.refunds.map((refund) => (
                    <label key={refund.id} className="admin-status-select">
                      <select
                        value={refund.status}
                        onChange={(event) => updateRefundStatus(payment, refund, event.target.value)}
                      >
                        {refundStatuses.map((item) => (
                          <option key={item} value={item}>
                            {statusLabels[item]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))
                )}
              </div>
              <button type="button" className="admin-pill-button" onClick={() => startRefund(payment)}>
                <RotateCcw size={17} /> Hoàn tiền
              </button>
            </div>
          ))
        )}

        <div className="admin-table-footer">
          <p>
            Đang hiển thị {payments.length} / {pagination.total} thanh toán
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
