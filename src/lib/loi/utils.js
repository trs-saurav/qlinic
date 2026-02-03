// lib/loi/utils.js
export function generateLOIId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `LOI-${timestamp}-${random}`;
}

// Placeholder for PDF/Email (implement later)
export async function sendLOIPDFEmail(submission) {
  console.log('📧 Would send PDF to admin for:', submission.id);
  // Add your PDF + email logic here
}
