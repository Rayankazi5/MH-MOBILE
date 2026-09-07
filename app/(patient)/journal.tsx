import { useCallback, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { api, type JournalEntryItem } from '@/services/api'
import { FONT_SANS_BOLD, useShell } from '@/contexts/ShellContext'
import { ArxInput, GradientButton, Sans, Serif } from '@/components/patient/Arx'

const MOOD_TAGS = ['Anxious', 'Grateful', 'Tired', 'Hopeful', 'Overwhelmed', 'Calm', 'Numb', 'Energised']

const PROMPTS = [
  'How has your week felt overall? Take your time.',
  "What's been on your mind most this week?",
  "Is there anything that's been weighing on you?",
  "What's one thing that went well recently?",
]

type Msg = { from: 'bot' | 'user'; text: string }

export default function PatientJournal() {
  const { c } = useShell()
  const scrollRef = useRef<ScrollView>(null)

  const [mode, setMode] = useState<'interactive' | 'solo'>('interactive')

  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: PROMPTS[0] }])
  const [input, setInput] = useState('')
  const [promptIdx, setPromptIdx] = useState(1)
  const [chatSaved, setChatSaved] = useState(false)

  const [entry, setEntry] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [soloSaved, setSoloSaved] = useState(false)
  const [error, setError] = useState('')

  const [entries, setEntries] = useState<JournalEntryItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'solo'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const refreshEntries = () => { api.patient.journals().then(setEntries).catch(() => {}) }
  useFocusEffect(useCallback(refreshEntries, []))

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  const sendChat = () => {
    const text = input.trim()
    if (!text) return
    const next: Msg[] = [...msgs, { from: 'user', text }]
    if (promptIdx < PROMPTS.length) {
      next.push({ from: 'bot', text: PROMPTS[promptIdx] })
      setPromptIdx(p => p + 1)
    } else {
      next.push({ from: 'bot', text: 'Thank you for sharing. Your journal has been saved.' })
      const body = next.filter(m => m.from === 'user').map(m => m.text).join('\n\n')
      api.patient.submitJournal(body, 'chat').then(refreshEntries).catch(() => {})
      setChatSaved(true)
    }
    setMsgs(next)
    setInput('')
  }

  const saveSolo = async () => {
    const parts = [
      selectedTags.size ? `Mood: ${[...selectedTags].join(', ')}` : '',
      entry.trim(),
    ].filter(Boolean)
    if (!parts.length) return
    setSaving(true)
    setError('')
    try {
      await api.patient.submitJournal(parts.join('\n\n'), 'solo')
      setSoloSaved(true)
      refreshEntries()
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (t: string) => setSelectedTags(prev => {
    const next = new Set(prev)
    next.has(t) ? next.delete(t) : next.add(t)
    return next
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scrollRef} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Serif style={{ fontSize: 28, color: c.txt, marginBottom: 4 }}>e-Journal</Serif>
        <Sans style={{ color: c.txt3, fontSize: 13, marginBottom: 18 }}>{dateStr}</Sans>

        {/* Mode toggle */}
        <View style={[s.modeToggle, { backgroundColor: c.acc, borderColor: c.bdr }]}>
          {([['interactive', '💬 Interactive'], ['solo', '✍️ Solo']] as const).map(([m, lbl]) => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} style={[s.modeBtn, mode === m && { backgroundColor: c.pri }]}>
              <Sans bold style={{ fontSize: 14, color: mode === m ? '#fff' : c.txt3 }}>{lbl}</Sans>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'interactive' ? (
          <>
            <View style={{ gap: 10, marginBottom: 18, minHeight: 200 }}>
              {msgs.map((msg, i) => {
                const user = msg.from === 'user'
                const bubble = [s.bubble, user ? s.bubbleUser : s.bubbleBot]
                return (
                  <View key={i} style={{ alignItems: user ? 'flex-end' : 'flex-start' }}>
                    {user ? (
                      <LinearGradient colors={[c.pri, c.priDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubble}>
                        <Sans style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{msg.text}</Sans>
                      </LinearGradient>
                    ) : (
                      <View style={[bubble, { backgroundColor: c.surf, borderWidth: 1, borderColor: c.bdr }]}>
                        <Sans style={{ color: c.txt2, fontSize: 14, lineHeight: 22 }}>{msg.text}</Sans>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>

            {chatSaved ? (
              <View style={s.savedBox}>
                <Sans bold style={s.savedText}>✓ Journal saved — check Analysis for insights</Sans>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ArxInput
                  style={{ flex: 1 }} value={input} onChangeText={setInput}
                  placeholder="Type your response…" returnKeyType="send" onSubmitEditing={sendChat}
                />
                <TouchableOpacity onPress={sendChat} style={[s.sendBtnWrap, { shadowColor: c.pri }]}>
                  <LinearGradient colors={[c.pri, c.priDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.sendBtn}>
                    <Text style={{ color: '#fff', fontSize: 17 }}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={s.tagWrap}>
              {MOOD_TAGS.map(t => {
                const sel = selectedTags.has(t)
                return (
                  <TouchableOpacity
                    key={t} onPress={() => toggleTag(t)}
                    style={[s.moodTag, { borderColor: sel ? c.pri : c.bdr, backgroundColor: sel ? `${c.pri}20` : 'transparent' }]}
                  >
                    <Sans bold style={{ fontSize: 13, color: sel ? c.pri : c.txt3 }}>{t}</Sans>
                  </TouchableOpacity>
                )
              })}
            </View>

            <ArxInput
              value={entry} onChangeText={setEntry} multiline
              placeholder="Write freely. This is your space…"
              style={{ minHeight: 160, textAlignVertical: 'top', marginBottom: 10 }}
            />
            <Sans style={{ color: c.txt3, fontSize: 12, textAlign: 'right', marginBottom: 16 }}>{entry.length} characters</Sans>

            {error ? <Sans style={{ color: '#F87171', fontSize: 13, marginBottom: 10 }}>{error}</Sans> : null}

            {soloSaved ? (
              <View style={s.savedBox}>
                <Sans bold style={s.savedText}>✓ Saved to journal</Sans>
              </View>
            ) : (
              <GradientButton
                label={saving ? 'Saving…' : 'Save to Journal'}
                disabled={saving || (!entry.trim() && !selectedTags.size)}
                onPress={saveSolo}
              />
            )}
          </>
        )}

        {/* Past entries */}
        {entries.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {(['all', 'chat', 'solo'] as const).map(tab => {
                const active = activeTab === tab
                return (
                  <TouchableOpacity
                    key={tab} onPress={() => setActiveTab(tab)}
                    style={[s.filterTab, { borderColor: active ? c.pri : c.bdr, backgroundColor: active ? `${c.pri}20` : 'transparent' }]}
                  >
                    <Sans bold style={{ fontSize: 12, color: active ? c.pri : c.txt3 }}>
                      {tab === 'all' ? 'All' : tab === 'chat' ? '💬 Chat' : '✍️ Solo'}
                    </Sans>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={{ gap: 8 }}>
              {entries.filter(e => activeTab === 'all' || e.source === activeTab).map(e => {
                const dt = e.created_at ? new Date(e.created_at) : null
                const dateLabel = dt ? dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'
                const timeLabel = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                const expanded = expandedId === e.id
                const isEditing = editingId === e.id
                const isConfirmingDelete = confirmDeleteId === e.id
                const preview = e.body.slice(0, 80) + (e.body.length > 80 ? '…' : '')

                const startEdit = () => { setEditingId(e.id); setEditText(e.body); setExpandedId(e.id) }
                const saveEdit = async () => {
                  if (!editText.trim()) return
                  setEditSaving(true)
                  try {
                    await api.patient.editJournal(e.id, editText.trim())
                    setEditingId(null)
                    refreshEntries()
                  } catch { /* ignore */ } finally { setEditSaving(false) }
                }
                const confirmDelete = () => {
                  setEntries(prev => prev.filter(x => x.id !== e.id))
                  setConfirmDeleteId(null)
                  api.patient.deleteJournal(e.id).catch(refreshEntries)
                }

                return (
                  <View key={e.id} style={[s.entry, { backgroundColor: c.surf, borderColor: c.bdr }]}>
                    <View style={s.entryHeader}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => { if (!isEditing) setExpandedId(expanded ? null : e.id) }}>
                        <View style={s.entryMeta}>
                          <Sans bold style={{ fontSize: 13, color: c.txt }}>{dateLabel}</Sans>
                          <View style={[s.pill, { backgroundColor: c.acc }]}><Sans style={{ fontSize: 11, color: c.txt3 }}>{timeLabel}</Sans></View>
                          {e.source && (
                            <View style={[s.pill, { backgroundColor: `${c.pri}18` }]}>
                              <Sans style={{ fontSize: 11, color: c.pri }}>{e.source === 'chat' ? '💬 Chat' : '✍️ Solo'}</Sans>
                            </View>
                          )}
                          {!!e.word_count && <Sans style={{ fontSize: 11, color: c.txt3 }}>{e.word_count}w</Sans>}
                        </View>
                        {!expanded && !isEditing && (
                          <Sans style={{ marginTop: 4, fontSize: 13, color: c.txt3, lineHeight: 19 }}>{preview}</Sans>
                        )}
                      </TouchableOpacity>

                      {!isEditing && !isConfirmingDelete && (
                        <View style={s.actions}>
                          <ActionBtn label="Edit" color={c.pri} onPress={startEdit} />
                          <ActionBtn label="Delete" color="#F87171" onPress={() => setConfirmDeleteId(e.id)} />
                          <TouchableOpacity onPress={() => setExpandedId(expanded ? null : e.id)} style={{ padding: 4 }}>
                            <Text style={{ color: c.pri, fontSize: 13, transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>▾</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {isConfirmingDelete && (
                        <View style={s.actions}>
                          <Sans style={{ fontSize: 12, color: c.txt3 }}>Delete?</Sans>
                          <ActionBtn label="Yes" color="#F87171" onPress={confirmDelete} />
                          <ActionBtn label="No" color={c.txt3} onPress={() => setConfirmDeleteId(null)} />
                        </View>
                      )}
                    </View>

                    {expanded && !isEditing && (
                      <View style={[s.entryBody, { borderTopColor: c.bdr }]}>
                        <Sans style={{ fontSize: 14, color: c.txt2, lineHeight: 24 }}>{e.body}</Sans>
                      </View>
                    )}

                    {isEditing && (
                      <View style={[s.entryBody, { borderTopColor: c.bdr }]}>
                        <ArxInput
                          value={editText} onChangeText={setEditText} multiline autoFocus
                          style={{ minHeight: 120, textAlignVertical: 'top', marginBottom: 10 }}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <GradientButton label={editSaving ? 'Saving…' : 'Save changes'} disabled={editSaving || !editText.trim()} onPress={saveEdit} small />
                          </View>
                          <TouchableOpacity onPress={() => setEditingId(null)} style={[s.cancelBtn, { backgroundColor: c.acc, borderColor: c.bdr }]}>
                            <Sans bold style={{ color: c.txt3, fontSize: 13 }}>Cancel</Sans>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 3, paddingHorizontal: 8 }}>
      <Text style={{ color, fontSize: 12, fontFamily: FONT_SANS_BOLD }}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
  modeToggle: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 22, borderWidth: 1 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  bubble: { maxWidth: '82%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { borderBottomLeftRadius: 4 },
  savedBox: {
    backgroundColor: 'rgba(74,222,128,.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,.3)',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center',
  },
  savedText: { color: '#4ADE80', fontSize: 14 },
  sendBtnWrap: { borderRadius: 14, overflow: 'hidden', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  moodTag: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  filterTab: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  entry: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  pill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  entryBody: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
})
