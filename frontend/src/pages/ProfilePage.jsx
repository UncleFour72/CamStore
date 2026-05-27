import { Camera, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  return (
    <main className="page">
      <section className="container profile-grid">
        <div className="profile-card">
          <UserRound size={38} />
          <h1>Nguyễn Văn A</h1>
          <p>Thành viên CamStore Pro</p>
          <Link className="button secondary" to="/orders">
            Xem lịch sử đơn
          </Link>
        </div>

        <div className="profile-panels">
          <section className="panel soft-panel">
            <div className="section-title-row">
              <MapPin size={24} />
              <h2>Địa chỉ mặc định</h2>
            </div>
            <p>12 Nguyễn Huệ, Quận 1, Hồ Chí Minh</p>
          </section>
          <section className="panel soft-panel">
            <div className="section-title-row">
              <ShieldCheck size={24} />
              <h2>Quyền lợi bảo hành</h2>
            </div>
            <p>Vệ sinh cảm biến miễn phí 2 lần/năm cho đơn hàng full-frame.</p>
          </section>
          <section className="panel soft-panel">
            <div className="section-title-row">
              <Camera size={24} />
              <h2>Gear đang quan tâm</h2>
            </div>
            <p>Sony Alpha A7 IV Body, FE 85mm F1.4 GM.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
