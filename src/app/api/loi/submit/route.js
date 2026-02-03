import { NextResponse } from "next/server";
import LOISubmission from "@/models/LOISubmission";
import connectDB from "@/config/db";
import { generateLOIPDF } from "@/lib/loi/generateLOIPDF";
import { sendLOIEmail } from "@/lib/loi/sendLOIEmail";     // ✅
  // ✅ Your existing

await connectDB();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Generate unique LOI ID
    const loiId = `LOI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const submissionData = {
      id: loiId,
      ...body,
      submitted_at: new Date(),
      email_sent: false,
      status: 'pending'
    };

    const newSubmission = new LOISubmission(submissionData);
    const savedSubmission = await newSubmission.save();

    // ✅ GENERATE PDF + SEND EMAIL (async, non-blocking)
    (async () => {
      try {
        const pdfBuffer = await generateLOIPDF(savedSubmission);
        await sendLOIEmail(savedSubmission, pdfBuffer);
        
        // Mark as emailed
        savedSubmission.email_sent = true;
        await savedSubmission.save();
      } catch (emailError) {
        console.error("PDF/Email failed:", emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      id: loiId,
      message: "LOI submitted successfully to QClinic! PDF sent to admin."
    }, { status: 201 });

  } catch (error) {
    console.error("LOI submission error:", error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Invalid data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
