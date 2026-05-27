import { CheckCircle2, X } from 'lucide-react';

export default function ToastNotification({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status">
      <CheckCircle2 size={20} />
      <span>{message}</span>
      <button type="button" aria-label="Đóng thông báo" onClick={onClose}>
        <X size={17} />
      </button>
    </div>
  );
}
