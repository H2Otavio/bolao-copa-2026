const EMPTY_LIVE = {};

export function useLiveScores() {
  // O hook foi desativado. 
  // Agora a sincronização ocorre diretamente no backend (via GitHub Actions) 
  // que atualiza a tabela 'matches' no banco de dados.
  // Retornamos um objeto com referência estática para evitar loops infinitos nos useEffects.
  return { liveMatches: EMPTY_LIVE, loading: false };
}
