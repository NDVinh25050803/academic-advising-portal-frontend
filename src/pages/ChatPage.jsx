import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAppState } from '../state/AppState.jsx';
import Banner from '../components/Banner.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import { CitationChip, citationLabel } from '../components/Chips.jsx';
import { advisorHref } from '../components/States.jsx';

const SUGGESTIONS = ['What is the prerequisite for COS30019?', 'How is COS20007 assessed?', 'Which skills are growing in AI?'];
let nextId = 1;

// Figma S3 (grounded answer), S4 (abstention) and the chat states in S6
export default function ChatPage() {
  const { messages, setMessages } = useAppState();
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState(null); // { msgId, citation }
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const busy = messages.some((m) => m.status === 'pending');

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    const history = messages.filter((m) => m.status === 'done').map((m) => ({ role: m.role, content: m.role === 'user' ? m.text : m.result?.answer || '' }));
    const userMsg = { id: nextId++, role: 'user', text: q, status: 'done' };
    const pending = { id: nextId++, role: 'assistant', question: q, status: 'pending' };
    setMessages((ms) => [...ms, userMsg, pending]);
    setDraft('');
    try {
      const result = await api.chat(q, history);
      setMessages((ms) => ms.map((m) => (m.id === pending.id ? { ...m, status: 'done', result } : m)));
      if (!result.abstained && result.citations[0]) setSelected({ msgId: pending.id, citation: result.citations[0] });
      else if (result.abstained) setSelected(null);
    } catch (error) {
      setMessages((ms) => ms.map((m) => (m.id === pending.id ? { ...m, status: 'error', error } : m)));
    }
  }

  function retry(msg) {
    setMessages((ms) => ms.filter((m) => m.id !== msg.id && !(m.role === 'user' && m.id === msg.id - 1)));
    ask(msg.question);
  }

  function rephrase(question) {
    setDraft(question);
    inputRef.current?.focus();
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.status === 'done');

  return (
    <div className="chat-layout">
      <section className="card card--flat chat" aria-label="Ask the syllabus">
        <div className="thread" aria-live="polite">
          {messages.length === 0 && (
            <div className="stack gap-4 empty">
              <div className="row gap-2">
                <span className="c-brand"><Icon name="chat" size={24} /></span>
                <h1 className="t-h2">Ask anything about your units</h1>
              </div>
              <p className="t-small c-secondary">Answers come from approved syllabus documents and always show their sources.</p>
              <div className="row wrap gap-2">
                {SUGGESTIONS.map((s) => <button key={s} type="button" className="major-chip" onClick={() => ask(s)}>{s}</button>)}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <p key={m.id} className="msg-user t-body">{m.text}</p>
            ) : (
              <AssistantMessage key={m.id} msg={m} selected={selected} onSelect={(c) => setSelected({ msgId: m.id, citation: c })}
                onRetry={() => retry(m)} onRephrase={() => rephrase(m.question)} />
            )
          )}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
          <label className="field">
            <span className="sr-only">Your question</span>
            <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about units, prerequisites or major trends…" maxLength={500} />
            <button type="submit" className="send-btn" disabled={!draft.trim() || busy} aria-label="Send question">
              <Icon name="send" size={18} />
            </button>
          </label>
          <p className="t-caption c-secondary">Answers come only from approved syllabus documents. Confirm enrolment decisions with an academic advisor.</p>
        </form>
      </section>

      <aside className="side-panel">
        {selected ? <SourcePanel citation={selected.citation} index={indexOf(messages, selected)} threshold={thresholdOf(messages, selected)} />
          : lastAssistant?.result?.abstained ? <WhyNoAnswer result={lastAssistant.result} />
          : (
            <div className="card">
              <h2 className="t-h2">Sources</h2>
              <p className="t-small c-secondary">Select a source chip under an answer to read the passage it came from.</p>
            </div>
          )}
      </aside>
    </div>
  );
}

