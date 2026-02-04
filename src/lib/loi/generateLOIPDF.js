// src/lib/loi/generateLOIPDF.js
import { jsPDF } from 'jspdf';

export async function generateLOIPDF(submission) {
  // 1. Initialize jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });
  
  // Register fonts for better letter formatting
  doc.setFont('times');

  const {
    id, clinic_profile, software_usefulness, valuable_features = [],
    problem_severity, current_opd_management, frequent_opd_problems = [],
    willingness_to_use, barriers_to_adoption = [], willingness_to_pay,
    fee_range, recommendation_likelihood, mobile_number, submitted_at,
    signature
  } = submission;

  const date = submitted_at ? new Date(submitted_at) : new Date();
  
  const pageWidth = doc.internal.pageSize.getWidth(); 
  const contentWidth = pageWidth - 100;
  const marginLeft = 72; // Standard letter margin
  const marginTop = 72;

  // Helper functions
  const setFillColor = (hex) => doc.setFillColor(hex);
  const setTextColor = (hex) => doc.setTextColor(hex);
  const setStrokeColor = (hex) => doc.setDrawColor(hex);

  // ==================== PROFESSIONAL LETTER HEADER ====================
  let y = marginTop;
  
  // Qlinic Logo/Company Name - Larger, Professional
  setTextColor('#1a1a2e');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('QLINIC', marginLeft, y);
  
  // Subtitle

    
  // Company Email
  y += 18;
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Email: admin@qlinichealth.com', marginLeft, y);
    
  // Letter Number and Date
  y += 25;
  setTextColor('#1a1a2e');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Letter No: ${id.slice(0, 8).toUpperCase()}`, marginLeft, y);
  doc.text(`Date: ${date.toLocaleDateString('en-IN')}`, pageWidth - 150, y);
  
  // System Generated Notice
  y += 25;
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.text('SYSTEM GENERATED DOCUMENT - No Physical Signature Required', marginLeft, y);
  
  // Divider line
  y += 20;
  setStrokeColor('#cbd5e0');
  doc.setLineWidth(1);
  doc.line(marginLeft, y, pageWidth - marginLeft, y);
  
  y += 30;

  // ==================== INTRODUCTION ====================
  // y is already defined from header section
  setTextColor('#4a5568');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Expression of Interest for Qlinic Platform Adoption', marginLeft, y);
  
  y += 25;
  y += 20;

  // Blue divider
  setStrokeColor('#2196F3');
  doc.setLineWidth(2);
  doc.line(marginLeft, y, pageWidth - marginLeft, y);
  y += 30;

  // ==================== CLINIC CARD ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINIC DETAILS', marginLeft, y);
  y += 12;

  // Clinic details box
  setStrokeColor('#e2e8f0');
  doc.setLineWidth(1);
  doc.rect(marginLeft, y, contentWidth, 65); 
  
  const boxY = y + 18; // Text baseline adjustment

  // Column 1
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Clinic Name', marginLeft + 10, boxY);
  
  setTextColor('#1a1a2e');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clinic_profile?.clinic_name || 'N/A', marginLeft + 10, boxY + 13);

  setTextColor('#718096');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Specialty', marginLeft + 10, boxY + 30);
  
  setTextColor('#1a1a2e');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clinic_profile?.specialty || 'N/A', marginLeft + 10, boxY + 43);

  // Column 2
  const col2X = marginLeft + 180;
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Doctor / Owner', col2X, boxY);
  
  setTextColor('#1a1a2e');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clinic_profile?.doctor_name || 'N/A', col2X, boxY + 13);
  
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Contact', col2X, boxY + 30);
  
  setTextColor('#1a1a2e');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(mobile_number || 'N/A', col2X, boxY + 43);

  y += 85;

  // ==================== KEY METRICS ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY INTEREST INDICATORS', 50, y);
  

  const colWidth = (contentWidth - 20) / 4;
  const metrics = [
    { label: 'SOFTWARE\nVALUE', value: software_usefulness?.split(' ')[0] || 'N/A' },
    { label: 'WILLING\nTO USE', value: willingness_to_use, color: willingness_to_use === 'Yes' ? '#10b981' : '#ef4444' },
    { label: 'WILLING\nTO PAY', value: willingness_to_pay, color: willingness_to_pay === 'Yes' ? '#10b981' : '#ef4444' },
    { label: 'PRICE\nRANGE', value: fee_range }
  ];

  metrics.forEach((metric, i) => {
    const x = marginLeft + i * (colWidth + 5);
    
    setFillColor('#f7fafc');
    doc.rect(x, y, colWidth, 50, 'F');
    
    setTextColor('#718096');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    // jsPDF multiline text handling
    const splitLabel = doc.splitTextToSize(metric.label, colWidth - 10);
    doc.text(splitLabel, x + (colWidth/2), y + 15, { align: 'center' });

    setTextColor(metric.color || '#1a1a2e');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    // Handle long price ranges
    const valueText = metric.value || '-';
    const splitValue = doc.splitTextToSize(valueText, colWidth - 10);
    doc.text(splitValue, x + (colWidth/2), y + 35, { align: 'center' });
  });

  y += 65;

  // ==================== SURVEY INSIGHTS ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED SURVEY RESPONSES', 50, y);
  

  const addSurveyRow = (label, value) => {
    if (!value) return 0;
    const textStr = Array.isArray(value) ? value.slice(0, 3).join(' • ') : value;
    
    setTextColor('#4a5568');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 60, y);
    
    setTextColor('#1a1a2e');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Auto-wrap text
    const splitText = doc.splitTextToSize(textStr || '', contentWidth - 220);
    doc.text(splitText, 210, y);
    
    return 30;
  };

  y += addSurveyRow('Current OPD Management:', current_opd_management);
  y += addSurveyRow('Problem Severity:', problem_severity);
  y += addSurveyRow('Most Valued Features:', valuable_features);
  y += addSurveyRow('Key Problems Faced:', frequent_opd_problems);

  y += 20;

  // ==================== FORMAL DECLARATION ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMAL DECLARATION', 50, y);
  

  const declaration = `I, ${clinic_profile?.doctor_name || '__________________'}, representing ${clinic_profile?.clinic_name || '__________________'}, hereby express genuine interest in adopting Qlinic for our clinic operations. This Letter of Intent confirms our commitment to evaluate and implement Qlinic, contingent upon the platform demonstrating clear improvements in OPD efficiency.`;

  setTextColor('#1a1a2e');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDec = doc.splitTextToSize(declaration, contentWidth);
  doc.text(splitDec, 50, y, { align: 'justify', maxWidth: contentWidth });
  
  y += 85;

  // ==================== SIGNATURE SECTION ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZATION', 50, y);
  y += 15;

  const sigY = y;
  
  // Signature Image
  if (signature) {
    try {
      // jsPDF handles base64 image strings directly
      // Remove header if present, jsPDF usually prefers pure base64 but can often handle data URI
      doc.addImage(signature, 'PNG', 50, sigY, 180, 60);
    } catch (e) {
      setStrokeColor('#e2e8f0');
      doc.rect(50, sigY, 180, 60);
    }
  } else {
    setStrokeColor('#e2e8f0');
    doc.rect(50, sigY, 180, 60);
  }

  // Date Box
  doc.rect(400, sigY, 150, 60);
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.text('Date:', 410, sigY + 20);
  setTextColor('#1a1a2e');
  doc.setFontSize(13);
  doc.text(date.toLocaleDateString('en-IN'), 410, sigY + 45);

  y += 80;

  // ==================== CONTACT DETAILS ====================
  setTextColor('#1a1a2e');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Information:', marginLeft, y);
  
  y += 18;
  setTextColor('#4a5568');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${clinic_profile?.doctor_name || 'N/A'}`, marginLeft, y);
  
  y += 15;
  doc.text(`Clinic: ${clinic_profile?.clinic_name || 'N/A'}`, marginLeft, y);
  
  y += 15;
  doc.text(`Contact: ${mobile_number || 'N/A'}`, marginLeft, y);
  
  y += 30;

  // ==================== PROFESSIONAL FOOTER ====================
  // Ensure we have space for footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerStartY = pageHeight - 150; // Start footer 150pt from bottom
  
  if (y > footerStartY - 100) {
    // If content is too long, add a new page
    doc.addPage();
    y = marginTop;
  } else {
    y = footerStartY;
  }
  
  // System Generated Notice (at end)
  setTextColor('#718096');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a system generated document. No physical signature required.', marginLeft, y);
  
  y += 20;
  
  // Footer divider
  setStrokeColor('#4a5568');
  doc.setLineWidth(2);
  doc.line(marginLeft, y, pageWidth - marginLeft, y);
  y += 25;

  // Qlinic Logo in Footer
  setTextColor('#1a1a2e');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QLINIC', marginLeft, y);
  
 
  
  // Document Info
  y += 25;
  setTextColor('#4a5568');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Document Reference: ${id.slice(0, 8).toUpperCase()} | Generated on ${date.toLocaleDateString('en-IN')}`, 
    marginLeft, 
    y
  );
  
  // System Generated Notice
  y += 20;
  setTextColor('#718096');
  doc.setFontSize(10);
  doc.text('This is a system generated document. No physical signature required.', marginLeft, y);
  
  // Corre Sub Text
  y += 20;
  setTextColor('#a0d8ef');
  doc.setFontSize(9);
  doc.text('Corre Sub Text: Digital Healthcare Solutions', marginLeft, y);

  // Return Buffer for your API
  return Buffer.from(doc.output('arraybuffer'));
}