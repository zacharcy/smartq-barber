import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, BarChart2, Clock, User, Scissors } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BusinessHome() {
    const { authFetch, company } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch('/api/dashboard');
                const d = await res.json();
                setData(d);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    // Revenue change percentage
    const revChange = data && data.revenuePrevWeek > 0
        ? Math.round(((data.revenueWeek - data.revenuePrevWeek) / data.revenuePrevWeek) * 100)
        : data?.revenueWeek > 0 ? 100 : 0;
    const revUp = revChange >= 0;

    // Build 7-day chart data
    function buildChartDays() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const match = data?.dailySales?.find(s => s.day?.split?.('T')?.[0] === iso || s.day === iso);
            days.push({ label, total: match ? parseFloat(match.total) : 0, iso });
        }
        return days;
    }

    const chartDays = data ? buildChartDays() : [];
    const maxSale = Math.max(...chartDays.map(d => d.total), 1);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#94A3B8', fontSize: '14px' }}>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="dash-page-title">Dashboard Overview</h1>
                    <p className="dash-page-subtitle">Welcome back! Here's what's happening today.</p>
                </div>
                <button className="btn btn-primary" style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 4px rgba(212,175,55,0.2)' }}
                    onClick={() => navigate('/business/calendar')}>
                    New Appointment
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Revenue Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h3 className="dash-card-title">Recent sales <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>Last 7 days</span></h3>
                        <div style={{ width: 40, height: 40, background: '#F8FAFC', border: '1px solid #F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                            Rs. {(data?.revenueWeek || 0).toLocaleString()}
                        </h2>
                        {revChange !== 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: revUp ? '#10B981' : '#EF4444', fontSize: '14px', fontWeight: 600, background: revUp ? '#D1FAE5' : '#FEE2E2', padding: '4px 8px', borderRadius: '99px', marginBottom: '2px' }}>
                                {revUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(revChange)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h3 className="dash-card-title">Upcoming appointments <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 400, marginLeft: '8px' }}>Next 7 days</span></h3>
                        <div style={{ width: 40, height: 40, background: '#F8FAFC', border: '1px solid #F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                            {data?.upcomingAppointments || 0}
                        </h2>
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#64748B' }}>Across {data?.totalStaff || 0} staff member{data?.totalStaff !== 1 ? 's' : ''}</p>
                </div>

                {/* New Clients */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h3 className="dash-card-title">New Clients</h3>
                        <div style={{ width: 40, height: 40, background: '#F8FAFC', border: '1px solid #F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                            {data?.newClientsWeek || 0}
                        </h2>
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#64748B' }}>Registered this week — {data?.totalClients || 0} total</p>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Sales Activity Chart */}
                <div className="dash-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <div className="dash-card-header" style={{ marginBottom: '16px' }}>
                        <h3 className="dash-card-title">Sales Activity</h3>
                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Last 7 days</span>
                    </div>
                    {chartDays.every(d => d.total === 0) ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2E8F0', borderRadius: '12px', background: '#F8FAFC', padding: '32px' }}>
                            <BarChart2 size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>No sales data yet. Mark appointments as paid or completed.</p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 8px 0' }}>
                            {chartDays.map((d, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
                                        {d.total > 0 ? `${(d.total / 1000).toFixed(1)}k` : ''}
                                    </span>
                                    <div style={{
                                        width: '100%', maxWidth: '48px',
                                        height: `${Math.max((d.total / maxSale) * 220, d.total > 0 ? 20 : 4)}px`,
                                        background: d.total > 0
                                            ? 'linear-gradient(180deg, #D4AF37 0%, #B8962E 100%)'
                                            : '#F1F5F9',
                                        borderRadius: '6px 6px 0 0',
                                        transition: 'height 0.5s ease',
                                    }} />
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{d.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Today's Schedule */}
                <div className="dash-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    <div className="dash-card-header" style={{ marginBottom: '16px' }}>
                        <h3 className="dash-card-title">Today's Schedule</h3>
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{data?.todayAppointments || 0} appt{data?.todayAppointments !== 1 ? 's' : ''}</span>
                    </div>

                    {!data?.todaySchedule?.length ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2E8F0', borderRadius: '12px', background: '#F8FAFC', padding: '32px', textAlign: 'center' }}>
                            <Clock size={32} color="#CBD5E1" style={{ marginBottom: '12px' }} />
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#334155' }}>Your schedule is empty</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>No appointments for today.</p>
                            <button onClick={() => navigate('/business/calendar')}
                                style={{ marginTop: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', color: '#0F172A', cursor: 'pointer', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                Add Booking
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {data.todaySchedule.map(appt => {
                                const start = new Date(appt.start_time);
                                const end = new Date(appt.end_time);
                                const timeStr = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} — ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                                const statusColors = { confirmed: '#16A34A', completed: '#3B82F6', paid: '#8B5CF6', cancelled: '#DC2626' };
                                const statusColor = statusColors[appt.status] || '#6B7280';
                                return (
                                    <div key={appt.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: '#FAFBFC', borderRadius: '10px', borderLeft: `3px solid ${statusColor}`,
                                        transition: 'background 0.15s', cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#FAFBFC'}
                                        onClick={() => navigate('/business/calendar')}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Scissors size={12} color={statusColor} />
                                                {appt.service_name || 'Appointment'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={11} /> {timeStr}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '12px' }}>
                                            {appt.client_name && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                                    <User size={11} /> {appt.client_name}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{appt.status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
