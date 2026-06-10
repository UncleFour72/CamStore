import nodemailer from 'nodemailer';

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
};

let transporter = null;

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth,
    });
  }

  return transporter;
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl, expiresInMinutes }) => {
  const sender = getTransporter();

  if (!sender) {
    console.info('[user-service] SMTP is not configured. Password reset link:', resetUrl);
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  const safeName = escapeHtml(name || 'khách hàng');
  const appName = process.env.MAIL_APP_NAME || 'CamStore';

  await sender.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `[${appName}] Đặt lại mật khẩu`,
    text: [
      `Xin chào ${name || 'khách hàng'},`,
      '',
      `Bạn vừa yêu cầu đặt lại mật khẩu ${appName}.`,
      `Liên kết này có hiệu lực trong ${expiresInMinutes} phút:`,
      resetUrl,
      '',
      'Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <h2>Đặt lại mật khẩu ${escapeHtml(appName)}</h2>
        <p>Xin chào ${safeName},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết này có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.</p>
        <p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;background:#0077a3;color:#fff;text-decoration:none;border-radius:6px">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Nếu nút không hoạt động, hãy sao chép liên kết sau vào trình duyệt:</p>
        <p style="word-break:break-all">${escapeHtml(resetUrl)}</p>
        <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.</p>
      </div>
    `,
  });

  return { delivered: true };
};
