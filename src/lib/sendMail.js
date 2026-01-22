// lib/sendMail.js
import transporter from '@/config/nodemailer'


export default async function sendMail({ to, subject, html, text, from }) {
  const sender = from || process.env.SMTP_FROM

  if (!sender) {
    throw new Error("SMTP_FROM is not defined in .env. Please set a verified sender email.")
  }

  try {
    const mailOptions = {
      from: `"Qlinic" <${sender}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html), // Auto-generate plain text from HTML
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
    })

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    }
  } catch (error) {
    console.error('Failed to send email:', {
      error: error.message,
      to: to,
      subject: subject,
    })

    throw new Error(`Email delivery failed: ${error.message}`)
  }
}

/**
 * Strip HTML tags for plain text fallback
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s\s+/g, ' ')
    .trim()
}
