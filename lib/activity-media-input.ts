import { ActivityMediaType } from "@prisma/client";
import { uploadActivityMediaField } from "@/lib/s3-upload";

type ExistingMedia = { type: ActivityMediaType; url: string; caption: string | null; position: number };

// Existing URLs come exclusively from the authorized database record, never from the form.
export async function getActivityMediaInput(formData: FormData, existing: ExistingMedia[] = []) {
  const result: ExistingMedia[] = [];
  for (const position of [1, 2, 3]) {
    if (formData.get(`media${position}Remove`) === "on") continue;
    const uploaded = await uploadActivityMediaField(formData, `media${position}File`);
    const previous = existing.find((item) => item.position === position);
    const source = uploaded ?? previous;
    if (!source) continue;
    const caption = formData.get(`media${position}Caption`);
    result.push({
      type: source.type,
      url: source.url,
      caption: typeof caption === "string" ? caption.trim() || null : previous?.caption ?? null,
      position
    });
  }
  return result;
}
