import { saveResponse } from "@/lib/server/db";
import { parseSubmission } from "@/lib/server/submission";

// Receives the feedback form (multipart form data, including photos).
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "The form data couldn't be read." }, { status: 400 });
  }

  const result = await parseSubmission(form);
  if (!result.ok) return Response.json(result, { status: 400 });

  try {
    saveResponse(result.response, result.images);
  } catch (err) {
    console.error("Saving feedback failed:", err);
    return Response.json({ ok: false, error: "Your feedback couldn't be saved. Please try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
