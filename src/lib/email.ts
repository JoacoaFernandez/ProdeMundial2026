import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"PRODE Mundial 2026" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Resetear contraseña — PRODE Mundial 2026',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111">¡Hola, ${name}!</h2>
        <p>Recibimos una solicitud para resetear tu contraseña.</p>
        <p>Hacé click en el botón para elegir una nueva:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#84cc16;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">
          Resetear contraseña
        </a>
        <p style="color:#666;font-size:13px;">El link expira en 1 hora.</p>
        <p style="color:#666;font-size:13px;">Si no solicitaste esto, ignorá este email.</p>
      </div>
    `,
  })
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`

  await transporter.sendMail({
    from: `"PRODE Mundial 2026" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verificá tu cuenta — PRODE Mundial 2026',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#111">¡Hola, ${name}!</h2>
        <p>Gracias por registrarte en <strong>PRODE Mundial 2026</strong>.</p>
        <p>Hacé click en el botón para verificar tu cuenta:</p>
        <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#84cc16;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verificar cuenta
        </a>
        <p style="color:#666;font-size:13px;">El link expira en 24 horas.</p>
        <p style="color:#666;font-size:13px;">Si no creaste esta cuenta, ignorá este email.</p>
      </div>
    `,
  })
}
