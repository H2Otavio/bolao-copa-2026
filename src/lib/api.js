import { useState, useEffect } from 'react';

const API_URL = 'https://worldcup26.ir/get/games';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

export function useLiveScores() {
  const [liveMatches, setLiveMatches] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const cached = localStorage.getItem('wc_live_scores');
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setLiveMatches(data);
            setLoading(false);
            return;
          }
        }

        // Caso a API exija token futuramente, ele precisará ser injetado nos headers aqui
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Falha ao buscar dados da API ao vivo');
        const json = await res.json();
        
        // Mapear pelo match_number (id da API)
        const mapped = {};
        if (Array.isArray(json)) {
          json.forEach(m => {
            // A API usa strings para 'home_score' e 'away_score'
            mapped[m.id] = {
              score_home: parseInt(m.home_score, 10) || 0,
              score_away: parseInt(m.away_score, 10) || 0,
              finished: m.finished === "TRUE" || m.finished === true,
              time_elapsed: m.time_elapsed
            };
          });
        }
        
        setLiveMatches(mapped);
        localStorage.setItem('wc_live_scores', JSON.stringify({
          timestamp: Date.now(),
          data: mapped
        }));
      } catch (err) {
        console.warn("API de placares ao vivo inacessível. Usando dados do banco.", err);
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
    const interval = setInterval(fetchScores, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  return { liveMatches, loading };
}
