const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
export function safeUrl(value, { media = false } = {}) {
  if (typeof value !== "string" || !value || /[\u0000-\u0020\\]/.test(value))
    return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (!media && value.startsWith("#") && idPattern.test(value.slice(1)))
    return value;
  try {
    const u = new URL(value);
    if (u.username || u.password) return null;
    if (u.protocol === "https:" || (!media && u.protocol === "mailto:"))
      return u.href;
  } catch {}
  return null;
}
