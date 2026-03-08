import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Send, Bot, User, Loader2, ArrowLeft,
    CheckCircle2, XCircle, Sparkles, Calendar, MapPin
} from 'lucide-react';

const QUICK_PROMPTS = [
    { icon: '💇', text: 'Find me a hair salon nearby' },
    { icon: '💆', text: 'I need a relaxing spa treatment' },
    { icon: '💅', text: 'Book a nail appointment' },
    { icon: '💍', text: 'Bridal makeup services' },
];

export default function ConsumerChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    async function sendMessage(text) {
        const trimmed = (text || input).trim();
        if (!trimmed || loading) return;

        if (showWelcome) setShowWelcome(false);

        const userMsg = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, text: m.text }));

            const res = await fetch('/api/chat/consumer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Chat failed');

            let displayText = data.reply;
            const assistantMsg = { role: 'assistant', text: displayText };

            if (data.actionResult) assistantMsg.actionResult = data.actionResult;
            if (data.actionError) assistantMsg.actionError = data.actionError;

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', text: `Oops! Something went wrong: ${err.message}`, isError: true },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function handleSubmit(e) {
        e?.preventDefault();
        sendMessage();
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function formatMessage(text) {
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        formatted = formatted.replace(/```json[\s\S]*?```/g, '');
        formatted = formatted.replace(/\n/g, '<br/>');
        return formatted;
    }

    return (
        <div className="consumer-chat-page">
            {/* Header */}
            <header className="cc-header">
                <div className="cc-header-inner">
                    <Link to="/" className="cc-back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="cc-header-brand">
                        <div className="cc-logo">
                            <div className="cc-logo-icon">S</div>
                            <span className="cc-logo-text">SmartQ</span>
                        </div>
                        <div className="cc-header-status">
                            <Bot size={16} />
                            <span>AI Assistant</span>
                            <div className="cc-status-dot"></div>
                        </div>
                    </div>
                    <div style={{ width: 40 }}></div> {/* spacer */}
                </div>
            </header>

            {/* Chat Body */}
            <div className="cc-body">
                {/* Welcome screen */}
                {showWelcome && (
                    <div className="cc-welcome">
                        <div className="cc-welcome-icon">
                            <Sparkles size={40} />
                        </div>
                        <h1 className="cc-welcome-title">How can I help you today?</h1>
                        <p className="cc-welcome-sub">
                            I can find businesses, recommend treatments, and book appointments for you — in any language.
                        </p>
                        <div className="cc-quick-prompts">
                            {QUICK_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    className="cc-quick-btn"
                                    onClick={() => sendMessage(prompt.text)}
                                >
                                    <span className="cc-quick-icon">{prompt.icon}</span>
                                    <span>{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                        <div className="cc-welcome-features">
                            <div className="cc-feature">
                                <Calendar size={16} />
                                <span>Book appointments instantly</span>
                            </div>
                            <div className="cc-feature">
                                <MapPin size={16} />
                                <span>Find venues across Sri Lanka</span>
                            </div>
                            <div className="cc-feature">
                                <Bot size={16} />
                                <span>Sinhala, Tamil & English</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {!showWelcome && (
                    <div className="cc-messages">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`cc-msg ${msg.role === 'user' ? 'cc-msg-user' : 'cc-msg-ai'} ${msg.isError ? 'cc-msg-error' : ''}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="cc-msg-avatar cc-avatar-ai">
                                        <Bot size={18} />
                                    </div>
                                )}
                                <div className="cc-msg-content">
                                    <div
                                        className="cc-msg-bubble"
                                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                                    />
                                    {msg.actionResult && (
                                        <div className={`cc-action-badge ${msg.actionResult.success ? 'cc-action-ok' : 'cc-action-fail'}`}>
                                            {msg.actionResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                                            <div>
                                                <strong>{msg.actionResult.message}</strong>
                                                {msg.actionResult.appointmentId && (
                                                    <span> — Booking #{msg.actionResult.appointmentId}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {msg.actionError && (
                                        <div className="cc-action-badge cc-action-fail">
                                            <XCircle size={15} />
                                            <span>{msg.actionError}</span>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="cc-msg-avatar cc-avatar-user">
                                        <User size={18} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="cc-msg cc-msg-ai">
                                <div className="cc-msg-avatar cc-avatar-ai">
                                    <Bot size={18} />
                                </div>
                                <div className="cc-msg-content">
                                    <div className="cc-msg-bubble cc-typing">
                                        <div className="cc-typing-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="cc-input-area">
                <form className="cc-input-form" onSubmit={handleSubmit}>
                    <div className="cc-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            className="cc-input"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="cc-send-btn"
                            disabled={!input.trim() || loading}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
                <p className="cc-powered">
                    Powered by <strong>SmartQ AI</strong> · Responses may be inaccurate
                </p>
            </div>
        </div>
    );
}
