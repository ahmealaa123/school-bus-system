import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { busName, date, presentCount, absentCount, supervisorName } = body;

    await resend.emails.send({
      from: "School Bus <onboarding@resend.dev>",
      to: "schoolbussystem11@gmail.com",
      subject: `📊 تقرير رحلة ${busName}`,
      html: `
        <div style="font-family: Arial; padding:20px; direction: rtl; text-align: right;">
          <h2 style="color: #4f46e5;">📊 تقرير الرحلة اليومية</h2>
          <p><strong>🚌 الباص:</strong> ${busName}</p>
          <p><strong>👩‍🏫 المشرفة:</strong> ${supervisorName || "غير محدد"}</p>
          <p><strong>📅 التاريخ:</strong> ${date}</p>
          <p style="color:green;"><strong>✅ الحضور:</strong> ${presentCount}</p>
          <p style="color:red;"><strong>❌ الغياب:</strong> ${absentCount}</p>
          <hr/>
          <p style="font-size:12px;color:gray;">
            نظام تسجيل الحضور الذكي
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false });
  }
}