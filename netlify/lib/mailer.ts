import nodemailer from "nodemailer";

// Remetente dos emails. EMAIL_FROM permite usar um endereço do domínio próprio
// quando o SMTP_USER é só o login técnico do serviço de envio (Brevo).
const fromAddress = () => `"UGC Admin" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`;

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter().sendMail({
    from: fromAddress(),
    to,
    subject: "Redefinir sua senha — UGC Admin",
    html: `
      <p>Recebemos um pedido para redefinir sua senha.</p>
      <p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a>. O link expira em 1 hora.</p>
      <p>Se não foi você quem pediu, pode ignorar este email.</p>
    `,
  });
}
