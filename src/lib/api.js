export function useLiveScores() {
  // O hook foi desativado. 
  // Agora a sincronização ocorre diretamente no backend (via GitHub Actions) 
  // que atualiza a tabela 'matches' no banco de dados.
  // Retornamos um objeto vazio para manter a compatibilidade com a UI existente sem quebrar nada.
  return { liveMatches: {}, loading: false };
}
