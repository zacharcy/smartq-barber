import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    'Hair Salon', 'Barbershop', 'Nail Salon', 'Spa & Wellness',
    'Beauty Salon', 'Skin Care Clinic', 'Massage Therapy',
    'Tattoo & Piercing', 'Eyebrows & Lashes', 'Makeup Studio',
    'Tanning Studio', 'Medical Spa', 'Fitness & Gym', 'Other',
];

export default function BusinessRegister() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        category: '', address: '', city: '', country: 'Sri Lanka', description: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/business/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: '100%', padding: '14px 16px', fontSize: '14px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: '8px', outline: 'none', transition: 'var(--transition)',
        fontFamily: 'var(--font-sans)',
    };

    const labelStyle = {
        display: 'block', marginBottom: '6px', fontSize: '13px',
        fontWeight: 600, color: 'var(--color-text-main)',
    };

    function focusHandler(e) { e.target.style.borderColor = 'var(--color-accent-gold)'; }
    function blurHandler(e) { e.target.style.borderColor = 'var(--color-border)'; }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)', background: 'var(--color-bg)' }}>
            {/* Left Side */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', padding: 'var(--space-3xl)' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2600")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(28, 25, 23, 0.8), rgba(28, 25, 23, 0.95))', zIndex: 1 }} />

                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', color: 'var(--color-surface)' }}>
                    <div>
                        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-dark)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>S</div>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: '1px', color: 'var(--color-surface)' }}>SMARTQ<span style={{ color: 'var(--color-accent-gold)' }}>.</span></span>
                        </Link>
                    </div>

                    <div style={{ maxWidth: '500px' }}>
                        <h2 style={{ color: 'var(--color-surface)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-lg)' }}>Elevate your wellness business.</h2>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', fontSize: 'var(--text-lg)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}><CheckCircle2 color="var(--color-accent-gold)" /> Effortless visual calendar</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}><CheckCircle2 color="var(--color-accent-gold)" /> Smart client management (CRM)</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}><CheckCircle2 color="var(--color-accent-gold)" /> Integrated POS & Tap-to-Pay</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}><CheckCircle2 color="var(--color-accent-gold)" /> AI-powered 24/7 receptionist</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 60px', background: 'var(--color-surface)', position: 'relative', zIndex: 10, boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', maxWidth: '560px' }} className="animate-fade-in">
                    <div style={{ marginBottom: '28px' }}>
                        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xs)' }}>Create your account</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Start your 14-day free trial. No credit card required.</p>
                    </div>

                    {error && (
                        <div style={{ padding: '12px 16px', marginBottom: '20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Business Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Business Name <span style={{ color: '#EF4444' }}>*</span></label>
                            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} placeholder="Aura Signature Spa" required onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Business Category <span style={{ color: '#EF4444' }}>*</span></label>
                            <select value={form.category} onChange={(e) => update('category', e.target.value)} required
                                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394A3B8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                                onFocus={focusHandler} onBlur={blurHandler}>
                                <option value="" disabled>Select your business type</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Email & Phone (side by side) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Work Email <span style={{ color: '#EF4444' }}>*</span></label>
                                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} placeholder="owner@salon.com" required onFocus={focusHandler} onBlur={blurHandler} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone Number <span style={{ color: '#EF4444' }}>*</span></label>
                                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} placeholder="+94 77 123 4567" required onFocus={focusHandler} onBlur={blurHandler} />
                            </div>
                        </div>

                        {/* Street Address */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Street Address <span style={{ color: '#EF4444' }}>*</span></label>
                            <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} style={inputStyle} placeholder="42 Galle Road, Colombo 03" required onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        {/* City & Country (side by side) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>City <span style={{ color: '#EF4444' }}>*</span></label>
                                <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} style={inputStyle} placeholder="Colombo" required onFocus={focusHandler} onBlur={blurHandler} />
                            </div>
                            <div>
                                <label style={labelStyle}>Country</label>
                                <input type="text" value={form.country} onChange={(e) => update('country', e.target.value)} style={inputStyle} placeholder="Sri Lanka" onFocus={focusHandler} onBlur={blurHandler} />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Password <span style={{ color: '#EF4444' }}>*</span></label>
                            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} style={inputStyle} placeholder="Minimum 6 characters" required minLength={6} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        {/* Description (optional) */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Short Description <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} placeholder="Tell clients what makes your business special..."
                                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '8px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Creating account...' : <>Start 14-Day Free Trial <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                            Already have an account? <Link to="/business/login" style={{ color: 'var(--color-text-main)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--color-accent-gold)', paddingBottom: '2px' }}>Log in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
