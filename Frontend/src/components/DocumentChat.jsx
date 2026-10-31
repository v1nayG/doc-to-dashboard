import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Download, MessageSquare, Network, Pencil, Plus, Search, Send, Sparkles, Trash2 } from 'lucide-react'
import ChartCard from './ChartCard'
import RelationshipGraph from './RelationshipGraph'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const STEP_LABELS = { plan: 'Planning', retrieve: 'Retrieving evidence', analyze: 'Computing facts', synthesize: 'Writing answer', verify: 'Verifying' }
const VERDICT_LABELS = { supported: 'Verified against documents', partially_supported: 'Partially verified', unsupported: 'Not supported by documents', unverified: 'Verification unavailable', skipped: 'Verification skipped' }

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Reads a server-sent event stream from fetch and dispatches each parsed event.
const consumeEventStream = async (response, onEvent) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const eventLine = frame.split('\n').find(line => line.startsWith('event:'))
      const dataLine = frame.split('\n').find(line => line.startsWith('data:'))
      if (eventLine && dataLine) onEvent(eventLine.slice(6).trim(), JSON.parse(dataLine.slice(5)))
      boundary = buffer.indexOf('\n\n')
    }
  }
}

const downloadBlob = (content, fileName, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function DocumentChat({ documents, activeDocumentId }) {
  const [selectedIds, setSelectedIds] = useState(activeDocumentId ? [activeDocumentId] : [])
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [steps, setSteps] = useState([])
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [graph, setGraph] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)

  const refreshConversations = () => axios.get(`${API_BASE}/chat`, { params: { limit: 30 } })
    .then(response => setConversations(response.data.data || []))
    .catch(() => setError('Conversation history is unavailable.'))

  useEffect(() => { refreshConversations() }, [])

  const selectedDocuments = useMemo(() => documents.filter(document => selectedIds.includes(String(document._id))), [documents, selectedIds])

  const toggleDocument = id => {
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : current.length < 5 ? [...current, id] : current)
    setGraph(null)
    setAnalysis(null)
  }

  const startNewConversation = () => {
    setConversationId('')
    setMessages([])
    setError('')
    setSteps([])
  }

  const loadConversation = async id => {
    setConversationId(id)
    setError('')
    setSteps([])
    if (!id) { setMessages([]); return }
    try {
      const response = await axios.get(`${API_BASE}/chat/${id}`)
      setMessages(response.data.data.messages || [])
      setSelectedIds((response.data.data.documents || []).map(document => String(document)))
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load this conversation.')
    }
  }

  const renameConversation = async () => {
    const current = conversations.find(conversation => conversation._id === conversationId)
    const title = window.prompt('Conversation name', current?.title || '')
    if (!title?.trim()) return
    try {
      await axios.patch(`${API_BASE}/chat/${conversationId}`, { title: title.trim() })
      refreshConversations()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not rename the conversation.')
    }
  }

  const deleteConversation = async () => {
    if (!window.confirm('Delete this conversation?')) return
    try {
      await axios.delete(`${API_BASE}/chat/${conversationId}`)
      startNewConversation()
      refreshConversations()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not delete the conversation.')
    }
  }

  const exportConversation = async () => {
    try {
      const response = await axios.get(`${API_BASE}/chat/${conversationId}/export`, { responseType: 'text' })
      downloadBlob(response.data, 'conversation.md', 'text/markdown')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not export the conversation.')
    }
  }

  const sendMessage = async event => {
    event.preventDefault()
    const message = input.trim()
    if (!message || sending) return
    if (!selectedIds.length) { setError('Select at least one document for this conversation.'); return }

    setSending(true)
    setError('')
    setSteps([])
    setMessages(current => [...current, { role: 'user', content: message }])
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message, documentIds: selectedIds, conversationId: conversationId || undefined }),
      })
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Could not get an answer. Please try again.')
      }
      let result = null
      let failure = null
      await consumeEventStream(response, (type, data) => {
        if (type === 'step') setSteps(current => [...current.filter(step => step.step !== data.step), data])
        if (type === 'result') result = data
        if (type === 'error') failure = data.error
      })
      if (failure || !result) throw new Error(failure || 'The answer stream ended unexpectedly.')
      setMessages(current => [...current, { role: 'assistant', ...result, content: result.answer }])
      setConversationId(String(result.conversationId))
      setInput('')
      refreshConversations()
    } catch (requestError) {
      setError(requestError.message)
      setMessages(current => current.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  const openPanel = async name => {
    if (panel === name) { setPanel(null); return }
    setPanel(name)
    setError('')
    if (name === 'search') return
    if (!selectedIds.length) { setError('Select at least one document first.'); return }
    setPanelLoading(true)
    try {
      if (name === 'graph' && !graph) {
        const response = await axios.post(`${API_BASE}/insights/graph`, { documentIds: selectedIds }, { timeout: 120000 })
        setGraph(response.data)
      }
      if (name === 'insights' && !analysis) {
        const response = await axios.post(`${API_BASE}/insights/analysis`, { documentIds: selectedIds })
        setAnalysis(response.data)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load this view.')
    } finally {
      setPanelLoading(false)
    }
  }

  const runSearch = async event => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    try {
      const response = await axios.get(`${API_BASE}/insights/search`, { params: { q: searchQuery.trim(), limit: 10 } })
      setSearchResults(response.data.results)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Search failed.')
    }
  }

  return (
    <section className="chat-card document-chat" aria-labelledby="document-chat-title">
      <div className="document-chat-header">
        <div>
          <div className="section-label" id="document-chat-title">Chat with documents</div>
          <p className="chat-subtitle">Grounded answers with passage citations, computed facts, and verification across up to five files.</p>
        </div>
        <div className="document-chat-actions">
          <select className="input-field chat-conversation-select" value={conversationId} onChange={event => loadConversation(event.target.value)} aria-label="Saved conversations">
            <option value="">New conversation</option>
            {conversations.map(conversation => <option key={conversation._id} value={conversation._id}>{conversation.title}</option>)}
          </select>
          <button type="button" className="btn btn-ghost chat-new-button" onClick={startNewConversation} title="Start a new conversation"><Plus size={15} /></button>
          {conversationId && (
            <>
              <button type="button" className="btn btn-ghost chat-new-button" onClick={renameConversation} title="Rename conversation"><Pencil size={14} /></button>
              <button type="button" className="btn btn-ghost chat-new-button" onClick={exportConversation} title="Export as Markdown"><Download size={14} /></button>
              <button type="button" className="btn btn-ghost chat-new-button" onClick={deleteConversation} title="Delete conversation"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </div>

      <div className="chat-document-list" aria-label="Documents in this conversation">
        {documents.map(document => {
          const id = String(document._id)
          return (
            <label key={id} className="chat-document-option">
              <input type="checkbox" checked={selectedIds.includes(id)} disabled={!selectedIds.includes(id) && selectedIds.length >= 5} onChange={() => toggleDocument(id)} />
              <span>{document.fileName || document.dashboardData?.title || 'Document'}</span>
            </label>
          )
        })}
        {!documents.length && <span className="chat-muted">No saved documents are available.</span>}
      </div>

      <div className="chat-tools">
        <button type="button" className={`btn btn-ghost${panel === 'graph' ? ' active' : ''}`} onClick={() => openPanel('graph')}><Network size={14} /> Data map</button>
        <button type="button" className={`btn btn-ghost${panel === 'insights' ? ' active' : ''}`} onClick={() => openPanel('insights')}><Sparkles size={14} /> Insights{selectedDocuments.length > 1 ? ' & compare' : ''}</button>
        <button type="button" className={`btn btn-ghost${panel === 'search' ? ' active' : ''}`} onClick={() => openPanel('search')}><Search size={14} /> Search all files</button>
      </div>

      {panel && (
        <div className="chat-panel">
          {panelLoading && <div className="chat-muted">Building view…</div>}
          {panel === 'graph' && graph && <RelationshipGraph key={graph.durationMs + graph.nodes.length} graph={graph} />}
          {panel === 'insights' && analysis && (
            <div className="chat-insights">
              {analysis.comparison?.rows?.length > 0 && (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>KPI</th>{analysis.comparison.documents.map(document => <th key={document.documentId}>{document.fileName}</th>)}<th>Change</th></tr></thead>
                    <tbody>
                      {analysis.comparison.rows.map(row => (
                        <tr key={row.label}><td>{row.label}</td>{row.values.map((value, index) => <td key={index}>{value?.raw ?? '—'}</td>)}<td>{row.deltaPercent === null ? '—' : `${row.deltaPercent > 0 ? '+' : ''}${row.deltaPercent.toFixed(1)}%`}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {analysis.insights.length ? (
                <ul className="chat-insight-list">
                  {analysis.insights.map((insight, index) => <li key={index}><span className={`chat-insight-kind ${insight.kind}`}>{insight.kind}</span>{insight.text} <span className="chat-muted">({insight.fileName})</span></li>)}
                </ul>
              ) : !panelLoading && <span className="chat-muted">No numeric tables were found to analyze.</span>}
            </div>
          )}
          {panel === 'search' && (
            <form className="chat-composer" onSubmit={runSearch}>
              <input className="input-field chat-input" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search across all your documents…" aria-label="Search all documents" />
              <button className="btn btn-primary chat-send-button" type="submit" disabled={!searchQuery.trim()}><Search size={15} /> Search</button>
            </form>
          )}
          {panel === 'search' && searchResults && (
            <ul className="chat-insight-list">
              {searchResults.length ? searchResults.map((result, index) => (
                <li key={index}><strong>{result.fileName}</strong> <span className="chat-muted">({result.locator})</span><br />{result.snippet}</li>
              )) : <li className="chat-muted">No matching passages.</li>}
            </ul>
          )}
        </div>
      )}

      <div className="chat-message-list" aria-live="polite">
        {!messages.length && (
          <div className="chat-empty-state"><MessageSquare size={18} /><span>Ask a question about the selected documents.</span></div>
        )}
        {messages.map((message, index) => (
          <article className={`chat-message ${message.role}`} key={`${index}-${message.role}`}>
            <div className="chat-message-role">{message.role === 'assistant' ? 'DocDash' : 'You'}</div>
            <p>{message.content}</p>
            {message.verification?.verdict && message.verification.verdict !== 'skipped' && (
              <span className={`chat-verdict ${message.verification.verdict}`}>{VERDICT_LABELS[message.verification.verdict] || message.verification.verdict}</span>
            )}
            {message.citations?.length > 0 && (
              <div className="chat-citations">
                {message.citations.map(citation => (
                  <span key={citation.id} className="chat-citation-chip" title={citation.snippet}>[{citation.id}] {citation.fileName} · {citation.locator}</span>
                ))}
              </div>
            )}
            {!message.citations?.length && message.sources?.length > 0 && (
              <div className="chat-citations">Sources: {message.sources.map(source => source.fileName).join(', ')}</div>
            )}
            {message.charts?.map((chart, chartIndex) => <ChartCard key={chart.id || chartIndex} chart={chart} index={chartIndex} />)}
          </article>
        ))}
        {sending && steps.length > 0 && (
          <div className="chat-steps" aria-label="Agent progress">
            {steps.map(step => (
              <span key={step.step} className={`chat-step ${step.status}`}>{STEP_LABELS[step.step] || step.step}{step.detail && step.status === 'completed' ? ` · ${step.detail}` : ''}</span>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-banner chat-error" role="alert">{error}</div>}
      <form className="chat-composer" onSubmit={sendMessage}>
        <textarea
          className="input-field chat-input"
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="Ask a question, request a chart, or compare the selected files…"
          maxLength={4000}
          rows={2}
          aria-label="Message about selected documents"
          disabled={sending || !documents.length}
        />
        <button className="btn btn-primary chat-send-button" type="submit" disabled={sending || !input.trim() || !documents.length}>
          <Send size={15} />
          {sending ? 'Working…' : 'Send'}
        </button>
      </form>
    </section>
  )
}
