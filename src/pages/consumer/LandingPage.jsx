import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, MapPin, CalendarClock, CreditCard, Star,
    Scissors, Sparkles, Smile, Grid,
    BarChart, Users, Smartphone, Bot, Banknote, Clock, ArrowRight, MessageSquare,
    CheckCircle, Flower2, PenTool, Focus, Droplets, Paintbrush, Tag, Phone,
    ChevronLeft, ChevronRight, X, Calendar, Building2, Hash, SlidersHorizontal
} from 'lucide-react';
import BookingModal from '../../components/BookingModal';

/* ── Service category definitions with icons ── */
const SERVICE_CATEGORIES = [
    { label: 'All treatments & venues', icon: Grid, value: 'All' },
    { label: 'Hair & styling', icon: Scissors, value: 'Hair Salon' },
    { label: 'Nails', icon: Sparkles, value: 'Nail Salon' },
    { label: 'Spa & Wellness', icon: Flower2, value: 'Spa' },
    { label: 'Facials & skincare', icon: Droplets, value: 'Skin Clinic' },
    { label: 'Massage', icon: Smile, value: 'Massage' },
    { label: 'Makeup', icon: Paintbrush, value: 'Makeup Studio' },
    { label: 'Barber', icon: Focus, value: 'Barber' },
    { label: 'Bridal', icon: Star, value: 'Bridal Studio' },
    { label: 'Men\'s Grooming', icon: PenTool, value: 'Men\'s Grooming' },
    { label: 'Wellness Hub', icon: CheckCircle, value: 'Wellness Hub' },
];

