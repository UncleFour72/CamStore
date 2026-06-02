import { ArrowLeft, CheckCircle2, CreditCard, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { formatPrice } from '../utils/helpers.js';

const methodLabels = {
  vnpay: 'VNPay',
  momo: 'MoMo',
};

export default function MockPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const paymentId = searchParams.get('payment_id');
  const method = searchParams.get('method') || 'vnpay';
  const amount = Number(searchParams.get('amount') || 0);
  const orderId = searchParams.get('order_id');
  const methodLabel = methodLabels[method] || method.toUpperCase();

  const returnQuery = useMemo(() => {
    const params = new URLSearchParams({
      provider: `mock_${method}`,
      payment_id: paymentId || '',
      order_id: orderId || '',
    });

    return params;
  }, [method, orderId, paymentId]);

  async function completePayment(result) {
    if (!paymentId) {
      setError('Thiếu mã giao dịch thanh toán.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await api.post(`/payments/mock/${paymentId}/complete`, { result });
      const params = new URLSearchParams(returnQuery);
      params.set('status', data.is_success ? 'success' : 'failed');

      navigate(`/payment/result?${params.toString()}`, { replace: true });
    } catch (completeError) {
      setError(completeError.response?.data?.message || 'Không thể giả lập thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="container mock-payment-shell">
        <div className="mock-payment-card">
          <div className="mock-payment-head">
            <CreditCard size={32} />
            <div>
              <span>Môi trường đồ án</span>
              <h1>Giả lập thanh toán {methodLabel}</h1>
            </div>
          </div>

          <div className="mock-payment-summary">
            <div>
              <span>Mã payment</span>
              <strong>#{paymentId || 'N/A'}</strong>
            </div>
            <div>
              <span>Mã đơn hàng</span>
              <strong>#{orderId || 'N/A'}</strong>
            </div>
            <div>
              <span>Số tiền</span>
              <strong>{formatPrice(amount)}</strong>
            </div>
          </div>

          <p>
            Hệ thống đang dùng thông tin sandbox placeholder, nên trang này thay thế cổng thật để test đầy đủ luồng:
            thanh toán thành công sẽ cập nhật payment thành đã thanh toán và chuyển đơn sang đã xác nhận.
          </p>

          {error && <p className="form-error">{error}</p>}

          <div className="mock-payment-actions">
            <button className="button primary" type="button" disabled={isSubmitting} onClick={() => completePayment('success')}>
              <CheckCircle2 size={19} />
              Thanh toán thành công
            </button>
            <button className="button danger" type="button" disabled={isSubmitting} onClick={() => completePayment('failed')}>
              <XCircle size={19} />
              Thanh toán thất bại
            </button>
          </div>

          <Link className="mock-payment-back" to="/orders">
            <ArrowLeft size={16} />
            Quay về đơn hàng
          </Link>
        </div>
      </section>
    </main>
  );
}
