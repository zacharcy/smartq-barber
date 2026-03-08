import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, Calendar, LogOut, Loader2, Search, Megaphone, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function AdminDashboard() {
    const [companies, setCompanies] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('companies');
    const navigate = useNavigate();

    const adminToken = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    useEffect(() => {
        if (!adminToken) {
            navigate('/admin');
            return;
        }

        fetchCompanies();
        fetchPromotions();
    }, [adminToken, navigate]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/companies', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            if (res.status === 401 || res.status === 403) {
                // Token invalid or expired
                handleLogout();
                return;
            }

            const data = await res.json();
            if (res.ok) {
                setCompanies(data.companies || []);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin');
    };

    const fetchPromotions = async () => {
        try {
            const res = await fetch('/api/admin/promotions', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPromotions(data.promotions || []);
            }
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        }
    };

    const handleTogglePromotion = async (id, isHidden, isApprove = false) => {
        const action = isApprove ? 'restore' : (isHidden ? 'restore' : 'hide');
        try {
            const res = await fetch(`/api/admin/promotions/${id}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (res.ok) {
                fetchPromotions();
            }
        } catch (error) {
            console.error(`${action} error:`, error);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggleLock = async (companyId, currentlyLocked) => {
        const action = currentlyLocked ? 'unlock' : 'lock';
        if (!window.confirm(`Are you sure you want to ${action} this company account?`)) return;
        try {
            const res = await fetch(`/api/admin/companies/${companyId}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (res.ok) {
                fetchCompanies();
            }
        } catch (error) {
            console.error(`${action} error:`, error);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
                <Loader2 size={40} className="spin" color="var(--color-accent-gold)" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {/* Top Navigation */}
            <nav style={{ background: '#0F172A', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={24} color="var(--color-accent-gold)" />
                    <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '0.5px' }}>SmartQ Admin</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '14px', color: '#94A3B8' }}>
                        Logged in as <span style={{ color: '#FFF', fontWeight: 500 }}>{adminUser.username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, transition: 'background 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', color: '#0F172A', marginBottom: '8px' }}>Registered Companies</h1>
                        <p style={{ color: '#64748B', margin: 0 }}>Manage and view all businesses onboarded to the platform.</p>
                    </div>

                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: '#94A3B8' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B' }}>Total Companies</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#0F172A' }}>{companies.length}</h3>
                        </div>
                    </div>
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B' }}>Total Staff Users</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#0F172A' }}>{companies.reduce((acc, curr) => acc + (curr.staff_count || 0), 0)}</h3>
                        </div>
                    </div>
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B' }}>Total Appointments</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#0F172A' }}>{companies.reduce((acc, curr) => acc + (curr.appointment_count || 0), 0)}</h3>
                        </div>
                    </div>
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B' }}>Pending Requests</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#0F172A' }}>{promotions.filter(p => p.sms_status === 'pending').length}</h3>
                        </div>
                    </div>
                </div>

                {/* Tab Toggle */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#F1F5F9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
                    <button
                        onClick={() => setActiveTab('companies')}
                        style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, background: activeTab === 'companies' ? '#FFF' : 'transparent', color: activeTab === 'companies' ? '#0F172A' : '#64748B', boxShadow: activeTab === 'companies' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                    >
                        <Building2 size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Companies
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, background: activeTab === 'requests' ? '#FFF' : 'transparent', color: activeTab === 'requests' ? '#0F172A' : '#64748B', boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', position: 'relative' }}
                    >
                        <Megaphone size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Promotions
                        {promotions.length > 0 && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#D4AF37', color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{promotions.length}</span>
                        )}
                    </button>
                </div>

                {activeTab === 'companies' ? (
                    /* Companies Table */
                    <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company Details</th>
                                        <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category & Location</th>
                                        <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Stats</th>
                                        <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined Date</th>
                                        <th style={{ padding: '16px 24px', width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompanies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                                No companies found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCompanies.map(company => (
                                            <tr key={company.id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: company.is_locked ? '#B91C1C' : '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                {company.name}
                                                                {company.is_locked ? (
                                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontWeight: 600 }}>LOCKED</span>
                                                                ) : null}
                                                            </div>
                                                            <div style={{ fontSize: '13px', color: '#64748B' }}>{company.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'inline-block', padding: '4px 10px', background: '#F1F5F9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                                                        {company.category || 'Uncategorized'}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#64748B' }}>{company.city || 'No city specified'}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Staff Members">
                                                            <Users size={14} /> {company.staff_count || 0}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Total Appointments">
                                                            <Calendar size={14} /> {company.appointment_count || 0}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                                                    {new Date(company.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <button
                                                        onClick={() => handleToggleLock(company.id, company.is_locked)}
                                                        title={company.is_locked ? 'Unlock this account' : 'Lock this account'}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                                                            ...(company.is_locked
                                                                ? { borderColor: '#86EFAC', background: '#DCFCE7', color: '#166534' }
                                                                : { borderColor: '#FECACA', background: '#FEF2F2', color: '#B91C1C' })
                                                        }}
                                                    >
                                                        {company.is_locked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* All Promotions Table */
                    <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        {promotions.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                                <Megaphone size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>No active promotions</h3>
                                <p style={{ maxWidth: '400px', margin: '0 auto' }}>Promotions created by businesses will appear here. You can hide or restore them from the consumer page.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business</th>
                                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promotion</th>
                                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</th>
                                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promotions.map(promo => {
                                            const isHidden = promo.sms_status === 'hidden';
                                            const isPending = promo.sms_status === 'pending';
                                            return (
                                                <tr key={promo.id} style={{ borderBottom: '1px solid #E2E8F0', opacity: isHidden ? 0.6 : 1, background: isPending ? '#FFFBEB' : 'transparent' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{promo.company_name}</div>
                                                        <div style={{ fontSize: '13px', color: '#64748B' }}>{promo.company_city || 'N/A'}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontWeight: 500, color: '#0F172A', marginBottom: '4px' }}>{promo.title}</div>
                                                        <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{promo.description || 'No description'}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>
                                                        {new Date(promo.start_date).toLocaleDateString()} — {new Date(promo.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...(isHidden ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' } : isPending ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' } : { background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }) }}>
                                                            {isHidden ? '🚫 Hidden' : isPending ? '⏳ Pending Request' : '🟢 Visible'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            {isPending && (
                                                                <button
                                                                    onClick={() => handleTogglePromotion(promo.id, false, true)}
                                                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #86EFAC', background: '#DCFCE7', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                                                                >
                                                                    <Eye size={14} /> Approve
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleTogglePromotion(promo.id, isHidden)}
                                                                style={{
                                                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                                                                    ...(isHidden
                                                                        ? { borderColor: '#86EFAC', background: '#DCFCE7', color: '#166534' }
                                                                        : { borderColor: '#FECACA', background: '#FEF2F2', color: '#B91C1C' })
                                                                }}
                                                            >
                                                                {isHidden ? <><Eye size={14} /> Restore</> : <><EyeOff size={14} /> Hide</>}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
