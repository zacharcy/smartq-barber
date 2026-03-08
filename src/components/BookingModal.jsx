import React, { useState, useEffect, useMemo } from 'react';
import {
    X, ChevronRight, ChevronLeft, Clock, User, Calendar,
    CheckCircle, Loader2, AlertCircle, Phone, Mail, Tag
} from 'lucide-react';

const API = '/api/auth';

const STEPS = ['Service', 'Staff', 'Date & Time', 'Your Details', 'Confirm'];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function MiniCalendar({ selectedDate, onSelectDate }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const formatDate = (d) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${viewYear}-${mm}-${dd}`;
    };

    return (
        <div className="mini-cal">
            <div className="mini-cal-header">
                <button className="mini-cal-nav" onClick={prevMonth} disabled={!canGoPrev}>
                    <ChevronLeft size={16} />
                </button>
                <span className="mini-cal-title">{MONTHS[viewMonth]} {viewYear}</span>
                <button className="mini-cal-nav" onClick={nextMonth}>
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="mini-cal-days">
                {DAYS.map(d => <div key={d} className="mini-cal-day-label">{d}</div>)}
            </div>
            <div className="mini-cal-grid">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} className="mini-cal-cell empty" />;
                    const dateStr = formatDate(day);
                    const cellDate = new Date(viewYear, viewMonth, day);
                    const isPast = cellDate < today;
                    const isSunday = cellDate.getDay() === 0;
                    const isDisabled = isPast || isSunday;
                    const isSelected = dateStr === selectedDate;
                    const isToday = cellDate.getTime() === today.getTime();
                    return (
                        <button
                            key={dateStr}
                            className={`mini-cal-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${isDisabled ? ' disabled' : ''}`}
                            disabled={isDisabled}
                            onClick={() => onSelectDate(dateStr)}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function BookingModal({ venue, onClose }) {
    const [step, setStep] = useState(0);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [slots, setSlots] = useState([]);

    const [selectedService, setSelectedService] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingResult, setBookingResult] = useState(null);

    // Fetch services on open
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`${API}/business/${venue.id}/services`).then(r => r.json()),
            fetch(`${API}/business/${venue.id}/staff`).then(r => r.json()),
        ])
            .then(([svcData, staffData]) => {
                setServices(svcData.services || []);
                setStaff(staffData.staff || []);
            })
            .catch(() => setError('Failed to load business data'))
            .finally(() => setLoading(false));
    }, [venue.id]);

    // Fetch availability when staff + date selected
    useEffect(() => {
        if (!selectedStaff || !selectedDate || !selectedService) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        const params = new URLSearchParams({
            staff_id: selectedStaff.id,
            date: selectedDate,
            duration: selectedService.duration_min,
        });
        fetch(`${API}/business/${venue.id}/availability?${params}`)
            .then(r => r.json())
            .then(data => setSlots(data.slots || []))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedStaff, selectedDate, selectedService, venue.id]);

    const canProceed = () => {
        switch (step) {
            case 0: return !!selectedService;
            case 1: return !!selectedStaff;
            case 2: return !!selectedSlot && !!selectedDate;
            case 3: return clientName.trim().length > 0;
            default: return true;
        }
    };

    const handleBook = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_id: venue.id,
                    service_id: selectedService.id,
                    staff_id: selectedStaff.id,
                    start_time: selectedSlot.start,
                    end_time: selectedSlot.end,
                    client_name: clientName.trim(),
                    client_email: clientEmail.trim(),
                    client_phone: clientPhone.trim(),
                    notes: notes.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Booking failed');
                return;
            }
            setBookingResult(data);
            setStep(5); // success step
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 4) {
            handleBook();
        } else {
            setError('');
            setStep(s => s + 1);
        }
    };

    const prevStep = () => {
        setError('');
        setStep(s => s - 1);
    };

    // Group services by category
    const groupedServices = services.reduce((acc, svc) => {
        const cat = svc.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(svc);
        return acc;
    }, {});

    return (
        <div className="booking-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="booking-header">
                    <div>
                        <h3 className="booking-title">Book at {venue.name}</h3>
                        <p className="booking-subtitle">{venue.type} &bull; {venue.city || venue.location}</p>
                    </div>
                    <button className="booking-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Progress Steps */}
                {step < 5 && (
                    <div className="booking-steps">
                        {STEPS.map((label, i) => (
                            <div key={i} className={`booking-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                                <div className="step-dot">{i < step ? <CheckCircle size={14} /> : i + 1}</div>
                                <span className="step-label">{label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="booking-body">
                    {loading && step === 0 ? (
                        <div className="booking-loading">
                            <Loader2 size={32} className="spin" />
                            <p>Loading services...</p>
                        </div>
                    ) : step === 0 ? (
                        /* ── Step 1: Select Service ── */
                        <div className="booking-step-content">
                            <h4>Choose a service</h4>
                            {Object.entries(groupedServices).map(([cat, svcs]) => (
                                <div key={cat} className="service-group">
                                    <p className="service-group-label">{cat}</p>
                                    {svcs.map(svc => (
                                        <button
                                            key={svc.id}
                                            className={`service-option ${selectedService?.id === svc.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedService(svc)}
                                        >
                                            <div className="service-option-info">
                                                <span className="service-option-name">{svc.name}</span>
                                                <span className="service-option-meta">
                                                    <Clock size={12} /> {svc.duration_min} min
                                                </span>
                                            </div>
                                            <span className="service-option-price">
                                                LKR {Number(svc.price).toLocaleString()}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                            {services.length === 0 && (
                                <p className="booking-empty">No services available for this business.</p>
                            )}
                        </div>
                    ) : step === 1 ? (
                        /* ── Step 2: Select Staff ── */
                        <div className="booking-step-content">
                            <h4>Choose a staff member</h4>
                            <div className="staff-grid">
                                {staff.map(s => (
                                    <button
                                        key={s.id}
                                        className={`staff-option ${selectedStaff?.id === s.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedStaff(s)}
                                    >
                                        <div className="staff-avatar" style={{ background: s.color || '#D4AF37' }}>
                                            {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                        </div>
                                        <span className="staff-name">{s.name}</span>
                                        <span className="staff-role">{s.role}</span>
                                    </button>
                                ))}
                            </div>
                            {staff.length === 0 && (
                                <p className="booking-empty">No staff members listed.</p>
                            )}
                        </div>
                    ) : step === 2 ? (
                        /* ── Step 3: Date & Time ── */
                        <div className="booking-step-content">
                            <h4>Pick a date &amp; time</h4>
                            <div className="datetime-picker-layout">
                                <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                                <div className="time-picker-panel">
                                    {!selectedDate ? (
                                        <div className="time-picker-placeholder">
                                            <Calendar size={32} strokeWidth={1.5} />
                                            <p>Select a date to see available times</p>
                                        </div>
                                    ) : slotsLoading ? (
                                        <div className="booking-loading small">
                                            <Loader2 size={20} className="spin" />
                                            <p>Checking availability...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="slots-label">
                                                <Clock size={14} /> Slots for <strong>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                            </p>
                                            <div className="time-slots-grid modern">
                                                {slots.map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        className={`time-slot${!slot.available ? ' unavailable' : ''}${selectedSlot?.start === slot.start ? ' selected' : ''}`}
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        title={!slot.available ? 'This time slot is booked' : `Book at ${slot.time}`}
                                                    >
                                                        <span className="time-slot-time">{slot.time}</span>
                                                        {!slot.available && <span className="time-slot-badge">Booked</span>}
                                                    </button>
                                                ))}
                                            </div>
                                            {slots.length > 0 && slots.every(s => !s.available) && (
                                                <p className="booking-empty">No available slots on this date. Try another day.</p>
                                            )}
                                            {slots.length === 0 && (
                                                <p className="booking-empty">No slots configured for this date.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : step === 3 ? (
                        /* ── Step 4: Client Details ── */
                        <div className="booking-step-content">
                            <h4>Your details</h4>
                            <div className="booking-form">
                                <div className="form-group">
                                    <label><User size={14} /> Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Mail size={14} /> Email</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={clientEmail}
                                        onChange={e => setClientEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Phone size={14} /> Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+94 XX XXX XXXX"
                                        value={clientPhone}
                                        onChange={e => setClientPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Tag size={14} /> Notes (optional)</label>
                                    <textarea
                                        placeholder="Any special requests..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : step === 4 ? (
                        /* ── Step 5: Confirmation Summary ── */
                        <div className="booking-step-content">
                            <h4>Review your booking</h4>
                            <div className="booking-summary">
                                <div className="summary-row">
                                    <span className="summary-label">Business</span>
                                    <span className="summary-value">{venue.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Service</span>
                                    <span className="summary-value">{selectedService?.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Duration</span>
                                    <span className="summary-value">{selectedService?.duration_min} min</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Price</span>
                                    <span className="summary-value highlight">LKR {Number(selectedService?.price).toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Staff</span>
                                    <span className="summary-value">{selectedStaff?.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Date</span>
                                    <span className="summary-value">{selectedDate}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Time</span>
                                    <span className="summary-value">{selectedSlot?.time}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Name</span>
                                    <span className="summary-value">{clientName}</span>
                                </div>
                                {clientEmail && (
                                    <div className="summary-row">
                                        <span className="summary-label">Email</span>
                                        <span className="summary-value">{clientEmail}</span>
                                    </div>
                                )}
                                {clientPhone && (
                                    <div className="summary-row">
                                        <span className="summary-label">Phone</span>
                                        <span className="summary-value">{clientPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ── Success ── */
                        <div className="booking-step-content booking-success">
                            <div className="success-icon">
                                <CheckCircle size={56} />
                            </div>
                            <h3>Booking Confirmed!</h3>
                            <p>Your appointment at <strong>{venue.name}</strong> has been confirmed.</p>
                            <div className="booking-summary compact">
                                <div className="summary-row">
                                    <span className="summary-label">Service</span>
                                    <span className="summary-value">{selectedService?.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">With</span>
                                    <span className="summary-value">{selectedStaff?.name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">When</span>
                                    <span className="summary-value">{selectedDate} at {selectedSlot?.time}</span>
                                </div>
                            </div>
                            <button className="btn-booking-primary" onClick={onClose}>Done</button>
                        </div>
                    )}

                    {error && (
                        <div className="booking-error">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>

                {/* Footer with navigation */}
                {step < 5 && (
                    <div className="booking-footer">
                        {step > 0 && (
                            <button className="btn-booking-back" onClick={prevStep}>
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}
                        <button
                            className="btn-booking-primary"
                            disabled={!canProceed() || loading}
                            onClick={nextStep}
                        >
                            {loading ? (
                                <><Loader2 size={16} className="spin" /> Booking...</>
                            ) : step === 4 ? (
                                'Confirm Booking'
                            ) : (
                                <>Next <ChevronRight size={16} /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
