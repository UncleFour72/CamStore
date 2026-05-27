export default function LoadingSpinner({ label = 'Đang tải' }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