function AssistantMessage({ msg, selected, onSelect, onRetry, onRephrase }) {
  if (msg.status === 'pending') {
    return (
      <div className="msg-assistant">
        <span className="avatar" aria-hidden="true">A</span>
        <p className="t-body c-secondary">Searching approved documents<span className="dots" aria-hidden="true"><span /><span /><span /></span></p>
      </div>
    );
  }
  if (msg.status === 'error') {
    return (
      <div className="msg-assistant">
        <span className="avatar" aria-hidden="true">A</span>
        <div className="msg-assistant__body">
          <Banner tone="danger" title="Something went wrong on our side">The answer service is not responding. Try again in a moment.</Banner>
          <div><Button onClick={onRetry}>Try again</Button></div>
        </div>
      </div>
    );
  }
  const r = msg.result;
  if (r.abstained) {
    return (
      <div className="msg-assistant">
        <span className="avatar" aria-hidden="true">A</span>
        <div className="msg-assistant__body">
          <Banner tone="warning" title="I can’t answer this from the approved documents">
            {r.abstain_reason === 'OUT_OF_SCOPE'
              ? 'No syllabus section matched your question closely enough, so I won’t guess. This topic is outside what this portal covers.'
              : 'No syllabus section matched your question closely enough, so I won’t guess.'}
          </Banner>
          <div className="row wrap gap-3">
            <Button variant="warning" as="a" href={advisorHref}>Contact an academic advisor</Button>
            <Button variant="secondary" onClick={onRephrase}>Rephrase question</Button>
          </div>
          <p className="t-caption c-secondary">This is a deliberate abstention, not a system error.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="msg-assistant">
      <span className="avatar" aria-hidden="true">A</span>
      <div className="msg-assistant__body">
        <p className="t-body">{r.answer}</p>
        <div className="row wrap gap-2">
          {r.citations.map((c, i) => (
            <CitationChip key={c.id} citation={c} index={i + 1} selected={selected?.msgId === msg.id && selected.citation.id === c.id} onSelect={onSelect} />
          ))}
        </div>
        <p className="row gap-1 t-caption c-success">
          <Icon name="circleCheck" size={14} />
          Grounded in {r.citations.length} approved {r.citations.length === 1 ? 'document' : 'documents'}
        </p>
      </div>
    </div>
  );
}

function SourcePanel({ citation, index, threshold }) {
  return (
    <div className="card" style={{ gap: 12 }}>
      <h2 className="t-h2">Source [{index}]</h2>
      <p className="t-caption c-secondary">{citationLabel(citation, index).replace(/^\[\d+\] /, '')}</p>
      <blockquote className="passage" style={{ margin: 0 }}>
        <p className="t-small">“{citation.snippet}”</p>
      </blockquote>
      {citation.similarity != null && (
        <p className="row gap-2 t-caption c-success">
          <Icon name="gauge" size={16} />
          Similarity {citation.similarity.toFixed(2)}{threshold != null ? ` · above threshold ${threshold.toFixed(2)}` : ''}
        </p>
      )}
      <div>
        {citation.url
          ? <Button variant="secondary" as="a" href={citation.url} target="_blank" rel="noreferrer">Open full document</Button>
          : <Button variant="secondary" disabled>Open full document</Button>}
      </div>
    </div>
  );
}

function WhyNoAnswer({ result }) {
  return (
    <div className="card" style={{ gap: 12 }}>
      <h2 className="t-h2">Why no answer?</h2>
      <div className="kv"><span className="t-small c-secondary">Top similarity</span><span className="t-label">{result.top_similarity?.toFixed(2) ?? '–'}</span></div>
      <div className="kv"><span className="t-small c-secondary">Threshold</span><span className="t-label">{result.threshold?.toFixed(2) ?? '–'}</span></div>
      <div className="kv"><span className="t-small c-secondary">Sources passing gate</span><span className="t-label">{result.sources_passed} of {result.sources_checked}</span></div>
      {result.abstain_reason === 'OUT_OF_SCOPE' && <p className="t-caption c-warning">Out-of-scope topic detected.</p>}
    </div>
  );
}

const findMsg = (messages, sel) => messages.find((m) => m.id === sel.msgId);
const indexOf = (messages, sel) => (findMsg(messages, sel)?.result?.citations.findIndex((c) => c.id === sel.citation.id) ?? 0) + 1;
const thresholdOf = (messages, sel) => findMsg(messages, sel)?.result?.threshold;
