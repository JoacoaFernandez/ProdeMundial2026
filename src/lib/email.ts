import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`

  await resend.emails.send({
    from: 'PRODE 2026 <onboarding@resend.dev>',
    to: email,
    subject: 'Verificá tu cuenta — PRODE Mundial 2026',
    html: `
      <h2>Hola ${name}!</h2>
      <p>Gracias por registrarte en PRODE Mundial 2026.</p>
      <p>Hacé click en el siguiente link para verificar tu cuenta:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:white;border-radius:6px;text-decoration:none;">
        Verificar cuenta
      </a>
      <p>El link expira en 24 horas.</p>
      <p>Si no creaste esta cuenta, ignorá este email.</p>
    `,
  })
}
