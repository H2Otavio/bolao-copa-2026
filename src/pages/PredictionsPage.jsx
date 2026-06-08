import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'
import MatchCard from '../components/MatchCard'
import { useLiveScores } from '../lib/api'

const CUP_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']

export default function PredictionsPage() {
  const { user, league } = useAuth()
  const { liveMatches } = useLiveScores()
  const location = useLocation()
  
  // Initialize group from query param if available
  const initialGroup = new URLSearchParams(location.search).get('group') || 'A'
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)
  
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [saveSuccess, setSaveSuccess] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch matches for selected group
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('cup_group', selectedGroup)
        .order('match_number')

      setMatches(matchData || [])

      // Fetch user's predictions for these matches
      if (matchData && matchData.length > 0) {
        const matchIds = matchData.map(m => m.id)
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)
          .in('match_id', matchIds)

        const predMap = {}
        ;(predData || []).forEach(p => {
          predMap[p.match_id] = p
        })
        setPredictions(predMap)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Scroll to match if URL contains matchId
  useEffect(() => {
    const matchId = new URLSearchParams(location.search).get('matchId')
    if (matchId && matches.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`match-${matchId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-4', 'ring-accent-gold', 'scale-[1.02]')
          setTimeout(() => el.classList.remove('ring-4', 'ring-accent-gold', 'scale-[1.02]'), 2000)
        }
      }, 100)
    }
  }, [matches, location.search])

  const handleSavePrediction = async (matchId, scoreHome, scoreAway) => {
    if (scoreHome === '' || scoreAway === '' || scoreHome < 0 || scoreAway < 0) return

    setSaving(prev => ({ ...prev, [matchId]: true }))
    setSaveSuccess(prev => ({ ...prev, [matchId]: false }))

    try {
      const existing = predictions[matchId]

      if (existing) {
        await supabase
          .from('predictions')
          .update({
            score_home: parseInt(scoreHome),
            score_away: parseInt(scoreAway),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        const { data } = await supabase
          .from('predictions')
          .insert({
            user_id: user.id,
            match_id: matchId,
            score_home: parseInt(scoreHome),
            score_away: parseInt(scoreAway),
          })
          .select()
          .single()

        if (data) {
          setPredictions(prev => ({ ...prev, [matchId]: data }))
        }
      }

      setSaveSuccess(prev => ({ ...prev, [matchId]: true }))
      setTimeout(() => setSaveSuccess(prev => ({ ...prev, [matchId]: false })), 2000)
    } catch (err) {
      console.error('Error saving prediction:', err)
    } finally {
      setSaving(prev => ({ ...prev, [matchId]: false }))
    }
  }

  // Count predictions per group for badges
  const [predCounts, setPredCounts] = useState({})
  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase
        .from('predictions')
        .select('match_id')
        .eq('user_id', user.id)

      if (data) {
        // Need to cross-reference with matches to get group
        const { data: allMatches } = await supabase
          .from('matches')
          .select('id, cup_group')

        if (allMatches) {
          const matchGroupMap = {}
          allMatches.forEach(m => { matchGroupMap[m.id] = m.cup_group })

          const counts = {}
          data.forEach(p => {
            const grp = matchGroupMap[p.match_id]
            if (grp) counts[grp] = (counts[grp] || 0) + 1
          })
          setPredCounts(counts)
        }
      }
    }
    fetchCounts()
  }, [user.id, predictions])

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Seus Palpites</h1>
        <p className="text-text-secondary">Selecione a fase e preencha seus placares</p>
      </div>

      <GroupTabs
        groups={CUP_GROUPS}
        selected={selectedGroup}
        onSelect={setSelectedGroup}
        predCounts={predCounts}
        matchesPerGroup={selectedGroup.length > 1 ? 0 : 6} // Mata-mata não tem 6 jogos exatos
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 mt-6 animate-slide-up">
          {matches.map((match) => {
            // Merge live scores
            const live = liveMatches[match.match_number]
            const mergedMatch = { ...match }
            if (live && (live.finished || live.score_home > 0 || live.score_away > 0)) {
              mergedMatch.score_home = live.score_home
              mergedMatch.score_away = live.score_away
            }

            return (
              <MatchCard
                key={match.id}
                match={mergedMatch}
                prediction={predictions[match.id]}
                onSave={handleSavePrediction}
                saving={saving[match.id]}
                saved={saveSuccess[match.id]}
                liveData={live}
              />
            )
          })}
          {matches.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-text-muted text-lg">Nenhum jogo encontrado para o Grupo {selectedGroup}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
