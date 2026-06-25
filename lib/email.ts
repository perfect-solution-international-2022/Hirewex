import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationPin(to: string, name: string, pin: string) {
  await transporter.sendMail({
    from: `"Hirewex" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${pin} is your Hirewex verification code`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background:#000;padding:24px 32px;">
                      <span style="color:#22c55e;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Hirewex</span>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
                        Verify your email
                      </h1>
                      <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.5;">
                        Hi ${name}, enter the code below to confirm your email address and activate your account.
                      </p>

                      <!-- PIN box -->
                      <div style="background:#f3f4f6;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px;">
                        <span style="font-size:52px;font-weight:800;letter-spacing:14px;color:#111827;font-variant-numeric:tabular-nums;">${pin}</span>
                        <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">
                          This code expires in <strong>15 minutes</strong>
                        </p>
                      </div>

                      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                        If you didn't create a Hirewex account, you can safely ignore this email.
                        Someone may have entered your email by mistake.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
                      <p style="margin:0;font-size:12px;color:#d1d5db;">
                        © ${new Date().getFullYear()} Hirewex · This is an automated message, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
