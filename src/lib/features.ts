/**
 * Image uploads are paused while the vision pipeline is upgraded.
 *
 * Set to true to re-enable. The composer, the chat route, the safety classifier, and the
 * model message builder all read this flag, so one change re-opens the whole path.
 */
export const IMAGE_UPLOADS_ENABLED = true;

export const IMAGE_UPLOADS_PAUSED_MESSAGE =
  "Image uploads are temporarily paused while we upgrade our vision systems. Documents (PDFs) and code/text files are fully supported.";

/** True for any MIME type in the image/* family. */
export function isImageMimeType(type: string | null | undefined): boolean {
  return typeof type === "string" && type.trim().toLowerCase().startsWith("image/");
}
