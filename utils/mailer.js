const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRegistrationEmail = async (to, name, email, password, position, role, regards) => {
  const loginUrl = `${process.env.CLIENT_URL}/login`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
      <div style="background-color: #4f46e5; color: white; padding: 20px 30px;">
        <h2 style="margin: 0;">👋 Welcome, ${name}!</h2>
        <p style="margin: 5px 0 0;">You've been successfully added to the system.</p>
      </div>

      <div style="padding: 30px; background-color: #fafafa;">
        <p style="font-size: 16px; margin-bottom: 20px;">Here are your account details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Email:</strong></td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Password:</strong></td>
            <td style="padding: 8px 0;">${password}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Position:</strong></td>
            <td style="padding: 8px 0;">${position}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Role:</strong></td>
            <td style="padding: 8px 0;">${role}</td>
          </tr>
        </table>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">🔐 Login Now</a>
        </div>

        <p style="font-size: 14px; color: #666;">Please make sure to change your password after logging in.</p>
      </div>

      <div style="padding: 20px 30px; background-color: #f1f1f1; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #333;">Best regards,</p>
        <p style="margin: 0; font-weight: bold; color: #4f46e5;">${regards || "Admin"}</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Admin Panel" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Your Account Has Been Created!",
    html,
  });
};

module.exports = { sendRegistrationEmail };