/* ── Extracted Venue Card Component ── */
function VenueCard({ venue, onBookNow }) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="recommended-card" onClick={() => onBookNow(venue)}>
            <div className="card-img-wrapper">
                {venue.img && !imgError ? (
                    <img
                        src={venue.img}
                        alt={venue.name}
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="card-img-fallback">
                        <Sparkles size={28} />
                        <span>{venue.type}</span>
                    </div>
                )}
                {/* Category badge on image */}
                <span className="card-category-badge">{venue.type}</span>
            </div>
            <div className="card-content">
                <h4 className="card-name" title={venue.name}>{venue.name}</h4>
                <p className="card-location">
                    <MapPin size={13} /> {venue.address ? `${venue.address}, ${venue.city}` : venue.location}
                </p>
                {venue.phone && (
                    <p className="card-phone">
                        <Phone size={12} /> {venue.phone}
                    </p>
                )}
                {venue.description && (
                    <p className="card-description">{venue.description}</p>
                )}
                {venue.keywords && (
                    <div className="card-keywords">
                        {venue.keywords.split(',').slice(0, 4).map((kw, i) => (
                            <span key={i} className="keyword-pill">{kw.trim()}</span>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                        <Star size={14} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                        {venue.avg_rating > 0 ? (
                            <span>{venue.avg_rating} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({venue.review_count})</span></span>
                        ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>New</span>
                        )}
                        {venue.client_count > 0 && (
                            <>
                                <span style={{ color: 'var(--color-border)', margin: '0 4px' }}>|</span>
                                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}><Users size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '2px' }} />{venue.client_count}</span>
                            </>
                        )}
                    </div>
                    <button
                        className="card-book-btn"
                        onClick={(e) => { e.stopPropagation(); onBookNow(venue); }}
                    >
                        Book
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const [venues, setVenues] = useState([]);
    const [filteredVenues, setFilteredVenues] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollRef = useRef(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCategory, setSearchCategory] = useState('All');
    const [searchCity, setSearchCity] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [showTreatmentDropdown, setShowTreatmentDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [availableCities, setAvailableCities] = useState([]);
    const [popularKeywords, setPopularKeywords] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [bookingVenue, setBookingVenue] = useState(null);

    const treatmentRef = useRef(null);
    const locationRef = useRef(null);
    const searchTimerRef = useRef(null);

    // Fetch initial listings + metadata + reviews + promotions
    useEffect(() => {
        Promise.all([
            fetch('/api/auth/listings').then(r => r.json()),
            fetch('/api/auth/search/meta').then(r => r.json()),
            fetch('/api/auth/reviews').then(r => r.json()),
            fetch('/api/auth/promotions/active').then(r => r.json()),
        ])
            .then(([listingsData, metaData, reviewsData, promosData]) => {
                if (listingsData.businesses?.length) {
                    const mapped = listingsData.businesses.map(mapBusiness);
                    setVenues(mapped);
                    setFilteredVenues(mapped);
                }
                if (metaData.cities) setAvailableCities(metaData.cities);
                if (metaData.popularKeywords) setPopularKeywords(metaData.popularKeywords);
                if (reviewsData && reviewsData.reviews) setReviews(reviewsData.reviews);
                if (promosData && promosData.promotions) setPromotions(promosData.promotions);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Auto-rotate promotions
    useEffect(() => {
        if (!promotions || promotions.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentPromoIndex(prev => (prev + 1) % promotions.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [promotions]);

    function mapBusiness(b) {
        return {
            id: b.id,
            name: b.name,
            location: [b.city, b.country].filter(Boolean).join(', ') || 'Location not set',
            city: b.city || '',
            country: b.country || '',
            type: b.category || 'Salon',
            img: b.image_url || '',
            description: b.description || '',
            keywords: b.keywords || '',
            phone: b.phone || '',
            address: b.address || '',
            avg_rating: b.avg_rating || 0,
            review_count: b.review_count || 0,
            client_count: b.client_count || 0,
        };
    }

    // Debounced search
    const performSearch = useCallback(() => {
        const hasFilters = searchQuery.trim() || searchCategory !== 'All' || searchCity.trim();

        if (!hasFilters) {
            setFilteredVenues(venues);
            setIsSearchActive(false);
            return;
        }

        setSearchLoading(true);
        setIsSearchActive(true);

        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (searchCategory !== 'All') params.set('category', searchCategory);
        if (searchCity.trim()) params.set('city', searchCity.trim());

        fetch(`/api/auth/search?${params}`)
            .then(r => r.json())
            .then(data => {
                if (data.businesses) {
                    setFilteredVenues(data.businesses.map(mapBusiness));
                }
            })
            .catch(() => { })
            .finally(() => setSearchLoading(false));
    }, [searchQuery, searchCategory, searchCity, venues]);

    // Trigger search on filter changes (debounced for text, immediate for dropdowns)
    useEffect(() => {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(performSearch, 350);
        return () => clearTimeout(searchTimerRef.current);
    }, [performSearch]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (treatmentRef.current && !treatmentRef.current.contains(e.target)) {
                setShowTreatmentDropdown(false);
            }
            if (locationRef.current && !locationRef.current.contains(e.target)) {
                setShowLocationDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchCategory('All');
        setSearchCity('');
        setSearchDate('');
        setIsSearchActive(false);
        setFilteredVenues(venues);
    };

    const matchingCompanies = searchQuery.trim()
        ? venues.filter(v =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.keywords.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    const filteredCities = searchCity.trim()
        ? availableCities.filter(c => c.toLowerCase().includes(searchCity.toLowerCase()))
        : availableCities;

    const checkScrollability = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || showAll) return;
        checkScrollability();
        el.addEventListener('scroll', checkScrollability, { passive: true });
        const resizeObs = new ResizeObserver(checkScrollability);
        resizeObs.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScrollability);
            resizeObs.disconnect();
        };
    }, [venues, showAll, checkScrollability]);

    const scroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        const cardW = 340;
        el.scrollBy({ left: dir === 'left' ? -cardW * 2 : cardW * 2, behavior: 'smooth' });
    };

    const scrollPromos = (dir) => {
        const el = document.getElementById('promotions-carousel');
        if (!el) return;
        const cardW = 340;
        el.scrollBy({ left: dir === 'left' ? -cardW * 2 : cardW * 2, behavior: 'smooth' });
    };

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="aura-nav">
                <div className="aura-logo-branded">
                    <div className="aura-logo-icon">S</div>
                    <div className="aura-logo-text">SMARTQ<span>.</span></div>
                </div>

                <div className="nav-links-center">
                    <a href="#explore">Explore</a>
                    <Link to="/my-bookings">My Bookings</Link>
                    <Link to="/business/register">For Business</Link>
                </div>

                <div className="nav-actions-right">
                    <Link to="/business/register" className="nav-login-link">Log in</Link>
                    <Link to="/business/register" className="btn-gold">Sign up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-title-wrap">
                    <h1 className="animate-reveal delay-1">Elevate your wellness.</h1>
                    <p className="hero-subtitle animate-reveal delay-2">
                        Discover and book the world's most exceptional salons, spas, and wellness professionals in seconds.
                    </p>

                    {/* ═══ ADVANCED SEARCH BAR ═══ */}
                    <div className="adv-search-bar animate-reveal delay-3">
                        {/* ── Segment 1: Treatment / Venue Search ── */}
                        <div className="adv-search-segment adv-segment-main" ref={treatmentRef}>
                            <Search size={20} className="adv-seg-icon" />
                            <input
                                type="text"
                                placeholder="All treatments and venues"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowTreatmentDropdown(true);
                                }}
                                onFocus={() => setShowTreatmentDropdown(true)}
                            />
                            {searchQuery && (
                                <button className="adv-clear-btn" onClick={() => { setSearchQuery(''); setShowTreatmentDropdown(false); }}>
                                    <X size={14} />
                                </button>
                            )}

                            {/* Treatment Dropdown */}
                            {showTreatmentDropdown && (
                                <div className="adv-dropdown">
                                    {/* Matching companies */}
                                    {matchingCompanies.length > 0 && (
                                        <div className="adv-dd-section">
                                            <p className="adv-dd-label">Venues</p>
                                            {matchingCompanies.map(v => (
                                                <button
                                                    key={v.id}
                                                    className="adv-dd-item"
                                                    onClick={() => {
                                                        setSearchQuery(v.name);
                                                        setShowTreatmentDropdown(false);
                                                    }}
                                                >
                                                    <Building2 size={16} />
                                                    <div className="adv-dd-item-info">
                                                        <span className="adv-dd-item-name">{v.name}</span>
                                                        <span className="adv-dd-item-sub">{v.type} • {v.city}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Categories */}
                                    <div className="adv-dd-section">
                                        <p className="adv-dd-label">Top categories</p>
                                        {SERVICE_CATEGORIES.map(cat => {
                                            const Icon = cat.icon;
                                            return (
                                                <button
                                                    key={cat.value}
                                                    className={`adv-dd-item ${searchCategory === cat.value ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setSearchCategory(cat.value);
                                                        if (cat.value === 'All') setSearchQuery('');
                                                        else setSearchQuery(cat.label);
                                                        setShowTreatmentDropdown(false);
                                                    }}
                                                >
                                                    <Icon size={18} />
                                                    <span className="adv-dd-item-name">{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Popular Keywords */}
                                    {popularKeywords.length > 0 && !searchQuery && (
                                        <div className="adv-dd-section">
                                            <p className="adv-dd-label">Popular searches</p>
                                            <div className="adv-dd-keywords">
                                                {popularKeywords.slice(0, 12).map((kw, i) => (
                                                    <button
                                                        key={i}
                                                        className="adv-dd-keyword-pill"
                                                        onClick={() => {
                                                            setSearchQuery(kw);
                                                            setShowTreatmentDropdown(false);
                                                        }}
                                                    >
                                                        <Hash size={12} /> {kw}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="adv-divider" />

                        {/* ── Segment 2: Location ── */}
                        <div className="adv-search-segment adv-segment-location" ref={locationRef}>
                            <MapPin size={20} className="adv-seg-icon" />
                            <input
                                type="text"
                                placeholder="Current location"
                                value={searchCity}
                                onChange={(e) => {
                                    setSearchCity(e.target.value);
                                    setShowLocationDropdown(true);
                                }}
                                onFocus={() => setShowLocationDropdown(true)}
                            />
                            {searchCity && (
                                <button className="adv-clear-btn" onClick={() => { setSearchCity(''); setShowLocationDropdown(false); }}>
                                    <X size={14} />
                                </button>
                            )}

                            {/* Location Dropdown */}
                            {showLocationDropdown && filteredCities.length > 0 && (
                                <div className="adv-dropdown adv-dropdown-sm">
                                    <div className="adv-dd-section">
                                        <p className="adv-dd-label">Cities</p>
                                        {filteredCities.map(c => (
                                            <button
                                                key={c}
                                                className={`adv-dd-item ${searchCity === c ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSearchCity(c);
                                                    setShowLocationDropdown(false);
                                                }}
                                            >
                                                <MapPin size={16} />
                                                <span className="adv-dd-item-name">{c}, Sri Lanka</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="adv-divider" />

                        {/* ── Segment 3: Date ── */}
                        <div className="adv-search-segment adv-segment-date">
                            <Calendar size={20} className="adv-seg-icon" />
                            <input
                                type={searchDate ? 'date' : 'text'}
                                placeholder="Any time"
                                value={searchDate}
                                onFocus={(e) => { e.target.type = 'date'; }}
                                onBlur={(e) => { if (!searchDate) e.target.type = 'text'; }}
                                onChange={(e) => setSearchDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* ── Search Button ── */}
                        <button className="adv-search-btn" onClick={performSearch}>
                            Search
                        </button>
                    </div>

                    <div className="hero-below-search">
                        {/* Active filters indicator */}
                        {isSearchActive && (
                            <div className="adv-active-filters">
                                <SlidersHorizontal size={14} />
                                <span>
                                    Showing {filteredVenues.length} result{filteredVenues.length !== 1 ? 's' : ''}
                                    {searchCategory !== 'All' && ` in ${searchCategory}`}
                                    {searchCity && ` near ${searchCity}`}
                                </span>
                                <button className="adv-clear-all" onClick={clearSearch}>Clear all</button>
                            </div>
                        )}
                    </div>

                    <div className="hero-chat-cta animate-reveal delay-3" style={{ marginTop: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-md)', background: 'var(--color-surface)', padding: 'var(--space-sm) var(--space-lg)', borderRadius: '99px', boxShadow: 'var(--shadow-hover)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(222, 178, 48, 0.1)', color: 'var(--color-accent-gold)' }}>
                            <Bot size={24} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-main)', fontSize: 'var(--text-sm)' }}>Not sure what to book?</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Chat with our 24/7 agent and make an appointment.</p>
                        </div>
                        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '99px', marginLeft: 'var(--space-md)', textDecoration: 'none' }}>Start Chat</Link>
                    </div>
                </div>
            </header>

            {/* Recommended Venues — fully dynamic from DB */}
            <section id="explore" className="section container recommended-section">
                <div className="section-header-flex">
                    <div>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '4px' }}>
                            {isSearchActive ? 'Search Results' : 'Recommended'}
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                            {isSearchActive
                                ? `${filteredVenues.length} venue${filteredVenues.length !== 1 ? 's' : ''} found`
                                : 'Handpicked wellness destinations across Sri Lanka'
                            }
                        </p>
                    </div>
                    <button
                        className={`link-view-all ${showAll ? 'active' : ''}`}
                        onClick={() => setShowAll(prev => !prev)}
                    >
                        {showAll ? (
                            <>Close <X size={18} /></>
                        ) : (
                            <>View all <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="venue-skeleton-row">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton-card">
                                <div className="skeleton-img" />
                                <div className="skeleton-text" style={{ width: '70%' }} />
                                <div className="skeleton-text" style={{ width: '50%' }} />
                                <div className="skeleton-text" style={{ width: '90%' }} />
                            </div>
                        ))}
                    </div>
                ) : venues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-muted)' }}>
                        <p>No businesses listed yet. Be the first!</p>
                        <Link to="/business/register" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Register your business</Link>
                    </div>
                ) : filteredVenues.length === 0 && isSearchActive ? (
                    <div className="adv-no-results">
                        <Search size={40} />
                        <h3>No venues found</h3>
                        <p>Try adjusting your search terms or filters</p>
                        <button className="btn btn-primary" onClick={clearSearch}>Clear search</button>
                    </div>
                ) : showAll || isSearchActive ? (
                    /* ---- VIEW ALL / SEARCH RESULTS: Vertical responsive grid ---- */
                    <div className="venue-grid-all" key={`grid-${filteredVenues.length}-${searchQuery}-${searchCategory}-${searchCity}`}>
                        {filteredVenues.map(venue => (
                            <VenueCard key={venue.id} venue={venue} onBookNow={setBookingVenue} />
                        ))}
                    </div>
                ) : (
                    /* ---- DEFAULT: Horizontal scrollable with arrows ---- */
                    <div className="venue-carousel-wrapper">
                        {canScrollLeft && (
                            <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll('left')} aria-label="Scroll left">
                                <ChevronLeft size={22} />
                            </button>
                        )}
                        <div className="venue-scroll-grid animate-reveal delay-2" ref={scrollRef}>
                            {filteredVenues.map(venue => (
                                <VenueCard key={venue.id} venue={venue} onBookNow={setBookingVenue} />
                            ))}
                        </div>
                        {canScrollRight && (
                            <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll('right')} aria-label="Scroll right">
                                <ChevronRight size={22} />
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Promotions Section */}
            {!loading && !isSearchActive && (
                <section className="section container" style={{ paddingTop: 0 }}>
                    <div className="section-header-flex" style={{ marginBottom: '24px' }}>
                        <div>
                            <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles size={14} color="var(--color-accent-gold)" /> Special Offers
                            </span>
                            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '4px' }}>
                                Exclusive Promotions
                            </h2>
                        </div>
                        <Link to="/promotions" className="link-view-all">
                            View all offers <ArrowRight size={18} />
                        </Link>
                    </div>

                    {promotions.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', cursor: 'default', background: '#0F172A', minHeight: '380px' }}>

                            {promotions.map((promo, idx) => (
                                <div key={promo.id} style={{
                                    position: 'absolute', inset: 0, opacity: idx === currentPromoIndex ? 1 : 0,
                                    transition: 'opacity 0.8s ease-in-out', zIndex: idx === currentPromoIndex ? 1 : 0,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                                }}>
                                    {/* Background Image */}
                                    <div style={{ position: 'absolute', inset: 0 }}>
                                        {promo.image_url ? (
                                            <img src={promo.image_url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E293B, #0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.05)' }}>
                                                <Sparkles size={120} />
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 100%)' }} />
                                    </div>

                                    {/* Content Overlay */}
                                    <div style={{ position: 'relative', zIndex: 2, padding: '40px 48px', color: '#FFF', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                                        <div style={{ maxWidth: '720px', flexGrow: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                <span style={{ background: 'var(--color-accent-gold)', color: '#000', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
                                                    Limited Time
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                    <Building2 size={16} /> {promo.company_name}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '42px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1, textShadow: '0 4px 16px rgba(0,0,0,0.6)', letterSpacing: '-0.5px' }}>
                                                {promo.title}
                                            </h3>
                                            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.6, textShadow: '0 2px 8px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {promo.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Dots */}
                            <div style={{ position: 'absolute', bottom: '24px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
                                {promotions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentPromoIndex(idx); }}
                                        style={{
                                            width: idx === currentPromoIndex ? '32px' : '10px', height: '10px', borderRadius: '5px', border: 'none',
                                            background: idx === currentPromoIndex ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.3)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', padding: 0,
                                            boxShadow: idx === currentPromoIndex ? '0 0 10px rgba(212,175,55,0.5)' : 'none'
                                        }}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                            <Sparkles size={40} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)', marginBottom: '8px' }}>No active promotions right now</h3>
                            <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>Check back later for exclusive deals and offers from our partner businesses.</p>
                        </div>
                    )}
                </section>
            )}

            {/* Consumer Features (Golden Grid) — showcase first venue dynamically */}
            <section id="consumers" className="section container">
                <span className="section-label">The Marketplace</span>
                <h2 style={{ marginBottom: 'var(--space-2xl)' }}>Book seamlessly, live beautifully.</h2>

                <div className="golden-grid">
                    <div className="venue-showcase border-radius-sm">
                        <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200" alt="Beautiful Hair Salon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', justifyContent: 'center' }}>
                        <div>
                            <CalendarClock size={32} color="var(--color-accent-gold)" style={{ marginBottom: 'var(--space-sm)' }} />
                            <h3>Real-Time 24/7 Booking</h3>
                            <p>View live calendars, see available time slots for your favorite stylists, and book instantly without needing to make a single call.</p>
                        </div>
                        <div>
                            <CreditCard size={32} color="var(--color-accent-gold)" style={{ marginBottom: 'var(--space-sm)' }} />
                            <h3>In-App Payments & Tipping</h3>
                            <p>Store your cards securely. Pay seamlessly after your appointment is completed and leave a tip digitally.</p>
                        </div>
                        <div>
                            <Star size={32} color="var(--color-accent-gold)" style={{ marginBottom: 'var(--space-sm)' }} />
                            <h3>Verified Reviews & Transparent Pricing</h3>
                            <p>Read authentic ratings from past clients. Services are listed with upfront pricing and estimated timeframes, plus exclusive off-peak discounts.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Business Section — showcase second venue dynamically */}
            <section id="business" className="section" style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                marginTop: 'var(--space-2xl)',
                paddingBottom: 'var(--space-3xl)',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-subtle)',
                marginInline: 'var(--space-xl)'
            }}>
                <div className="container" style={{ paddingTop: 'var(--space-2xl)' }}>
                    <span className="section-label" style={{ color: 'var(--color-accent-gold)' }}>SmartQ SaaS</span>
                    <h2 style={{ color: 'var(--color-text-main)', marginBottom: 'var(--space-2xl)' }}>
                        The ultimate operating system <br /> for wellness businesses.
                    </h2>

                    <div className="golden-grid-reverse">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', justifyContent: 'center' }}>
                            <div>
                                <h4 style={{ color: 'var(--color-text-main)' }}>Visual Calendar & Resource Management</h4>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--phi)' }}>A drag-and-drop, color-coded calendar that updates in real-time. Schedule staff, massage rooms, and specialized equipment to perfectly avoid double-booking.</p>
                            </div>
                            <div className="divider" style={{ background: 'var(--color-border)' }}></div>
                            <div>
                                <h4 style={{ color: 'var(--color-text-main)' }}>Advanced CRM & Marketing</h4>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--phi)' }}>Store detailed client profiles, service notes, and digital waivers. Utilize Smart Campaigns to blast marketing emails and SMS for birthday offers or lapsed clients.</p>
                            </div>
                            <div className="divider" style={{ background: 'var(--color-border)' }}></div>
                            <div>
                                <h4 style={{ color: 'var(--color-text-main)' }}>Integrated POS & Inventory</h4>
                                <p style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--phi)' }}>Process physical cards via SmartQ terminals or Tap-to-Pay. Enforce no-show fees automatically while tracking retail stock natively.</p>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)', alignSelf: 'flex-start' }} onClick={() => window.location.href = '/business'}>
                                Explore Dashboard
                            </button>
                        </div>

                        <div className="venue-showcase" style={{ borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)' }}>
                            <img src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=1200" alt="Professional Hair Styling" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Innovations Section */}
            <section className="section container">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <span className="section-label">2026 Innovations</span>
                    <h2>The future is already here.</h2>
                </div>

                <div className="card-grid">
                    <div className="feature-card">
                        <div className="feature-icon-box">
                            <Bot size={32} />
                        </div>
                        <h4 className="feature-title">AI Receptionist</h4>
                        <p className="feature-p">An always-on AI assistant answering routine client questions via WhatsApp or SMS, guiding them to book or reschedule outside of working hours.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-box">
                            <Banknote size={32} />
                        </div>
                        <h4 className="feature-title">SmartQ Capital</h4>
                        <p className="feature-p">Fast, flexible funding offered directly through the platform. Renovate or expand with repayments taken automatically as a percentage of daily sales.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-box">
                            <Clock size={32} />
                        </div>
                        <h4 className="feature-title">Virtual Queues</h4>
                        <p className="feature-p">Streamlined tools to manage walk-in traffic. Allow clients to check themselves in via an iPad kiosk or their phone upon arrival.</p>
                    </div>
                </div>
            </section>

            {/* Browse by Service */}
            <section className="section container">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <h2>Browse by <span style={{ color: 'var(--color-accent-gold)' }}>Service</span></h2>
                    <p>Find exactly what you're looking for</p>
                </div>

                <div className="service-category-grid">
                    <div className="service-card">
                        <div className="service-icon"><Scissors size={24} /></div>
                        <span>Haircut</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Smile size={24} /></div>
                        <span>Massage</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Sparkles size={24} /></div>
                        <span>Nails</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Droplets size={24} /></div>
                        <span>Facial</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><PenTool size={24} /></div>
                        <span>Tattoo</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Paintbrush size={24} /></div>
                        <span>Makeup</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Focus size={24} /></div>
                        <span>Beard</span>
                    </div>
                    <div className="service-card">
                        <div className="service-icon"><Flower2 size={24} /></div>
                        <span>Spa</span>
                    </div>
                </div>
            </section>

            {/* Community Reviews Section */}
            {reviews.length > 0 && (
                <section className="section container" style={{ padding: 'var(--space-2xl) 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <span className="section-label">Community</span>
                        <h2>What People Are <span style={{ color: 'var(--color-accent-gold)' }}>Saying</span></h2>
                    </div>

                    <div className="reviews-carousel-wrapper" style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-lg)', scrollSnapType: 'x mandatory' }}>
                        {reviews.map(review => (
                            <div key={review.id} className="review-card" style={{
                                minWidth: '320px',
                                flex: '0 0 auto',
                                background: 'var(--color-surface)',
                                borderRadius: '16px',
                                padding: 'var(--space-xl)',
                                boxShadow: 'var(--shadow-subtle)',
                                border: '1px solid var(--color-border)',
                                scrollSnapAlign: 'start',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16} fill={s <= review.rating ? '#F59E0B' : 'transparent'} color={s <= review.rating ? '#F59E0B' : '#E2E8F0'} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ fontStyle: 'italic', color: 'var(--color-text-main)', lineHeight: 1.6, flexGrow: 1 }}>
                                    "{review.comment}"
                                </p>
                                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                                    <p style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>{review.client_name || 'Anonymous'}</p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-accent-gold)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <Building2 size={13} /> {review.company_name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="section container" style={{ background: 'var(--color-surface)', padding: 'var(--space-3xl) var(--space-xl)', borderRadius: '24px', margin: 'var(--space-3xl) auto', boxShadow: 'var(--shadow-subtle)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <h2>How It <span style={{ color: 'var(--color-accent-gold)' }}>Works</span></h2>
                    <p>Three simple steps to your next appointment</p>
                </div>

                <div className="how-it-works-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon">
                            <Search size={32} />
                        </div>
                        <h4>Search</h4>
                        <p>Find top-rated salons and wellness studios near you.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon">
                            <CalendarClock size={32} />
                        </div>
                        <h4>Book</h4>
                        <p>Pick your service, stylist, and time — all in a few taps.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon">
                            <Sparkles size={32} />
                        </div>
                        <h4>Enjoy</h4>
                        <p>Show up, relax, and leave feeling your absolute best.</p>
                    </div>
                </div>
            </section>

            {/* Footer minimal */}
            <footer style={{ padding: 'var(--space-xl) 0', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                <p>© 2026 SmartQ Platform. Elevating self-care.</p>
            </footer>

            {/* Booking Modal */}
            {bookingVenue && (
                <BookingModal venue={bookingVenue} onClose={() => setBookingVenue(null)} />
            )}
        </div>
    );
}
