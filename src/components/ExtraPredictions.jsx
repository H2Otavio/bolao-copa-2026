import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { translateTeam } from '../lib/countries'

// Extract just the country keys from translateTeam logic if needed
const ALL_COUNTRIES = [
  "Mexico", "South Africa", "South Korea", "Czech Republic", "Canada",
  "Bosnia and Herzegovina", "United States", "Paraguay", "Haiti", "Scotland",
  "Australia", "Turkey", "Brazil", "Morocco", "Qatar", "Switzerland",
  "Ivory Coast", "Ecuador", "Germany", "Curaçao", "Netherlands", "Japan",
  "Sweden", "Tunisia", "Iran", "New Zealand", "Spain", "Cape Verde",
  "Belgium", "Egypt", "Saudi Arabia", "Uruguay", "France", "Senegal",
  "Iraq", "Norway", "Argentina", "Algeria", "Austria", "Jordan",
  "Portugal", "Democratic Republic of the Congo", "England", "Croatia",
  "Uzbekistan", "Colombia", "Ghana", "Panama"
].sort((a, b) => translateTeam(a).localeCompare(translateTeam(b)))

export default function ExtraPredictions() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [predictions, setPredictions] = useState({
    champion: '',
    runner_up: '',
    third_place: '',
    top_scorer: ''
  })
  
  // Bloqueio do form: Aqui podemos definir a data de incio da copa (ou usar uma prop).
  // Por enquanto, vamos permitir sempre, e o admin pode alterar dps
  const isLocked = false; 

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('extra_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching extra predictions:', error)
      } else if (data) {
        setPredictions({
          champion: data.champion || '',
          runner_up: data.runner_up || '',
          third_place: data.third_place || '',
          top_scorer: data.top_scorer || ''
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setPredictions(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from('extra_predictions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const payload = {
        user_id: user.id,
        champion: predictions.champion || null,
        runner_up: predictions.runner_up || null,
        third_place: predictions.third_place || null,
        top_scorer: predictions.top_scorer || null,
        updated_at: new Date().toISOString()
      }

      if (existing) {
        await supabase.from('extra_predictions').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('extra_predictions').insert([payload])
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving extra predictions:', error)
      alert("Erro ao salvar! (O banco de dados precisa ter a tabela 'extra_predictions' criada no Supabase)")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up mt-6">
      
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
            🏆 Palpites do Torneio
          </h2>
          <p className="text-sm text-text-muted">
            Tente prever o pódio da Copa do Mundo e quem fará mais gols!
          </p>
        </div>

        <div className="space-y-5">
          {/* Champion */}
          <div>
            <label className="block text-sm font-bold text-accent-gold mb-1">Campeão</label>
            <select
              value={predictions.champion}
              onChange={(e) => handleChange('champion', e.target.value)}
              disabled={isLocked || saving}
              className="w-full p-3 rounded-lg bg-bg-primary border border-border focus:border-accent-green outline-none"
            >
              <option value="">Selecione a seleção campeã...</option>
              {ALL_COUNTRIES.map(c => (
                <option key={c} value={c}>{translateTeam(c)}</option>
              ))}
            </select>
          </div>

          {/* Runner-up */}
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-1">Vice-Campeão</label>
            <select
              value={predictions.runner_up}
              onChange={(e) => handleChange('runner_up', e.target.value)}
              disabled={isLocked || saving}
              className="w-full p-3 rounded-lg bg-bg-primary border border-border focus:border-accent-green outline-none"
            >
              <option value="">Selecione o vice...</option>
              {ALL_COUNTRIES.map(c => (
                <option key={c} value={c}>{translateTeam(c)}</option>
              ))}
            </select>
          </div>

          {/* Third Place */}
          <div>
            <label className="block text-sm font-bold text-orange-400 mb-1">Terceiro Lugar</label>
            <select
              value={predictions.third_place}
              onChange={(e) => handleChange('third_place', e.target.value)}
              disabled={isLocked || saving}
              className="w-full p-3 rounded-lg bg-bg-primary border border-border focus:border-accent-green outline-none"
            >
              <option value="">Selecione o terceiro lugar...</option>
              {ALL_COUNTRIES.map(c => (
                <option key={c} value={c}>{translateTeam(c)}</option>
              ))}
            </select>
          </div>

          {/* Top Scorer */}
          <div>
            <label className="block text-sm font-bold text-accent-green mb-1">Artilheiro da Copa</label>
            <input
              type="text"
              value={predictions.top_scorer}
              onChange={(e) => handleChange('top_scorer', e.target.value)}
              disabled={isLocked || saving}
              placeholder="Nome do jogador..."
              className="w-full p-3 rounded-lg bg-bg-primary border border-border focus:border-accent-green outline-none"
            />
          </div>

        </div>

        <div className="mt-8 flex justify-end items-center gap-4">
          {saved && <span className="text-accent-green text-sm font-bold animate-pulse">Salvo com sucesso!</span>}
          <button
            onClick={handleSave}
            disabled={saving || isLocked}
            className="px-6 py-3 bg-accent-green text-bg-primary font-bold rounded-lg hover:bg-accent-green/90 transition-all disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Palpites'}
          </button>
        </div>

      </div>
    </div>
  )
}
