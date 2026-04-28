export function sanitizeFileName(fileName: string, fallback = "Untitled file") {
  return (
    fileName
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || fallback
  )
}
