import React, { useState, useEffect } from 'react';
import { Search, History, Calendar, Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getStatusBadge(status, isDeleted) {
    if (isDeleted) {
        return <span className="mb-status-badge mb-status-cancelled"><Trash2 size={13} /> Deleted</span>;
    }
    switch (status?.toLowerCase()) {
        case 'confirmed':
            return <span className="mb-status-badge mb-status-confirmed"><CheckCircle2 size={13} /> Confirmed</span>;
        case 'completed':
            return <span className="mb-status-badge mb-status-completed"><CheckCircle2 size={13} /> Completed</span>;
        case 'paid':
            return <span className="mb-status-badge mb-status-paid"><CheckCircle2 size={13} /> Paid</span>;
        case 'cancelled':
            return <span className="mb-status-badge mb-status-cancelled"><XCircle size={13} /> Cancelled</span>;
        case 'no_show':
        case 'no-show':
            return <span className="mb-status-badge mb-status-noshow"><AlertCircle size={13} /> No Show</span>;
        default:
            return <span className="mb-status-badge mb-status-pending"><Clock size={13} /> {status || 'Pending'}</span>;
    }
}

export default function BusinessAppointments() {
    const { authFetch } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    async function fetchAppointments() {
        try {
            const res = await authFetch('/api/appointments?include_deleted=true');
            const data = await res.json();
            // Sort by most recently updated or created
            const sorted = (data.appointments || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setAppointments(sorted);
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        } finally {
            setLoading(false);
        }
    }

    async function openLogsModal(appId) {
        setSelectedAppointment(appId);
        setLogsLoading(true);
        setLogs([]);
        try {
            const res = await authFetch(`/api/appointments/${appId}/logs`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLogsLoading(false);
        }
    }

    const filtered = appointments.filter(a => {
        const q = searchQuery.toLowerCase();
        return (a.client_name && a.client_name.toLowerCase().includes(q)) ||
            (a.service_name && a.service_name.toLowerCase().includes(q)) ||
            (a.staff_name && a.staff_name.toLowerCase().includes(q));
    });

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 className="dash-page-title">Appointments Log</h1>
                    <p className="dash-page-subtitle">Complete history of all appointments, including cancelled and deleted records.</p>
                </div>
            </div>

            {/* Search & Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by client, service, or staff..."
                        style={{ width: '100%', padding: '12px 12px 12px 42px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', background: '#FFFFFF' }}
                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                </div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                    {filtered.length} {filtered.length === 1 ? 'record' : 'records'} found
                </div>
            </div>

            {loading ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Loading appointments...</div>
            ) : filtered.length === 0 ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <Calendar size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#334155' }}>No appointment records found</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Your complete booking history will appear here.</p>
                </div>
            ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 100px', padding: '14px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Client</span>
                        <span>Date</span>
                        <span>Time</span>
                        <span>Service</span>
                        <span>Status</span>
                        <span style={{ textAlign: 'right' }}>Log</span>
                    </div>

                    {filtered.map((a) => (
                        <div key={a.id} style={{
                            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 100px', padding: '16px 24px', alignItems: 'center',
                            borderBottom: '1px solid #F1F5F9', background: a.is_deleted ? '#FEF2F2' : 'transparent', transition: 'background 0.15s'
                        }}
                            onMouseEnter={(e) => { if (!a.is_deleted) e.currentTarget.style.background = '#FAFBFC'; }}
                            onMouseLeave={(e) => { if (!a.is_deleted) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={16} color="#94A3B8" />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: a.is_deleted ? '#991B1B' : '#0F172A' }}>{a.client_name || 'Walk-in'}</span>
                            </div>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>{new Date(a.start_time).toLocaleDateString()}</span>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>
                                {new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Scissors size={14} color="#94A3B8" />
                                <span style={{ fontSize: '14px', color: '#334155' }}>{a.service_name || '—'}</span>
                            </div>
                            <div>
                                {getStatusBadge(a.status, a.is_deleted)}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button
                                    onClick={() => openLogsModal(a.id)}
                                    style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <History size={14} /> View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Audit Logs Modal */}
            {selectedAppointment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedAppointment(null)}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #E2E8F0' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <History size={20} color="var(--color-accent-gold)" /> Audit Log
                            </h2>
                            <button onClick={() => setSelectedAppointment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
                            {logsLoading ? (
                                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0' }}>Loading logs...</div>
                            ) : logs.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0' }}>No logs recorded for this appointment.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {logs.map((log, i) => (
                                        <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                            {/* Timeline Line */}
                                            {i !== logs.length - 1 && (
                                                <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '-16px', width: '2px', background: '#E2E8F0' }} />
                                            )}

                                            {/* Timeline Dot */}
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: log.action === 'deleted' ? '#FEE2E2' : '#EFF6FF', color: log.action === 'deleted' ? '#EF4444' : '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                                                {log.action === 'deleted' ? <Trash2 size={12} /> : log.action === 'status_change' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                                                <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{log.action.replace('_', ' ')}</span>
                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                                {log.action === 'status_change' && (
                                                    <div style={{ fontSize: '14px', color: '#0F172A' }}>
                                                        Status updated from <strong style={{ color: '#64748B' }}>{log.previous_status || 'unknown'}</strong> to <strong style={{ color: '#D4AF37' }}>{log.new_status || 'unknown'}</strong>
                                                    </div>
                                                )}
                                                {log.action === 'created' && (
                                                    <div style={{ fontSize: '14px', color: '#0F172A' }}>
                                                        Appointment was created (Status: <strong>{log.new_status}</strong>).
                                                    </div>
                                                )}
                                                {log.action === 'deleted' && (
                                                    <div style={{ fontSize: '14px', color: '#EF4444', fontWeight: 500 }}>
                                                        Appointment was safely deleted.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
