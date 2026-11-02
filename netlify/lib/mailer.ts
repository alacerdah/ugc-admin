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

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Layout compartilhado dos emails transacionais, no padrão visual do admin
// (fundo lilás claro, cartão branco, faixa degradê azul→roxo, botão sólido azul).
// Email HTML não suporta backdrop-filter/gradient-text do site — por isso tudo aqui
// usa tabelas e cores sólidas, que renderizam igual em Gmail/Outlook/Apple Mail.
function layout(title: string, bodyHtml: string) {
  return `
    <!doctype html>
    <html lang="pt-br">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0; padding:32px 16px; background-color:#f6f8ff; font-family:'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto;">
          <tr>
            <td style="background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 18px 45px -22px rgba(59,107,255,0.28);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td height="6" style="background:linear-gradient(100deg, #3b6bff 0%, #8b5cf6 100%); background-color:#3b6bff; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:36px 36px 8px;">
                    <span style="font-size:18px; font-weight:800; color:#0f1535;">UGC&nbsp;Admin</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 36px 36px; font-size:15px; line-height:1.6; color:#0f1535;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 12px 0; text-align:center; font-size:12px; color:#8a91ad;">
              Se você não esperava este email, pode ignorar com segurança.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function button(label: string, url: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td bgcolor="#3b6bff" style="background:linear-gradient(100deg, #3b6bff 0%, #8b5cf6 100%); background-color:#3b6bff; border-radius:12px;">
          <a href="${url}" style="display:inline-block; padding:13px 26px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter().sendMail({
    from: fromAddress(),
    to,
    subject: "Redefinir sua senha — UGC Admin",
    html: layout(
      "Redefinir sua senha",
      `
        <p style="margin:0 0 4px; font-weight:700;">Redefinir sua senha</p>
        <p style="margin:0; color:#5b6385;">Recebemos um pedido para redefinir a senha da sua conta.</p>
        ${button("Escolher nova senha", resetUrl)}
        <p style="margin:0; font-size:13px; color:#8a91ad;">O link expira em 1 hora. Se não foi você quem pediu, não precisa fazer nada.</p>
      `,
    ),
  });
}

export async function sendInviteEmail(to: string, name: string, setUrl: string) {
  const safeName = escapeHtml(name);
  await transporter().sendMail({
    from: fromAddress(),
    to,
    subject: "Você foi convidada pro UGC Admin",
    html: layout(
      "Você foi convidada pro UGC Admin",
      `
        <p style="margin:0 0 4px; font-weight:700;">Oi, ${safeName}!</p>
        <p style="margin:0; color:#5b6385;">Você foi convidada a acessar o UGC Admin.</p>
        ${button("Definir senha e entrar", setUrl)}
        <p style="margin:0; font-size:13px; color:#8a91ad;">O link expira em 1 hora.</p>
      `,
    ),
  });
}
