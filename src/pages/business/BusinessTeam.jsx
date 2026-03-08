import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, Palette, User, Mail, Shield, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STAFF_COLORS = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#06B6D4',
];

export default function BusinessTeam() {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState('members');

    // Staff state
    const [staff, setStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'Staff', color: '#8B5CF6' });
    const [savingStaff, setSavingStaff] = useState(false);

    // Roles state
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [newRoleName, setNewRoleName] = useState('');
    const [savingRole, setSavingRole] = useState(false);
    const [roleError, setRoleError] = useState('');

    useEffect(() => { fetchStaff(); fetchRoles(); }, []);

    // ===== Staff CRUD =====
    async function fetchStaff() {
        try {
            const res = await authFetch('/api/staff');
            const data = await res.json();
            setStaff(data.staff || []);
        } catch (err) { console.error(err); }
        finally { setLoadingStaff(false); }
    }

    function openAddStaff() {
        setEditingStaff(null);
        setStaffForm({ name: '', email: '', role: 'Staff', color: STAFF_COLORS[staff.length % STAFF_COLORS.length] });
        setShowStaffModal(true);
    }

    function openEditStaff(s) {
        setEditingStaff(s);
        setStaffForm({ name: s.name, email: s.email || '', role: s.role || 'Staff', color: s.color || '#8B5CF6' });
        setShowStaffModal(true);
    }

    async function handleStaffSubmit(e) {
        e.preventDefault();
        setSavingStaff(true);
        try {
            const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff';
            const method = editingStaff ? 'PUT' : 'POST';
            await authFetch(url, { method, body: JSON.stringify(staffForm) });
            setShowStaffModal(false);
            fetchStaff();
        } catch (err) { console.error(err); }
        finally { setSavingStaff(false); }
    }

    async function handleDeleteStaff(id) {
        if (!confirm('Remove this team member?')) return;
        try { await authFetch(`/api/staff/${id}`, { method: 'DELETE' }); fetchStaff(); } catch (err) { console.error(err); }
    }

    // ===== Roles CRUD =====
    async function fetchRoles() {
        try {
            const res = await authFetch('/api/roles');
            const data = await res.json();
            setRoles(data.roles || []);
        } catch (err) { console.error(err); }
        finally { setLoadingRoles(false); }
    }

    async function handleAddRole(e) {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        setSavingRole(true);
        setRoleError('');
        try {
            const res = await authFetch('/api/roles', { method: 'POST', body: JSON.stringify({ name: newRoleName.trim() }) });
            if (!res.ok) {
                const data = await res.json();
                setRoleError(data.error || 'Failed to add role');
                return;
            }
            setNewRoleName('');
            fetchRoles();
        } catch (err) { console.error(err); setRoleError('Failed to add role'); }
        finally { setSavingRole(false); }
    }

    async function handleDeleteRole(id, name) {
        if (name === 'Owner' || name === 'Staff') {
            alert('Cannot delete default roles.');
            return;
        }
        if (!confirm(`Delete role "${name}"?`)) return;
        try { await authFetch(`/api/roles/${id}`, { method: 'DELETE' }); fetchRoles(); } catch (err) { console.error(err); }
    }

    function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

    const tabs = [
        { id: 'members', label: 'Members', icon: Users },
        { id: 'roles', label: 'Roles', icon: Shield },
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '28px' }}>
                <h1 className="dash-page-title">Team</h1>
                <p className="dash-page-subtitle">Manage your team members and define custom roles.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid #E2E8F0' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px',
                            fontWeight: active ? 600 : 500, color: active ? '#0F172A' : '#64748B',
                            background: 'none', border: 'none', borderBottom: active ? '2px solid #D4AF37' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px',
                        }}>
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ========== MEMBERS TAB ========== */}
            {activeTab === 'members' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Team Members</h2>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>{staff.length} member{staff.length !== 1 ? 's' : ''} — each appears as a column in the calendar</p>
                        </div>
                        <button className="btn btn-primary" onClick={openAddStaff} style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <Plus size={16} /> Add Team Member
                        </button>
                    </div>

                    {loadingStaff ? (
                        <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: '#94A3B8' }}>Loading team...</p></div>
                    ) : staff.length === 0 ? (
                        <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                            <Users size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>No team members</h3>
                            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B' }}>Add your first team member to see them on the calendar.</p>
                            <button className="btn btn-primary" onClick={openAddStaff} style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '14px' }}><Plus size={16} /> Add Team Member</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                            {staff.map(s => (
                                <div key={s.id} className="dash-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: s.color || '#8B5CF6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>{getInitials(s.name)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{s.name}</div>
                                        <div style={{ fontSize: '13px', color: '#64748B' }}>{s.role || 'Staff'}</div>
                                        {s.email && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => openEditStaff(s)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                        ><Edit2 size={15} /></button>
                                        <button onClick={() => handleDeleteStaff(s.id)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                        ><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ========== ROLES TAB ========== */}
            {activeTab === 'roles' && (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Custom Roles</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>Define roles for your team members. "Owner" and "Staff" are defaults.</p>
                    </div>

                    {/* Add Role */}
                    <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '480px' }}>
                        <input type="text" value={newRoleName} onChange={(e) => { setNewRoleName(e.target.value); setRoleError(''); }} placeholder="e.g. Senior Stylist, Barber, Color Specialist..."
                            style={{ flex: 1, padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                            onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <button type="submit" disabled={savingRole || !newRoleName.trim()} className="btn btn-primary" style={{ borderRadius: '8px', padding: '12px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', opacity: savingRole || !newRoleName.trim() ? 0.6 : 1 }}>
                            <Plus size={16} /> Add Role
                        </button>
                    </form>
                    {roleError && <p style={{ color: '#EF4444', fontSize: '13px', margin: '-16px 0 16px' }}>{roleError}</p>}

                    {/* Role List */}
                    {loadingRoles ? (
                        <div className="dash-card" style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: '#94A3B8' }}>Loading roles...</p></div>
                    ) : (
                        <div className="dash-card" style={{ padding: 0, overflow: 'hidden', maxWidth: '480px' }}>
                            {roles.map((role, idx) => {
                                const isDefault = role.name === 'Owner' || role.name === 'Staff';
                                return (
                                    <div key={role.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 20px', borderBottom: idx < roles.length - 1 ? '1px solid #F1F5F9' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: isDefault ? '#FEF3C7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isDefault ? <Shield size={16} color="#D97706" /> : <Tag size={16} color="#64748B" />}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{role.name}</span>
                                                {isDefault && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>Default</span>}
                                            </div>
                                        </div>
                                        {!isDefault && (
                                            <button onClick={() => handleDeleteRole(role.id, role.name)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                            ><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                );
                            })}
                            {roles.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No roles yet. Add your first role above.</div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ===== STAFF MODAL ===== */}
            {showStaffModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowStaffModal(false)}>
                    <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{editingStaff ? 'Edit Team Member' : 'Add Team Member'}</h2>
                            <button onClick={() => setShowStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleStaffSubmit} style={{ padding: '24px 28px 28px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <User size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Full Name
                                </label>
                                <input type="text" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="e.g. Sarah Johnson" required
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <Mail size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Email (optional)
                                </label>
                                <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="sarah@salon.com"
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <Shield size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Role
                                </label>
                                <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none', background: '#FFF', cursor: 'pointer' }}>
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    {roles.length === 0 && <><option value="Owner">Owner</option><option value="Staff">Staff</option></>}
                                </select>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <Palette size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Calendar Color
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {STAFF_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setStaffForm({ ...staffForm, color: c })} style={{
                                            width: 36, height: 36, borderRadius: '50%', background: c, border: staffForm.color === c ? '3px solid #0F172A' : '3px solid transparent',
                                            cursor: 'pointer', transition: 'transform 0.15s, border 0.15s', transform: staffForm.color === c ? 'scale(1.15)' : 'scale(1)',
                                        }} />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={savingStaff} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px', fontWeight: 600, opacity: savingStaff ? 0.7 : 1 }}>
                                {savingStaff ? 'Saving...' : (editingStaff ? 'Update Member' : 'Add Member')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
