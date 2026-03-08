import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, RotateCw, ChevronDown, Plus, Users, SlidersHorizontal, CalendarPlus, CalendarOff, X, Search, Clock, User, Footprints, Tag, Globe, CheckCircle2, CreditCard, Ban, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessCalendar() {
    const { authFetch, company } = useAuth();
    const hours = Array.from({ length: 13 }, (_, i) => i + 7);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddMenu, setShowAddMenu] = useState(false);
    const popupRef = useRef(null);

    const [appointments, setAppointments] = useState([]);
    const [staff, setStaff] = useState([]);
    const [services, setServices] = useState([]);
    const [clients, setClients] = useState([]);

    // Booking modal
    const [showBooking, setShowBooking] = useState(false);
    const [bookingStep, setBookingStep] = useState('service');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [serviceSearch, setServiceSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [showNewClient, setShowNewClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '' });

    // Appointment detail modal
    const [detailAppt, setDetailAppt] = useState(null);
    const [statusLoading, setStatusLoading] = useState('');

    // Current time
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

    useEffect(() => { fetchAll(); }, [currentDate]);

    async function fetchAll() {
        const dateStr = formatDateISO(currentDate);
        try {
            const [a, s, sv, c] = await Promise.all([
                authFetch(`/api/appointments?date=${dateStr}`),
                authFetch('/api/staff'),
                authFetch('/api/services'),
                authFetch('/api/clients'),
            ]);
            const [ad, sd, svd, cd] = await Promise.all([a.json(), s.json(), sv.json(), c.json()]);
            setAppointments(ad.appointments || []);
            setStaff(sd.staff || []);
            setServices(svd.services || []);
            setClients(cd.clients || []);
        } catch (err) { console.error('Fetch error:', err); }
    }

    useEffect(() => {
        const handler = (e) => { if (popupRef.current && !popupRef.current.contains(e.target)) setShowAddMenu(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handlePrevDay = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
    const handleNextDay = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    const handleToday = () => setCurrentDate(new Date());
    const formatDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    function formatDateISO(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    function formatDuration(m) { return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ''}` : `${m}min`; }

    // Use staff list or fallback to single column
    const displayStaff = staff.length > 0 ? staff : [{ id: null, name: company?.name || 'Staff', color: '#D4AF37' }];

    function handleSlotClick(hour, halfHour, staffMember) {
        setSelectedTimeSlot({ hour, mins: halfHour ? 30 : 0 });
        setSelectedService(null);
        setSelectedClient(null);
        setSelectedStaff(staffMember);
        setBookingStep('service');
        setServiceSearch('');
        setClientSearch('');
        setShowNewClient(false);
        setShowBooking(true);
    }

    function handleAddAppointment() {
        setShowAddMenu(false);
        const h = new Date().getHours() + 1;
        handleSlotClick(h < 7 ? 9 : h > 19 ? 9 : h, false, displayStaff[0]);
    }

    function handleSelectService(svc) { setSelectedService(svc); setBookingStep('client'); }
    function handleSelectClient(cl) { setSelectedClient(cl); setBookingStep('confirm'); }
    function handleWalkIn() { setSelectedClient({ id: null, name: 'Walk-In' }); setBookingStep('confirm'); }

    async function handleCreateClient(e) {
        e.preventDefault();
        try {
            const res = await authFetch('/api/clients', { method: 'POST', body: JSON.stringify(newClientData) });
            const data = await res.json();
            setClients(prev => [...prev, data.client]);
            setSelectedClient(data.client);
            setBookingStep('confirm');
            setShowNewClient(false);
        } catch (err) { console.error(err); }
    }

    async function handleSaveAppointment() {
        if (!selectedService || !selectedTimeSlot) return;
        setSaving(true);
        try {
            const d = formatDateISO(currentDate);
            const sH = String(selectedTimeSlot.hour).padStart(2, '0');
            const sM = String(selectedTimeSlot.mins).padStart(2, '0');
            const eMin = selectedTimeSlot.hour * 60 + selectedTimeSlot.mins + (selectedService.duration_min || 30);
            const eH = String(Math.floor(eMin / 60)).padStart(2, '0');
            const eM = String(eMin % 60).padStart(2, '0');
            await authFetch('/api/appointments', {
                method: 'POST',
                body: JSON.stringify({
                    client_id: selectedClient?.id || null,
                    staff_id: selectedStaff?.id || null,
                    service_id: selectedService.id,
                    start_time: `${d} ${sH}:${sM}:00`,
                    end_time: `${d} ${eH}:${eM}:00`,
                    status: 'confirmed',
                }),
            });
            setShowBooking(false);
            fetchAll();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    async function handleDeleteAppointment(id) {
        if (!window.confirm('Delete this appointment?')) return;
        try { await authFetch(`/api/appointments/${id}`, { method: 'DELETE' }); setDetailAppt(null); fetchAll(); } catch (err) { console.error(err); }
    }

    async function handleStatusUpdate(id, newStatus) {
        setStatusLoading(newStatus);
        try {
            await authFetch(`/api/appointments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            setDetailAppt(prev => prev ? { ...prev, status: newStatus } : null);
            fetchAll();
        } catch (err) {
            console.error(err);
            alert('Failed to update appointment: ' + err.message);
        }
        finally { setStatusLoading(''); }
    }

    function getApptStyle(appt) {
        const s = new Date(appt.start_time), e = new Date(appt.end_time);
        const topMins = (s.getHours() - 7) * 60 + s.getMinutes();
        const durMins = (e - s) / 60000;
        return { top: `${topMins}px`, height: `${Math.max(durMins, 25)}px` };
    }

    // Calculate overlapping appointment layout (columns within a staff lane)
    function layoutAppointments(appts) {
        if (!appts.length) return [];
        const sorted = [...appts].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const laid = sorted.map(appt => {
            const s = new Date(appt.start_time).getTime();
            const e = new Date(appt.end_time).getTime();
            return { ...appt, _start: s, _end: e, _col: 0, _totalCols: 1 };
        });

        // Assign columns using a greedy algorithm
        const groups = []; // groups of overlapping appointments
        let currentGroup = [laid[0]];

        for (let i = 1; i < laid.length; i++) {
            const groupEnd = Math.max(...currentGroup.map(a => a._end));
            if (laid[i]._start < groupEnd) {
                currentGroup.push(laid[i]);
            } else {
                groups.push(currentGroup);
                currentGroup = [laid[i]];
            }
        }
        groups.push(currentGroup);

        for (const group of groups) {
            const columns = [];
            for (const appt of group) {
                let placed = false;
                for (let c = 0; c < columns.length; c++) {
                    const lastInCol = columns[c][columns[c].length - 1];
                    if (appt._start >= lastInCol._end) {
                        columns[c].push(appt);
                        appt._col = c;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    appt._col = columns.length;
                    columns.push([appt]);
                }
            }
            const totalCols = columns.length;
            for (const appt of group) {
                appt._totalCols = totalCols;
            }
        }

        return laid;
    }

    const isToday = currentDate.toDateString() === new Date().toDateString();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    function getTimeTop() { return `${(now.getHours() - 7) * 60 + now.getMinutes()}px`; }

    const groupedServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
        .reduce((a, s) => { const c = s.category || 'General'; if (!a[c]) a[c] = []; a[c].push(s); return a; }, {});

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())));

    const avatarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
    function getColor(n) { const i = n.split('').reduce((a, c) => a + c.charCodeAt(0), 0); return avatarColors[i % avatarColors.length]; }
    function getInitials(n) { return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

    // Appointments grouped by staff
    function getStaffAppointments(staffId) {
        return appointments.filter(a => {
            if (staffId === null) return true; // fallback single column
            return a.staff_id === staffId;
        });
    }

    return (
        <div className="adv-calendar animate-fade-in">
            {/* Toolbar */}
            <div className="adv-toolbar">
                <div className="adv-toolbar-left">
                    <button className="adv-btn" onClick={handleToday}>Today</button>
                    <div className="adv-date-nav">
                        <button className="adv-icon-btn" onClick={handlePrevDay}><ChevronLeft size={16} /></button>
                        <span className="adv-current-date">{formatDate(currentDate)}</span>
                        <button className="adv-icon-btn" onClick={handleNextDay}><ChevronRight size={16} /></button>
                    </div>
                    <button className="adv-btn with-icon">Scheduled team <ChevronDown size={14} /></button>
                    <button className="adv-icon-btn border"><SlidersHorizontal size={14} /></button>
                </div>
                <div className="adv-toolbar-right">
                    <button className="adv-icon-btn"><Settings size={16} /></button>
                    <button className="adv-icon-btn border"><CalendarIcon size={16} /></button>
                    <button className="adv-icon-btn"><RotateCw size={16} /></button>
                    <div className="adv-divider"></div>
                    <button className="adv-btn with-icon border-none">Day <ChevronDown size={14} /></button>
                    <div style={{ position: 'relative' }} ref={popupRef}>
                        <button className="adv-btn-dark" onClick={() => setShowAddMenu(!showAddMenu)}>
                            Add <ChevronDown size={14} style={{ transform: showAddMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {showAddMenu && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', width: '220px', zIndex: 100, padding: '8px 0' }}>
                                <button className="adv-dropdown-item" onClick={handleAddAppointment}><CalendarPlus size={16} color="#64748B" /> Appointment</button>
                                <button className="adv-dropdown-item"><CalendarOff size={16} color="#64748B" /> Blocked time</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Staff Column Headers */}
            <div className="adv-resources">
                <div className="adv-time-col-header"></div>
                <div className="adv-resource-columns" style={{ display: 'grid', gridTemplateColumns: `repeat(${displayStaff.length}, 1fr)` }}>
                    {displayStaff.map(s => (
                        <div key={s.id || 'default'} className="adv-resource-header">
                            <div className="adv-avatar" style={{ background: s.color || '#D4AF37', color: '#FFF' }}>{getInitials(s.name)}</div>
                            <div className="adv-name">{s.name} <ChevronDown size={12} color="#94A3B8" /></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="adv-grid-container">
                <div className="adv-time-axis">
                    {hours.map(h => <div key={h} className="adv-time-slot"><span>{h}:00</span></div>)}
                </div>
                <div className="adv-grid-content">
                    <div className="adv-grid-lines">
                        {hours.map(h => <div key={h} className="adv-hour-block"><div className="adv-half-line"></div></div>)}
                    </div>

                    {isToday && (
                        <div className="adv-time-indicator" style={{ top: getTimeTop() }}>
                            <div className="adv-time-badge">{timeStr}</div>
                            <div className="adv-time-line"></div>
                        </div>
                    )}

                    {/* Multi-staff columns */}
                    <div className="adv-staff-columns" style={{ display: 'grid', gridTemplateColumns: `repeat(${displayStaff.length}, 1fr)` }}>
                        {displayStaff.map(staffMember => (
                            <div key={staffMember.id || 'default'} className="adv-staff-col" style={{ position: 'relative', borderRight: displayStaff.length > 1 ? '1px solid #F1F5F9' : 'none' }}>
                                {/* Clickable slots */}
                                {hours.map(h => (
                                    <React.Fragment key={h}>
                                        <div style={{ position: 'absolute', top: `${(h - 7) * 60}px`, left: 0, right: 0, height: '30px', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => handleSlotClick(h, false, staffMember)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = `${staffMember.color || '#D4AF37'}12`}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} />
                                        <div style={{ position: 'absolute', top: `${(h - 7) * 60 + 30}px`, left: 0, right: 0, height: '30px', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => handleSlotClick(h, true, staffMember)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = `${staffMember.color || '#D4AF37'}12`}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} />
                                    </React.Fragment>
                                ))}

                                {/* Appointment blocks for this staff member */}
                                {layoutAppointments(getStaffAppointments(staffMember.id)).map(appt => {
                                    const st = getApptStyle(appt);
                                    const isWebsite = appt.source === 'website';
                                    const color = isWebsite ? '#6366F1' : (staffMember.color || '#D4AF37');
                                    const widthPct = 100 / appt._totalCols;
                                    const leftPct = appt._col * widthPct;
                                    return (
                                        <div key={appt.id} className={`adv-appt${isWebsite ? ' adv-appt-website' : ''}`} style={{
                                            ...st, zIndex: 5 + appt._col,
                                            left: `${leftPct}%`,
                                            width: `${widthPct}%`,
                                            background: isWebsite ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : `${color}18`,
                                            borderLeft: `3px solid ${color}`,
                                            borderRight: isWebsite ? '1px dashed #A5B4FC' : 'none',
                                        }} onClick={(e) => { e.stopPropagation(); setDetailAppt(appt); }}>
                                            {isWebsite && (
                                                <div className="adv-appt-badge">
                                                    <Globe size={10} /> Online
                                                </div>
                                            )}
                                            <div className="adv-appt-time" style={{ color: color }}>
                                                {new Date(appt.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {new Date(appt.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                {appt.client_name ? ` ${appt.client_name}` : ''}
                                            </div>
                                            <div className="adv-appt-service">{appt.service_name || 'Appointment'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== BOOKING MODAL ===== */}
            {showBooking && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', zIndex: 1000 }} onClick={() => setShowBooking(false)}>
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '720px', background: '#FFF', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', overflow: 'hidden', animation: 'slideInRight 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>

                        {/* Left Panel */}
                        <div style={{ width: '280px', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', background: '#FAFBFC', flexShrink: 0, overflowY: 'auto' }}>
                            <div style={{ padding: '16px' }}>
                                <button onClick={() => setShowBooking(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}><X size={16} /></button>
                            </div>

                            {/* Staff selector */}
                            <div style={{ padding: '0 20px 16px' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned to</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {displayStaff.map(s => (
                                        <div key={s.id || 'def'} onClick={() => setSelectedStaff(s)} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                            background: selectedStaff?.id === s.id ? '#F1F5F9' : 'transparent',
                                            border: selectedStaff?.id === s.id ? `2px solid ${s.color || '#D4AF37'}` : '2px solid transparent',
                                            transition: 'all 0.15s',
                                        }}
                                            onMouseEnter={(e) => { if (selectedStaff?.id !== s.id) e.currentTarget.style.background = '#F8FAFC'; }}
                                            onMouseLeave={(e) => { if (selectedStaff?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.color || '#D4AF37', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{getInitials(s.name)}</div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.name}</div>
                                                {s.role && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{s.role}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #E2E8F0', margin: '0 20px' }} />

                            {/* Client step or summary */}
                            {bookingStep === 'service' ? (
                                <div style={{ padding: '16px 20px' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><User size={20} color="#8B5CF6" /></div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Add client</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Select a service first</p>
                                </div>
                            ) : bookingStep === 'client' ? (
                                <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700 }}>Select a client</h3>
                                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                        <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search..."
                                            style={{ width: '100%', padding: '9px 9px 9px 32px', fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                            onFocus={(e) => e.target.style.borderColor = '#8B5CF6'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                                    </div>

                                    <div onClick={() => setShowNewClient(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} color="#8B5CF6" /></div>
                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Add new client</span>
                                    </div>

                                    <div onClick={handleWalkIn} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Footprints size={16} color="#3B82F6" /></div>
                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Walk-In</span>
                                    </div>

                                    {filteredClients.map(c => (
                                        <div key={c.id} onClick={() => handleSelectClient(c)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: getColor(c.name), color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{getInitials(c.name)}</div>
                                            <div><div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>{c.email && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.email}</div>}</div>
                                        </div>
                                    ))}

                                    {showNewClient && (
                                        <form onSubmit={handleCreateClient} style={{ padding: '10px', background: '#F1F5F9', borderRadius: '8px', marginTop: '8px' }}>
                                            <input type="text" value={newClientData.name} onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })} placeholder="Name" required
                                                style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', marginBottom: '6px', outline: 'none' }} />
                                            <input type="email" value={newClientData.email} onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })} placeholder="Email"
                                                style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', marginBottom: '6px', outline: 'none' }} />
                                            <input type="tel" value={newClientData.phone} onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })} placeholder="Phone"
                                                style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', marginBottom: '6px', outline: 'none' }} />
                                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px' }}>Add & Select</button>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '16px 20px', flex: 1 }}>
                                    <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Summary</h4>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Client</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F1F5F9', borderRadius: '8px' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: selectedClient?.name ? getColor(selectedClient.name) : '#94A3B8', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{selectedClient?.name ? getInitials(selectedClient.name) : 'W'}</div>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedClient?.name || 'Walk-In'}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Time</div>
                                        <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                                            {formatDate(currentDate)}, {String(selectedTimeSlot?.hour).padStart(2, '0')}:{String(selectedTimeSlot?.mins).padStart(2, '0')}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Service</div>
                                        <div style={{ padding: '8px 10px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                                            {selectedService?.name} — LKR {parseFloat(selectedService?.price || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Staff</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F1F5F9', borderRadius: '8px' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: selectedStaff?.color || '#D4AF37', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>{selectedStaff ? getInitials(selectedStaff.name) : '?'}</div>
                                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedStaff?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>

                                    <button onClick={handleSaveAppointment} disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px', fontWeight: 600 }}>
                                        {saving ? 'Saving...' : 'Confirm Booking'}
                                    </button>
                                    <button onClick={() => setBookingStep('service')} style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer', marginTop: '8px', color: '#64748B', fontWeight: 500 }}>
                                        Change Selection
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Service Selection */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            <div style={{ padding: '24px 28px' }}>
                                <h2 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 700 }}>Select a service</h2>
                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                    <input type="text" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search by service name"
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none' }}
                                        onFocus={(e) => e.target.style.borderColor = '#8B5CF6'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                                </div>

                                {services.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                                        <Tag size={32} color="#CBD5E1" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, fontSize: '14px' }}>No services yet. Add from the Services page.</p>
                                    </div>
                                ) : Object.entries(groupedServices).map(([cat, items]) => (
                                    <div key={cat} style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{cat}</h4>
                                            <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px' }}>{items.length}</span>
                                        </div>
                                        {items.map(svc => (
                                            <div key={svc.id} onClick={() => handleSelectService(svc)} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', borderRadius: '10px',
                                                border: selectedService?.id === svc.id ? '2px solid #8B5CF6' : '1px solid transparent',
                                                background: selectedService?.id === svc.id ? '#F5F3FF' : 'transparent', transition: 'all 0.15s', marginBottom: '4px',
                                            }}
                                                onMouseEnter={(e) => { if (selectedService?.id !== svc.id) e.currentTarget.style.background = '#F8FAFC'; }}
                                                onMouseLeave={(e) => { if (selectedService?.id !== svc.id) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: 3, height: 36, background: '#8B5CF6', borderRadius: 4, opacity: 0.5 }} />
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{svc.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: 2 }}>{formatDuration(svc.duration_min)}</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>LKR {parseFloat(svc.price).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== APPOINTMENT DETAIL MODAL ===== */}
            {detailAppt && (() => {
                const a = detailAppt;
                const st = a.status?.toLowerCase();
                const isCancelled = st === 'cancelled';
                const isCompleted = st === 'completed';
                const isPaid = st === 'paid';
                const staffMem = displayStaff.find(s => s.id === a.staff_id);
                const svcObj = services.find(s => s.id === a.service_id);
                const statusColors = { confirmed: '#16A34A', completed: '#3B82F6', paid: '#8B5CF6', cancelled: '#DC2626' };
                const statusColor = statusColors[st] || '#6B7280';
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '24px' }} onClick={() => setDetailAppt(null)}>
                        <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Appointment Details</h2>
                                <button onClick={() => setDetailAppt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}><X size={20} /></button>
                            </div>

                            {/* Status */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: 600, background: `${statusColor}14`, color: statusColor }}>
                                    <CheckCircle2 size={14} /> {a.status || 'Pending'}
                                </span>
                            </div>

                            {/* Details */}
                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                                    <Tag size={18} color="#D4AF37" />
                                    <div>
                                        <strong style={{ display: 'block' }}>{a.service_name || svcObj?.name || 'Appointment'}</strong>
                                        {svcObj?.duration_min && <span style={{ fontSize: '13px', color: '#94A3B8' }}>{svcObj.duration_min} minutes</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748B' }}>
                                    <CalendarIcon size={16} color="#D4AF37" />
                                    <span>{new Date(a.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748B' }}>
                                    <Clock size={16} color="#D4AF37" />
                                    <span>{new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} — {new Date(a.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                </div>
                                {a.client_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748B' }}>
                                        <User size={16} color="#D4AF37" /> <span>{a.client_name}</span>
                                    </div>
                                )}
                                {(a.staff_name || staffMem?.name) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#64748B' }}>
                                        <Users size={16} color="#D4AF37" /> <span>{a.staff_name || staffMem?.name}</span>
                                    </div>
                                )}
                                {svcObj?.price && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed #E2E8F0', marginTop: '4px', fontSize: '14px', color: '#64748B' }}>
                                        <span>Total</span>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>LKR {parseFloat(svcObj.price).toLocaleString()}</span>
                                    </div>
                                )}
                                {a.notes && (
                                    <div style={{ fontSize: '13px', color: '#94A3B8', background: '#FAFAF9', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <strong style={{ color: '#0F172A' }}>Notes:</strong> {a.notes}
                                    </div>
                                )}
                                {a.source && a.source !== 'manual' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8' }}>
                                        <Globe size={13} /> Booked via {a.source === 'ai_chat' ? 'AI Chat' : a.source}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 24px 24px' }}>
                                {!isCompleted && !isCancelled && (
                                    <button onClick={() => handleStatusUpdate(a.id, 'completed')} disabled={!!statusLoading}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '12px', background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                                        {statusLoading === 'completed' ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />} Mark Complete
                                    </button>
                                )}
                                {!isPaid && !isCancelled && !isCompleted && (
                                    <button onClick={() => handleStatusUpdate(a.id, 'paid')} disabled={!!statusLoading}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                                        {statusLoading === 'paid' ? <Loader2 size={16} className="spin" /> : <CreditCard size={16} />} Mark as Paid
                                    </button>
                                )}
                                {!isCompleted && !isPaid && !isCancelled && (
                                    <button onClick={() => handleStatusUpdate(a.id, 'cancelled')} disabled={!!statusLoading}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '12px', background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                                        {statusLoading === 'cancelled' ? <Loader2 size={16} className="spin" /> : <Ban size={16} />} Cancel Appointment
                                    </button>
                                )}
                                <button onClick={() => handleDeleteAppointment(a.id)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', border: 'none', borderRadius: '12px', background: 'transparent', color: '#94A3B8', fontWeight: 500, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
                                    <Trash2 size={14} /> Delete Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}
