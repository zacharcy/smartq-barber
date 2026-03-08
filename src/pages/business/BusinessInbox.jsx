import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessInbox() {
    const { authFetch, company } = useAuth();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: `Hi! I'm SmartQ AI — your smart assistant for ${company?.name || 'your business'}. I can help you manage appointments, check schedules, answer client questions in any language, and more. How can I help you today?`,
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    async function handleSend(e) {
        e?.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Send conversation history (exclude the greeting)
            const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));

            const res = await authFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ message: trimmed, history }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Chat request failed');
            }

            // Process the reply — strip JSON blocks for display and show action results
            let displayText = data.reply;
            const assistantMsg = { role: 'assistant', text: displayText };

            // If an action was executed, add a status message
            if (data.actionResult) {
                assistantMsg.actionResult = data.actionResult;
            }
            if (data.actionError) {
                assistantMsg.actionError = data.actionError;
            }

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', text: `Sorry, something went wrong: ${err.message}`, isError: true },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function formatMessage(text) {
        // Bold: **text**
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Inline code: `text`
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Remove JSON code blocks from display (already handled by action system)
        formatted = formatted.replace(/```json[\s\S]*?```/g, '');
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br/>');
        return formatted;
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h1 className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={24} style={{ color: 'var(--color-accent-gold)' }} />
                        AI Chat Assistant
                    </h1>
                    <p className="dash-page-subtitle">Chat with SmartQ AI to manage appointments, answer questions, and more — in any language.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(212,175,55,0.1)', borderRadius: '20px', fontSize: '13px', color: 'var(--color-accent-gold)' }}>
                    <Bot size={16} />
                    Gemini 2.5 Pro
                </div>
            </div>

            {/* Chat Container */}
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'} ${msg.isError ? 'chat-message-error' : ''}`}>
                            <div className="chat-avatar">
                                {msg.role === 'user' ? (
                                    <User size={18} />
                                ) : (
                                    <Bot size={18} />
                                )}
                            </div>
                            <div className="chat-bubble">
                                <div
                                    className="chat-text"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                                />
                                {/* Action result badge */}
                                {msg.actionResult && (
                                    <div className="chat-action-badge chat-action-success">
                                        <CheckCircle2 size={14} />
                                        {msg.actionResult.message}
                                        {msg.actionResult.appointmentId && ` (ID: #${msg.actionResult.appointmentId})`}
                                    </div>
                                )}
                                {msg.actionError && (
                                    <div className="chat-action-badge chat-action-error">
                                        <XCircle size={14} />
                                        Action failed: {msg.actionError}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="chat-message chat-message-assistant">
                            <div className="chat-avatar">
                                <Bot size={18} />
                            </div>
                            <div className="chat-bubble">
                                <div className="chat-typing">
                                    <Loader2 size={16} className="chat-spinner" />
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form className="chat-input-area" onSubmit={handleSend}>
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                            className="chat-input"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={!input.trim() || loading}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="chat-disclaimer">
                        <AlertCircle size={12} />
                        AI responses may occasionally be inaccurate. Verify important actions.
                    </div>
                </form>
            </div>
        </div>
    );
}
