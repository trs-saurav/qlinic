// lib/sendMail.js
import transporter from '@/config/nodemailer';

export async function sendLOIEmail(submission, pdfBuffer) {
  const {
    clinic_profile,
    willingness_to_use,
    willingness_to_pay,
    fee_range,
    mobile_number,
    id,
  } = submission;

  const to = "qlinic09@gmail.com";

  const subject = `New LOI: ${clinic_profile?.clinic_name || 'Clinic'} - ${
    clinic_profile?.doctor_name || 'Doctor'
  }`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #0F172A; margin-bottom: 4px;">New LOI Submission - Qlinic</h2>
      <p style="color: #6B7280; font-size: 14px; margin-top: 0;">A new Letter of Intent has been submitted for Qlinic.</p>

      <div style="background: #F9FAFB; padding: 16px 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin: 16px 0;">
        <h3 style="color: #0F172A; margin-top: 0; font-size: 15px;">Clinic Details</h3>
        <p style="margin: 4px 0;"><strong>Clinic:</strong> ${clinic_profile?.clinic_name || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Doctor:</strong> ${clinic_profile?.doctor_name || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Specialty:</strong> ${clinic_profile?.specialty || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Mobile:</strong> ${mobile_number || 'N/A'}</p>
      </div>

      <div style="background: #F9FAFB; padding: 16px 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin: 16px 0;">
        <h3 style="color: #0F172A; margin-top: 0; font-size: 15px;">Key Interest Signals</h3>
        <p style="margin: 4px 0;"><strong>Willing to Use:</strong> ${willingness_to_use || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Willing to Pay:</strong> ${willingness_to_pay || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Fee Range:</strong> ${fee_range || 'N/A'}</p>
      </div>

      <p style="color: #6B7280; font-size: 13px; margin-top: 16px;">
        The complete LOI document is attached as a PDF.<br/>
        <span style="color:#9CA3AF">Reference: ${id}</span>
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM || '"Qlinic" <no-reply@qlinichealth.com>',
    to,
    subject,
    html,
    attachments: [
      {
        filename: `LOI_${(clinic_profile?.clinic_name || 'clinic').replace(/\s/g, '_')}_${id}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return true;
}
