import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ReceiptText,
  RotateCcw,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { formatPrice } from '../../utils/helpers.js';

const pageSize = 10;

const paymentStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
const paymentMethods = ['cod', 'vnpay', 'momo', 'cash', 'bank_transfer', 'pos_card'];

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

const getStatusClass = (status) => {
  if (['completed', 'refunded'].includes(status)) {
    return 'done';
  }

  if (['failed', 'rejected'].includes(status)) {
    return 'cancel';
  }

  return 'waiting';
};

const canRefundPayment = (payment) => payment.status === 'completed';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [refundPayment, setRefundPayment] = useState(null);
  const [refundDecision, setRefundDecision] = useState('completed');
  const [refundReason, setRefundReason] = useState('');
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

  const openRefundModal = (payment) => {
    if (!canRefundPayment(payment)) {
      return;
    }

    setRefundPayment(payment);
    setRefundDecision('completed');
    setRefundReason('');
    setNotice('');
    setError('');
  };

  const closeRefundModal = () => {
    if (saving) {
      return;
    }

    setRefundPayment(null);
    setRefundDecision('completed');
    setRefundReason('');
  };

  const submitRefund = async (event) => {
    event.preventDefault();

    if (!refundPayment) {
      return;
    }

    if (refundDecision === 'rejected' && !refundReason.trim()) {
      setError('Vui lòng nhập lý do từ chối hoàn tiền.');
      return;
    }

    const actionText = refundDecision === 'completed'
      ? 'Hệ thống sẽ hủy đơn hàng trước rồi đánh dấu thanh toán đã hoàn tiền. Tiếp tục?'
      : 'Xác nhận từ chối yêu cầu hoàn tiền?';

    if (!window.confirm(actionText)) {
      return;
    }

    setSaving(true);
    setNotice('');
    setError('');

    try {
      await adminService.createRefund(refundPayment.id, {
        amount: refundPayment.amount,
        status: refundDecision,
        reason: refundDecision === 'rejected' ? refundReason.trim() : 'Admin chấp nhận hoàn tiền',
      });

      setNotice(refundDecision === 'completed' ? 'Đã hủy đơn và hoàn tiền.' : 'Đã từ chối yêu cầu hoàn tiền.');
      closeRefundModal();
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Không xử lý được hoàn tiền.');
    } finally {
      setSaving(false);
    }
  };

  const confirmBankTransfer = async (payment) => {
    if (!window.confirm('Xác nhận đã nhận chuyển khoản cho thanh toán này?')) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await adminService.confirmBankTransferPayment(payment.id);
      setNotice('Đã xác nhận chuyển khoản và cập nhật đơn hàng.');
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xác nhận chuyển khoản.');
    }
  };

  return (
    <main className="admin-content">
      <section className="admin-page-head">
        <div>
          <h1>Quản lý thanh toán</h1>
          <p>Theo dõi giao dịch, xác nhận chuyển khoản và xử lý hoàn tiền theo từng đơn hàng.</p>
        </div>
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
          payments.map((payment) => {
            const refundable = canRefundPayment(payment);

            return (
              <div className="admin-payment-table admin-table-row" key={payment.id}>
                <div>
                  <strong>#{payment.id}</strong>
                  <small>{payment.transactionId || payment.createdAt || 'Chưa có giao dịch'}</small>
                </div>
                <span>#{payment.orderId}</span>
                <span>{methodLabels[payment.method] || payment.method}</span>
                <b>{formatPrice(payment.amount)}</b>
                <span className={`admin-status ${getStatusClass(payment.status)}`}>
                  {statusLabels[payment.status] || payment.status}
                </span>
                <div className="admin-refund-stack">
                  {payment.refunds.length === 0 ? (
                    <small>Chưa có</small>
                  ) : (
                    payment.refunds.map((refund) => (
                      <div key={refund.id} className={`admin-refund-note ${getStatusClass(refund.status)}`}>
                        <strong>{statusLabels[refund.status] || refund.status}</strong>
                        <small>{refund.reason}</small>
                      </div>
                    ))
                  )}
                </div>
                <div className="admin-refund-stack">
                  {payment.method === 'bank_transfer' && payment.status === 'pending' && (
                    <button type="button" className="admin-pill-button active" onClick={() => confirmBankTransfer(payment)}>
                      Xác nhận chuyển khoản
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-pill-button"
                    disabled={!refundable}
                    title={refundable ? 'Xử lý hoàn tiền cho thanh toán này' : 'Chỉ payment hoàn tất mới được hoàn tiền'}
                    onClick={() => openRefundModal(payment)}
                  >
                    <RotateCcw size={17} /> Hoàn tiền
                  </button>
                </div>
              </div>
            );
          })
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

      {refundPayment && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal" role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <div>
                <h2>Xử lý hoàn tiền</h2>
                <p>
                  Payment #{refundPayment.id} - Đơn #{refundPayment.orderId} - {formatPrice(refundPayment.amount)}
                </p>
              </div>
              <button type="button" className="admin-modal-close" aria-label="Đóng form" onClick={closeRefundModal}>
                <X size={20} />
              </button>
            </div>

            <form className="admin-category-form" onSubmit={submitRefund}>
              <div className="span-2 admin-refund-choice">
                <button
                  type="button"
                  className={refundDecision === 'completed' ? 'active' : ''}
                  onClick={() => setRefundDecision('completed')}
                >
                  <CheckCircle2 size={20} /> Chấp nhận
                </button>
                <button
                  type="button"
                  className={refundDecision === 'rejected' ? 'active danger' : 'danger'}
                  onClick={() => setRefundDecision('rejected')}
                >
                  <Ban size={20} /> Từ chối
                </button>
              </div>

              {refundDecision === 'completed' ? (
                <p className="span-2 admin-refund-hint">
                  Khi chấp nhận, hệ thống sẽ hủy đơn hàng trước rồi chuyển payment sang trạng thái đã hoàn tiền.
                  Với COD, nghiệp vụ chỉ hợp lệ khi đơn đã giao và payment đã hoàn tất.
                </p>
              ) : (
                <label className="span-2">
                  Lý do từ chối
                  <textarea
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    placeholder="VD: Đơn không đủ điều kiện hoàn tiền, chưa nhận được sản phẩm hoàn trả..."
                    rows={3}
                    required
                  />
                </label>
              )}

              <div className="admin-form-actions span-2">
                <button className="admin-btn primary" type="submit" disabled={saving}>
                  {refundDecision === 'completed' ? 'Chấp nhận hoàn tiền' : 'Từ chối hoàn tiền'}
                </button>
                <button className="admin-btn secondary" type="button" disabled={saving} onClick={closeRefundModal}>
                  Hủy
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
