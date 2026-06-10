export function parseMatchDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  // The API data timezone is 4 hours behind Brasilia time, so we adjust it +4h
  d.setHours(d.getHours() + 4)
  return d
}
