import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Streams the syllabus / grading-sheet export from the API to the browser.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offeringId = searchParams.get('offeringId');
  const kind = searchParams.get('kind');
  const format = searchParams.get('format') ?? '';
  if (!offeringId || (kind !== 'syllabus' && kind !== 'grading-sheet')) {
    return NextResponse.json({ error: 'offeringId and kind are required' }, { status: 400 });
  }

  const res = await fetch(
    `${API_URL}/course-offerings/${encodeURIComponent(offeringId)}/export/${kind}?format=${encodeURIComponent(format)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: res.status });
  }
  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
    },
  });
}
