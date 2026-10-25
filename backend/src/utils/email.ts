import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
})

export async function sendDisqualifiedEmail(toEmail: string, fullName: string) {
    await transporter.sendMail({
        from: `"Annotrix Platform" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "Exam Disqualification Notice",
        html: `<h2>Hello ${fullName},</h2>
      <p>Unfortunately, you did not pass any of your exams within the
      allowed attempts. Your account has been marked as
      <strong>disqualified</strong>.</p>
      <p>If you believe this is an error or would like to request a
      restart, please contact the admin.</p>`,
    })
}

export async function sendQualifiedEmail(email: string, name: string) {
    const subject = "Exam Qualification Notice";
    const html = `<h2>Hello ${name},</h2>
      <p>Congratulations! You have passed all your exams within the
      allowed attempts. Your account has been marked as
      <strong>qualified</strong>.</p>
      <p>You can now take start working, the admins will contact you henceforth.</p>
      <p>Best regards,<br>The Annotrix Team</p>`;

    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject, html });
}

export async function sendOTPEmail(email: string, code: string) {
    const subject = "Your Annotrix Verification Code";
    const html = `<h2>Verification Code</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      <p>Best regards,<br>The Annotrix Team</p>`;

    // For development convenience, always log the OTP to the console
    if (process.env.NODE_ENV !== "production") {
        console.log(`\n=================================================`);
        console.log(`🛠️  [DEV MODE] OTP verification code for ${email}: ${code}`);
        console.log(`=================================================\n`);
    }

    try {
        await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject, html });
    } catch (error) {
        console.error(`\n❌ Failed to send email via SMTP to ${email}. Check your SMTP credentials or domain verification status. Error:`, (error as Error).message);
        // Note: We don't throw here in development so the user can still proceed with the console logged code
        if (process.env.NODE_ENV === "production") {
            throw error;
        }
    }
}