import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2, Sparkles, Building2, Calendar as CalendarIcon, Megaphone } from 'lucide-react';

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.removeAttribute('data-theme');
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/auth/promotions/active');
            const data = await res.json();
            if (data.promotions) {
                setPromotions(data.promotions);
            }
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Just navigate to home with search query
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleBookNow = (company) => {
        // Find venue structure and navigate back to landing page with venue selected
        // We can just go to the landing page and trigger search
        navigate(`/?q=${encodeURIComponent(company)}`);
    };

    return (
        <div className="consumer-layout">
            {/* Header */}
            <header className="header">
                <div className="header-container container">
                    <div className="logo-section">
                        <Link to="/" className="logo-link">
                            <div className="logo-icon">S</div>
                            <span className="logo-text">SmartQ</span>
                        </Link>
                    </div>

                    <form className="search-bar" onSubmit={handleSearch}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Find services or salons..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="search-btn">Search</button>
                    </form>

                    <nav className="header-nav">
                        <Link to="/business/login" className="nav-link hide-mobile">For Businesses</Link>
                        <Link to="/my-bookings" className="nav-link">My Bookings</Link>
                        <Link to="/chat" className="nav-link">AI Support</Link>
                    </nav>
                </div>
            </header>

            <main className="main-content" style={{ padding: 'var(--space-2xl) 0', background: 'var(--color-bg-alt)', minHeight: 'calc(100vh - 160px)' }}>
                <div className="container animate-fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Megaphone size={14} /> Offers
                        </span>
                        <h2>Exclusive <span style={{ color: 'var(--color-accent-gold)' }}>Promotions</span></h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', maxWidth: '600px', margin: '16px auto 0' }}>
                            Discover limited-time offers and special packages from top wellness and beauty destinations.
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Loader2 size={32} className="spin" color="var(--color-accent-gold)" />
                        </div>
                    ) : promotions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFF', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
                            <Megaphone size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '20px', color: 'var(--color-text-main)', marginBottom: '8px' }}>No active promotions right now</h3>
                            <p style={{ color: 'var(--color-text-muted)' }}>Check back later for new exclusive offers from our partners.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
                            {promotions.map((promo) => (
                                <div key={promo.id} style={{
                                    background: '#FFF',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(212,175,55,0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}
                                    onClick={() => handleBookNow(promo.company_name)}
                                >
                                    <div style={{ height: '200px', position: 'relative', background: '#F8FAFC' }}>
                                        {promo.image_url ? (
                                            <img src={promo.image_url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-border)' }}>
                                                <Sparkles size={40} />
                                            </div>
                                        )}

                                        {/* Company Badge Overlay */}
                                        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                <Building2 size={14} color="var(--color-accent-gold)" />
                                                {promo.company_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 12px', lineHeight: 1.3 }}>{promo.title}</h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 20px', flexGrow: 1 }}>
                                            {promo.description}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                                <CalendarIcon size={14} />
                                                <span>Ends {new Date(promo.end_date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                                <MapPin size={14} />
                                                <span>{promo.company_city || 'Multiple Locations'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 24, height: 24, background: 'var(--color-text-main)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-gold)', fontWeight: 700, fontSize: '12px' }}>S</div>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)' }}>SmartQ</span>
                    </div>
                    <div className="footer-links" style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/">Home</Link>
                        <Link to="/promotions">Promotions</Link>
                        <Link to="/chat">AI Assistant</Link>
                        <Link to="/business/login">Business Login</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
