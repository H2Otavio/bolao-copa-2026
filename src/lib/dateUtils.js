export function parseMatchDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  // O banco de dados agora possui o horário oficial em UTC real.
  // Não precisamos mais do hack de somar horas artificiais.
  return d
}
