import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function BusinessLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            navigate('/business/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)', background: 'var(--color-bg)' }}>
            {/* Left Side: Image / Brand Showcase */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', padding: 'var(--space-3xl)', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2600")',
                    backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(28, 25, 23, 0.8), rgba(28, 25, 23, 0.95))', zIndex: 1 }} />

                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', color: 'var(--color-surface)' }}>
                    <div>
                        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-dark)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>S</div>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: '1px', color: 'var(--color-surface)' }}>SMARTQ<span style={{ color: 'var(--color-accent-gold)' }}>.</span></span>
                        </Link>
                    </div>

                    <div style={{ maxWidth: '500px' }}>
                        <h2 style={{ color: 'var(--color-surface)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-lg)' }}>Welcome back.</h2>
                        <p style={{ fontSize: 'var(--text-lg)', lineHeight: 1.7, opacity: 0.8 }}>
                            Sign in to manage your appointments, clients, and grow your wellness business with SmartQ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div style={{ flex: '0 0 600px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl)', background: 'var(--color-surface)', position: 'relative', zIndex: 10, boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in">
                    <div style={{ marginBottom: 'var(--space-2xl)' }}>
                        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xs)' }}>Sign in to your account</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>Enter your credentials to access your dashboard.</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '14px 18px',
                            marginBottom: 'var(--space-lg)',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '8px',
                            color: '#DC2626',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)' }}
                                placeholder="owner@auraspa.local"
                                required
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-2xl)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '16px', paddingRight: '50px', fontSize: 'var(--text-base)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', transition: 'var(--transition)' }}
                                    placeholder="••••••••"
                                    required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '18px', fontSize: 'var(--text-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '8px', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                            Don't have an account?{' '}
                            <Link to="/business/register" style={{ color: 'var(--color-text-main)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--color-accent-gold)', paddingBottom: '2px' }}>
                                Start free trial
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
