export function parseMatchDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  // O fuso horário salvo no banco em UTC precisa de +6h para bater com o horário de Brasília (ex: 13:00 UTC -> 16:00 BRT)
  d.setHours(d.getHours() + 6)
  return d
}
