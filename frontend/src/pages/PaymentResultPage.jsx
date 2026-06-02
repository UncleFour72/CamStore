import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const getResultState = (params) => {
  const responseCode = params.get('vnp_ResponseCode');
  const transactionStatus = params.get('vnp_TransactionStatus');
  const momoCode = params.get('resultCode');
  const status = String(params.get('status') || '').toLowerCase();
  const vnpayOk = responseCode === '00' && (!transactionStatus || transactionStatus === '00');
  const momoOk = params.get('resultCode') === '0';
  const genericOk = ['success', 'completed', 'paid'].includes(status);

  if (vnpayOk || momoOk || genericOk) {
    return 'success';
  }

  if (['pending', 'processing'].includes(status) || momoCode === '1000') {
    return 'pending';
  }

  return 'failed';
};

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const resultState = getResultState(searchParams);
  const Icon = resultState === 'success' ? CheckCircle2 : resultState === 'pending' ? Clock3 : XCircle;
  const title =
    resultState === 'success'
      ? 'Thanh toán thành công'
      : resultState === 'pending'
        ? 'Thanh toán đang xử lý'
        : 'Thanh toán chưa hoàn tất';
  const message =
    resultState === 'success'
      ? 'CamStore đã ghi nhận giao dịch. Bạn có thể theo dõi trạng thái đơn trong lịch sử đơn hàng.'
      : resultState === 'pending'
        ? 'Cổng thanh toán đang xác nhận giao dịch. Hãy kiểm tra lại đơn hàng sau ít phút trước khi thanh toán lại.'
        : 'Giao dịch bị hủy, thất bại hoặc chưa được xác nhận. Nếu đã bị trừ tiền, vui lòng liên hệ CamStore để kiểm tra.';

  return (
    <main className="page">
      <section className="container">
        <div className="empty-state payment-result">
          <Icon size={44} />
          <h1>{title}</h1>
          <p>{message}</p>
          <div className="profile-actions">
            <Link className="button primary" to="/orders">
              Xem đơn hàng
            </Link>
            <Link className="button secondary" to="/products">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
