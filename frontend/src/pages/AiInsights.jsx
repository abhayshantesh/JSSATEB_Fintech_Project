import React, { useEffect, useRef, useState } from 'react';
import {
    Sparkles, AlertTriangle, Lightbulb, CheckCircle2, Send, RefreshCw, User, Bot,
} from 'lucide-react';
import { getAiExecutiveSummary, getSuggestedQuestions, askAnalyst } from '../services/api';
import { PageHeader, Card, SectionHeader, Loading } from '../components/ui';

const SourceBadge = ({ source }) =>
    source ? (
        <span className="pill bg-ink-100 text-ink-500">
            <Sparkles size={12} /> {source === 'openrouter' ? 'Live AI' : 'Rule-based'}
        </span>
    ) : null;

const ListBlock = ({ icon: Icon, title, tone, items }) => {
    const ring = {
        observation: 'text-ink-400',
        risk: 'text-negative-500',
        opportunity: 'text-info-500',
        action: 'text-positive-500',
    }[tone];
    return (
        <div>
            <div className="flex items-center gap-2 mb-2.5">
                <Icon size={15} className={ring} />
                <h4 className="text-[13px] font-semibold text-ink-800">{title}</h4>
            </div>
            <ul className="space-y-2">
                {(items || []).map((t, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-600">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${ring}`} />
                        {t}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AiInsights = () => {
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [thread, setThread] = useState([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const scrollRef = useRef(null);

    const loadSummary = async () => {
        setLoadingSummary(true);
        try {
            setSummary(await getAiExecutiveSummary());
        } catch {
            setSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    };

    useEffect(() => {
        loadSummary();
        getSuggestedQuestions().then((d) => setQuestions(d.questions || [])).catch(() => {});
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [thread, thinking]);

    const ask = async (question) => {
        const q = (question ?? input).trim();
        if (!q || thinking) return;
        setInput('');
        setThread((t) => [...t, { role: 'user', text: q }]);
        setThinking(true);
        try {
            const res = await askAnalyst(q);
            setThread((t) => [...t, { role: 'assistant', text: res.answer, source: res.source }]);
        } catch {
            setThread((t) => [...t, { role: 'assistant', text: 'Unable to reach the analyst service.', source: null }]);
        } finally {
            setThinking(false);
        }
    };

    return (
        <>
            <PageHeader
                title="AI Insights"
                subtitle="Automated executive briefing and an AI financial analyst, grounded in live metrics"
            >
                <button className="btn-secondary" onClick={loadSummary}>
                    <RefreshCw size={14} /> Regenerate
                </button>
            </PageHeader>

            {/* Executive briefing */}
            <Card>
                <SectionHeader
                    title="AI Executive Briefing"
                    subtitle="Observations, risks, opportunities and recommended actions"
                    action={<SourceBadge source={summary?.source} />}
                />
                {loadingSummary ? (
                    <Loading label="Generating briefing…" />
                ) : !summary ? (
                    <p className="text-[13px] text-ink-400 py-4">Briefing unavailable — ensure the API is running.</p>
                ) : (
                    <>
                        <div className="rounded-lg bg-ink-950 px-4 py-3.5">
                            <p className="text-[14.5px] font-medium leading-snug text-white">{summary.headline}</p>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <ListBlock icon={Sparkles} title="Key Observations" tone="observation" items={summary.observations} />
                            <ListBlock icon={AlertTriangle} title="Risks" tone="risk" items={summary.risks} />
                            <ListBlock icon={Lightbulb} title="Opportunities" tone="opportunity" items={summary.opportunities} />
                            <ListBlock icon={CheckCircle2} title="Recommended Actions" tone="action" items={summary.actions} />
                        </div>
                    </>
                )}
            </Card>

            {/* Analyst chat */}
            <Card className="mt-4" pad={false}>
                <div className="card-pad pb-3 border-b border-ink-100">
                    <SectionHeader
                        title="AI Financial Analyst"
                        subtitle="Ask about revenue, expenses, margin, vendors or financial position"
                    />
                </div>

                <div ref={scrollRef} className="max-h-[360px] min-h-[180px] overflow-y-auto px-5 py-4">
                    {thread.length === 0 ? (
                        <div className="py-6 text-center">
                            <Bot size={26} className="mx-auto text-ink-300" />
                            <p className="mt-2 text-[13px] text-ink-400">
                                Ask a question, or start with one of these:
                            </p>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {questions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => ask(q)}
                                        className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-[12.5px] text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {thread.map((m, i) => (
                                <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                                    {m.role === 'assistant' && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                                            <Bot size={14} />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                            m.role === 'user'
                                                ? 'bg-ink-900 text-white'
                                                : 'bg-ink-50 text-ink-700'
                                        }`}
                                    >
                                        {m.text}
                                        {m.role === 'assistant' && m.source && (
                                            <span className="mt-1.5 block text-[10.5px] text-ink-400">
                                                {m.source === 'openrouter' ? 'Live AI' : 'Rule-based'}
                                            </span>
                                        )}
                                    </div>
                                    {m.role === 'user' && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-200 text-ink-600">
                                            <User size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {thinking && (
                                <div className="flex gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                                        <Bot size={14} />
                                    </div>
                                    <div className="rounded-2xl bg-ink-50 px-3.5 py-3">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); ask(); }}
                    className="flex items-center gap-2 border-t border-ink-100 px-5 py-3.5"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the financial analyst…"
                        className="flex-1 rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-[13px] text-ink-800 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
                    />
                    <button type="submit" disabled={thinking || !input.trim()} className="btn-primary disabled:opacity-40">
                        <Send size={15} />
                    </button>
                </form>
            </Card>

            <p className="mt-3 text-center text-[11.5px] text-ink-400">
                Responses are grounded in current dashboard metrics. Live AI requires an OpenRouter key;
                otherwise a deterministic engine is used.
            </p>
        </>
    );
};

export default AiInsights;
