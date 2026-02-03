// app/api/loi/download/[id]/route.js
// PUBLIC ENDPOINT - No authentication required
import { NextResponse } from 'next/server';
import LOISubmission from '@/models/LOISubmission';
import connectDB from '@/config/db';
import { generateLOIPDF } from '@/lib/loi/generateLOIPDF';

// ✅ PRODUCTION-READY: Uses your pdfkit implementation
export async function GET(request, { params }) {
  try {
    await connectDB();


    
    const { id } = await params;
    
    // ✅ Validate LOI ID format (LOI-timestamp-random)
    if (!id || !id.match(/^LOI-\d{13}-[a-z0-9]{9}$/)) {
      return NextResponse.json({ error: 'Invalid submission ID format' }, { status: 400 });
    }

    // ✅ Fetch complete submission data by custom ID field
    const submission = await LOISubmission.findOne({ id }).lean();
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // ✅ Generate PDF using YOUR pdfkit function (50x faster than Puppeteer!)
    const pdfBuffer = await generateLOIPDF(submission);

    // ✅ Professional, SEO-friendly filename
    const fileName = `LOI_${submission.clinic_profile?.clinic_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Clinic'}_${submission.id.split('-')[2]}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // ✅ Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Download-Id': submission.id // ✅ Track downloads
      }
    });

  } catch (error) {
    console.error('LOI PDF Download Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}
