import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Phone, Search, Calendar, MapPin, Clock, User, Scissors,
    CheckCircle2, XCircle, AlertCircle, Loader2, CalendarClock, Building2,
    X, CreditCard, Star
} from 'lucide-react';

function getStatusInfo(status, startTimeStr) {
    let s = status?.toLowerCase() || 'pending';

    // If appointment is confirmed but the time has already passed, treat it as completed visually
    if (s === 'confirmed' && startTimeStr && !isUpcoming(startTimeStr)) {
        s = 'completed';
    }

    switch (s) {
        case 'confirmed':
            return { label: 'Confirmed', icon: CheckCircle2, cls: 'mb-status-confirmed' };
        case 'completed':
            return { label: 'Completed', icon: CheckCircle2, cls: 'mb-status-completed' };
        case 'paid':
            return { label: 'Paid', icon: CreditCard, cls: 'mb-status-paid' };
        case 'cancelled':
            return { label: 'Cancelled', icon: XCircle, cls: 'mb-status-cancelled' };
        case 'no_show':
        case 'no-show':
            return { label: 'No Show', icon: AlertCircle, cls: 'mb-status-noshow' };
        default:
            return { label: status || 'Pending', icon: Clock, cls: 'mb-status-pending' };
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isUpcoming(dateStr) {
    return new Date(dateStr) > new Date();
}

export default function MyBookings() {
    const [phone, setPhone] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Review state
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState({}); // { [appointmentId]: { rating, comment } }
    const [reviewError, setReviewError] = useState('');

    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    async function handleSearch(e) {
        e?.preventDefault();
        if (!phone.trim() || phone.trim().length < 4) {
            setError('Please enter a valid phone number');
            return;
        }
        setLoading(true);
        setError('');
        setSearched(false);

        try {
            const res = await fetch('/api/bookings/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Lookup failed');

            const bookingList = data.bookings || [];
            setBookings(bookingList);
            setSearched(true);

            // Load existing reviews for each booking
            const reviewMap = {};
            await Promise.all(bookingList.map(async (b) => {
                try {
                    const r = await fetch(`/api/bookings/${b.id}/review`);
                    const rd = await r.json();
                    if (rd.review) reviewMap[b.id] = rd.review;
                } catch (_) { }
            }));
            setReviewSubmitted(reviewMap);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openBookingModal(b) {
        setSelectedBooking(b);
        setReviewRating(0);
        setReviewHover(0);
        setReviewComment('');
        setReviewError('');
    }

    async function handleSubmitReview(bookingId) {
        if (reviewRating < 1) {
            setReviewError('Please select a rating');
            return;
        }
        setReviewLoading(true);
        setReviewError('');
        try {
            const res = await fetch(`/api/bookings/${bookingId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), rating: reviewRating, comment: reviewComment.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit review');

            setReviewSubmitted(prev => ({
                ...prev,
                [bookingId]: { rating: reviewRating, comment: reviewComment.trim() || null }
            }));
        } catch (err) {
            setReviewError(err.message);
        } finally {
            setReviewLoading(false);
        }
    }

    const upcoming = bookings.filter(b => isUpcoming(b.start_time) && b.status !== 'cancelled');
    const past = bookings.filter(b => !isUpcoming(b.start_time) || b.status === 'cancelled');
    const displayBookings = activeTab === 'upcoming' ? upcoming : past;

    return (
        <div className="mb-page">
            {/* Header */}
            <nav className="aura-nav">
                <div className="aura-logo-branded">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div className="aura-logo-icon">S</div>
                        <div className="aura-logo-text">SMARTQ<span>.</span></div>
                    </Link>
                </div>
                <div className="nav-links-center">
                    <Link to="/">Explore</Link>
                    <Link to="/my-bookings" style={{ fontWeight: 600, color: 'var(--color-accent-gold)' }}>My Bookings</Link>
                    <Link to="/business/register">For Business</Link>
                </div>
                <div className="nav-actions-right">
                    <Link to="/business/login" className="nav-login-link">Log in</Link>
                    <Link to="/business/register" className="btn-gold">Sign up</Link>
                </div>
            </nav>

            {/* Hero / Search Area */}
            <div className="mb-hero">
                <div className="mb-hero-inner">
                    <CalendarClock size={48} className="mb-hero-icon" />
                    <h1>My Bookings</h1>
                    <p className="mb-hero-sub">Enter your phone number to view all your appointments across SmartQ venues.</p>

                    <form className="mb-search-form" onSubmit={handleSearch}>
                        <div className="mb-search-input-wrap">
                            <Phone size={20} className="mb-search-icon" />
                            <input
                                ref={inputRef}
                                type="tel"
                                value={phone}
                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                placeholder="Enter your phone number"
                                className="mb-search-input"
                            />
                        </div>
                        <button type="submit" className="mb-search-btn" disabled={loading}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Searching...' : 'Find Bookings'}
                        </button>
                    </form>

                    {error && (
                        <div className="mb-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            {searched && (
                <div className="mb-results">
                    {bookings.length === 0 ? (
                        <div className="mb-empty">
                            <Calendar size={56} />
                            <h3>No bookings found</h3>
                            <p>We couldn't find any appointments linked to <strong>{phone}</strong>.</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Make sure you entered the same phone number used during booking.
                            </p>
                            <Link to="/chat" className="mb-cta-btn">
                                <CalendarClock size={16} /> Book your first appointment
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-results-header">
                                <h2>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} found</h2>

                                <div className="mb-tabs">
                                    <button
                                        className={`mb-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('upcoming')}
                                    >
                                        Upcoming ({upcoming.length})
                                    </button>
                                    <button
                                        className={`mb-tab ${activeTab === 'past' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('past')}
                                    >
                                        Past & Cancelled ({past.length})
                                    </button>
                                </div>
                            </div>

                            {displayBookings.length === 0 ? (
                                <div className="mb-empty-tab" style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                                    <p>No {activeTab} bookings.</p>
                                </div>
                            ) : (
                                <div className="mb-booking-list">
                                    {displayBookings.map(b => {
                                        const statusInfo = getStatusInfo(b.status, b.start_time);
                                        const StatusIcon = statusInfo.icon;
                                        const existingReview = reviewSubmitted[b.id];

                                        return (
                                            <div
                                                key={b.id}
                                                className={`mb-booking-card ${statusInfo.cls}`}
                                                onClick={() => openBookingModal(b)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="mb-card-date-strip">
                                                    <span className="mb-date">{formatDate(b.start_time)}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {existingReview && (
                                                            <span className="mb-review-stars-mini">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <Star key={s} size={12} fill={s <= existingReview.rating ? '#F59E0B' : 'none'} color={s <= existingReview.rating ? '#F59E0B' : '#D1D5DB'} />
                                                                ))}
                                                            </span>
                                                        )}
                                                        <span className={`mb-status-badge ${statusInfo.cls}`}>
                                                            <StatusIcon size={13} />
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-card-body">
                                                    <div className="mb-card-main">
                                                        <h3 className="mb-service-name">
                                                            <Scissors size={16} />
                                                            {b.service_name || 'Service not specified'}
                                                        </h3>

                                                        <div className="mb-card-details">
                                                            <div className="mb-detail">
                                                                <Clock size={14} />
                                                                <span>{formatTime(b.start_time)} — {formatTime(b.end_time)}</span>
                                                                {b.duration_min && <span className="mb-duration">({b.duration_min} min)</span>}
                                                            </div>

                                                            {b.staff_name && (
                                                                <div className="mb-detail">
                                                                    <User size={14} />
                                                                    <span>{b.staff_name}</span>
                                                                </div>
                                                            )}

                                                            {b.client_name && (
                                                                <div className="mb-detail" style={{ color: '#4b5563' }}>
                                                                    <User size={14} />
                                                                    <span>For: {b.client_name}</span>
                                                                </div>
                                                            )}

                                                            <div className="mb-detail">
                                                                <Building2 size={14} />
                                                                <span>{b.business_name}</span>
                                                            </div>

                                                            {(b.business_address || b.business_city) && (
                                                                <div className="mb-detail">
                                                                    <MapPin size={14} />
                                                                    <span>{[b.business_address, b.business_city].filter(Boolean).join(', ')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {b.service_price && (
                                                        <div className="mb-card-price">
                                                            <span className="mb-price-label">Price</span>
                                                            <span className="mb-price-value">Rs. {Number(b.service_price).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {b.notes && (
                                                    <div className="mb-card-notes">
                                                        <span>Note:</span> {b.notes}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Booking Detail Modal with Review ── */}
            {selectedBooking && (() => {
                const b = selectedBooking;
                const statusInfo = getStatusInfo(b.status, b.start_time);
                const StatusIcon = statusInfo.icon;
                const existingReview = reviewSubmitted[b.id];

                return (
                    <div className="mb-modal-overlay" onClick={() => setSelectedBooking(null)}>
                        <div className="mb-modal" onClick={e => e.stopPropagation()}>
                            {/* Modal header */}
                            <div className="mb-modal-header">
                                <h2>Booking Details</h2>
                                <button className="mb-modal-close" onClick={() => setSelectedBooking(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Status badge */}
                            <div className="mb-modal-status">
                                <span className={`mb-status-badge ${statusInfo.cls}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
                                    <StatusIcon size={15} />
                                    {statusInfo.label}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="mb-modal-body">
                                <div className="mb-modal-row mb-modal-service">
                                    <Scissors size={20} />
                                    <div>
                                        <strong>{b.service_name || 'Service not specified'}</strong>
                                        {b.duration_min && <span className="mb-modal-sub">{b.duration_min} minutes</span>}
                                    </div>
                                </div>

                                <div className="mb-modal-row">
                                    <Calendar size={18} />
                                    <span>{formatDate(b.start_time)}</span>
                                </div>

                                <div className="mb-modal-row">
                                    <Clock size={18} />
                                    <span>{formatTime(b.start_time)} — {formatTime(b.end_time)}</span>
                                </div>

                                {b.staff_name && (
                                    <div className="mb-modal-row">
                                        <User size={18} />
                                        <span>{b.staff_name}</span>
                                    </div>
                                )}

                                {b.client_name && (
                                    <div className="mb-modal-row" style={{ color: '#4b5563' }}>
                                        <User size={18} />
                                        <span>For: {b.client_name}</span>
                                    </div>
                                )}

                                <div className="mb-modal-row">
                                    <Building2 size={18} />
                                    <span>{b.business_name}</span>
                                </div>

                                {(b.business_address || b.business_city) && (
                                    <div className="mb-modal-row">
                                        <MapPin size={18} />
                                        <span>{[b.business_address, b.business_city].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}

                                {b.business_phone && (
                                    <div className="mb-modal-row">
                                        <Phone size={18} />
                                        <span>{b.business_phone}</span>
                                    </div>
                                )}

                                {b.service_price && (
                                    <div className="mb-modal-price-row">
                                        <span>Total</span>
                                        <span className="mb-modal-price">Rs. {Number(b.service_price).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* ── Review Section ── */}
                            <div className="mb-review-section">
                                {existingReview ? (
                                    /* Already reviewed — show the review */
                                    <div className="mb-review-done">
                                        <div className="mb-review-done-header">
                                            <Star size={18} fill="#F59E0B" color="#F59E0B" />
                                            <span>Your Review</span>
                                        </div>
                                        <div className="mb-review-stars-display">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={22} fill={s <= existingReview.rating ? '#F59E0B' : 'none'} color={s <= existingReview.rating ? '#F59E0B' : '#D1D5DB'} />
                                            ))}
                                            <span className="mb-review-rating-num">{existingReview.rating}/5</span>
                                        </div>
                                        {existingReview.comment && (
                                            <p className="mb-review-comment-display">"{existingReview.comment}"</p>
                                        )}
                                    </div>
                                ) : (
                                    /* Review form */
                                    <div className="mb-review-form">
                                        <div className="mb-review-form-header">
                                            <Star size={18} color="var(--color-accent-gold)" />
                                            <span>Rate your experience</span>
                                        </div>

                                        <div className="mb-review-stars-input">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className="mb-star-btn"
                                                    onMouseEnter={() => setReviewHover(s)}
                                                    onMouseLeave={() => setReviewHover(0)}
                                                    onClick={() => setReviewRating(s)}
                                                >
                                                    <Star
                                                        size={32}
                                                        fill={(reviewHover || reviewRating) >= s ? '#F59E0B' : 'none'}
                                                        color={(reviewHover || reviewRating) >= s ? '#F59E0B' : '#D1D5DB'}
                                                    />
                                                </button>
                                            ))}
                                        </div>

                                        {reviewRating > 0 && (
                                            <p className="mb-rating-label">
                                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                                            </p>
                                        )}

                                        <textarea
                                            value={reviewComment}
                                            onChange={e => setReviewComment(e.target.value)}
                                            placeholder="Share your experience... (optional)"
                                            className="mb-review-textarea"
                                            rows={3}
                                        />

                                        {reviewError && (
                                            <div className="mb-error" style={{ margin: '0 0 8px', display: 'flex' }}>
                                                <AlertCircle size={14} />
                                                <span>{reviewError}</span>
                                            </div>
                                        )}

                                        <button
                                            className="mb-review-submit"
                                            onClick={() => handleSubmitReview(b.id)}
                                            disabled={reviewLoading || reviewRating < 1}
                                        >
                                            {reviewLoading ? <Loader2 size={16} className="spin" /> : <Star size={16} />}
                                            {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Footer */}
            <footer style={{ padding: 'var(--space-xl) 0', borderTop: '1px solid var(--color-border)', textAlign: 'center', marginTop: 'auto' }}>
                <p>© 2026 SmartQ Platform. Elevating self-care.</p>
            </footer>
        </div>
    );
}
