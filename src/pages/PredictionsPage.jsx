import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'
import MatchCard from '../components/MatchCard'
import { useLiveScores } from '../lib/api'
import { generateKnockoutBracket } from '../lib/simulator'

const CUP_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']

export default function PredictionsPage() {
  const { user, league } = useAuth()
  const { liveMatches } = useLiveScores()
  const location = useLocation()

  // Initialize group from query param if available
  const initialGroup = new URLSearchParams(location.search).get('group') || 'A'
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)

  const [allMatches, setAllMatches] = useState([])
  const [allPredictionsMap, setAllPredictionsMap] = useState({})
  const [simulatedBracket, setSimulatedBracket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [saveSuccess, setSaveSuccess] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch ALL matches
      const { data: mData } = await supabase
        .from('matches')
        .select('*')
        .order('match_number')
      
      const allM = mData || []
      setAllMatches(allM)

      // Fetch ALL user's predictions
      const { data: pData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      const pMap = {}
      ;(pData || []).forEach(p => {
        pMap[p.match_id] = p
      })
      
      setAllPredictionsMap(pMap)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  const groupMatches = useMemo(() => new Set(allMatches.filter(m => m.cup_group && m.cup_group.length === 1).map(m => m.id)), [allMatches])

  const knockoutUnlocked = useMemo(() => {
    let count = 0
    const lockTime = new Date(Date.now() + 5 * 60 * 1000)

    allMatches.forEach(m => {
      if (m.cup_group && m.cup_group.length === 1) {
        const p = allPredictionsMap[m.id]
        const isFilled = p && p.score_home !== null && p.score_away !== null
        const hasStarted = m.match_date && new Date(m.match_date) < lockTime
        const hasResult = m.score_home !== null && m.score_away !== null
        
        if (isFilled || hasStarted || hasResult) {
          count++
        }
      }
    })
    return count >= 72
  }, [allPredictionsMap, allMatches])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Run Simulator when predictions change
  useEffect(() => {
    if (knockoutUnlocked) {
      try {
        const bracket = generateKnockoutBracket(allMatches, Object.values(allPredictionsMap))
        setSimulatedBracket(bracket)
      } catch (err) {
        console.error('Error generating knockout bracket:', err)
        setSimulatedBracket(null)
      }
    } else {
      setSimulatedBracket(null)
    }
  }, [knockoutUnlocked, allMatches, allPredictionsMap])

  // Filter matches for current view
  const displayMatches = allMatches.filter(m => m.cup_group === selectedGroup)

  // Scroll to match if URL contains matchId
  useEffect(() => {
    const matchId = new URLSearchParams(location.search).get('matchId')
    if (matchId && allMatches.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`match-${matchId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-4', 'ring-accent-gold', 'scale-[1.02]')
          setTimeout(() => el.classList.remove('ring-4', 'ring-accent-gold', 'scale-[1.02]'), 2000)
        }
      }, 100)
    }
  }, [allMatches, location.search])

  const handleSavePrediction = async (matchId, payload) => {
    // Handling deletion if payload signals to delete
    if (payload && payload.delete) {
      setSaving(prev => ({ ...prev, [matchId]: true }))
      try {
        const existing = allPredictionsMap[matchId]
        if (existing) {
          await supabase.from('predictions').delete().eq('id', existing.id)
          setAllPredictionsMap(prev => {
            const newMap = { ...prev }
            delete newMap[matchId]
            return newMap
          })
        }
      } catch (err) {
        console.error('Error deleting prediction:', err)
      } finally {
        setSaving(prev => ({ ...prev, [matchId]: false }))
      }
      return
    }

    // Fallback for older cached versions of MatchCard
    let scoreHome, scoreAway, isSimulated, simulatedTeamHome, simulatedTeamAway, advanceOnPenalties
    if (typeof payload === 'number') {
       // user has cached MatchCard calling onSave(id, h, a)
       scoreHome = payload
       scoreAway = arguments[2]
       isSimulated = false
    } else {
       ({ scoreHome, scoreAway, isSimulated, simulatedTeamHome, simulatedTeamAway, advanceOnPenalties } = payload)
    }

    if (scoreHome === '' || scoreAway === '' || scoreHome === undefined || scoreAway === undefined || scoreHome < 0 || scoreAway < 0 || isNaN(scoreHome) || isNaN(scoreAway)) return

    setSaving(prev => ({ ...prev, [matchId]: true }))
    setSaveSuccess(prev => ({ ...prev, [matchId]: false }))

    try {
      const existing = allPredictionsMap[matchId]
      const dbPayload = {
        score_home: scoreHome === null ? null : parseInt(scoreHome),
        score_away: scoreAway === null ? null : parseInt(scoreAway),
        is_simulated: isSimulated ?? false,
        simulated_team_home: simulatedTeamHome ?? null,
        simulated_team_away: simulatedTeamAway ?? null,
        advance_on_penalties: advanceOnPenalties ?? null,
        updated_at: new Date().toISOString()
      }

      if (existing) {
        await supabase
          .from('predictions')
          .update(dbPayload)
          .eq('id', existing.id)
          
        setAllPredictionsMap(prev => ({ ...prev, [matchId]: { ...existing, ...dbPayload } }))
      } else {
        const { data } = await supabase
          .from('predictions')
          .insert({
            user_id: user.id,
            match_id: matchId,
            ...dbPayload
          })
          .select()
          .single()

        if (data) {
          setAllPredictionsMap(prev => ({ ...prev, [matchId]: data }))
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
    const counts = {}
    const lockTime = new Date(Date.now() + 5 * 60 * 1000)
    
    allMatches.forEach(m => {
      const p = allPredictionsMap[m.id]
      const isFilled = p && p.score_home !== null && p.score_away !== null
      const hasStarted = m.match_date && new Date(m.match_date) < lockTime
      const hasResult = m.score_home !== null && m.score_away !== null
      
      if (isFilled || hasStarted || hasResult) {
        if (m.cup_group) {
          counts[m.cup_group] = (counts[m.cup_group] || 0) + 1
        }
      }
    })
    
    setPredCounts(counts)
  }, [allPredictionsMap, allMatches])

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
        matchesPerGroup={selectedGroup.length > 1 ? 0 : 6}
        knockoutUnlocked={knockoutUnlocked}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 mt-6 animate-slide-up">
          {displayMatches.map((match) => {
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
                prediction={allPredictionsMap[match.id]}
                onSave={handleSavePrediction}
                saving={saving[match.id]}
                saved={saveSuccess[match.id]}
                liveData={live}
                simulatedMatch={simulatedBracket ? simulatedBracket[match.match_number] : null}
              />
            )
          })}
          {displayMatches.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-text-muted text-lg">Nenhum jogo encontrado para {selectedGroup}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
