import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Users, Mail, Phone, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessClients() {
    const { authFetch } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchClients(); }, []);

    async function fetchClients() {
        try {
            const res = await authFetch('/api/clients');
            const data = await res.json();
            setClients(data.clients || []);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', notes: '' });
        setShowModal(true);
    }

    function openEditModal(client) {
        setEditingClient(client);
        setFormData({ name: client.name, email: client.email || '', phone: client.phone || '', notes: client.notes || '' });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
            const method = editingClient ? 'PUT' : 'POST';
            await authFetch(url, { method, body: JSON.stringify(formData) });
            setShowModal(false);
            fetchClients();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
            fetchClients();
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery))
    );

    function getInitials(name) {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    const avatarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
    function getColor(name) {
        const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return avatarColors[i % avatarColors.length];
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 className="dash-page-title">Client CRM</h1>
                    <p className="dash-page-subtitle">Manage your client base and view their history.</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal} style={{ borderRadius: '8px', padding: '12px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Add Client
                </button>
            </div>

            {/* Search & Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, or phone..."
                        style={{ width: '100%', padding: '12px 12px 12px 42px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', background: '#FFFFFF' }}
                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                </div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                    {clients.length} {clients.length === 1 ? 'client' : 'clients'} total
                </div>
            </div>

            {/* Client List */}
            {loading ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8' }}>Loading clients...</p>
                </div>
            ) : clients.length === 0 ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <Users size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#334155' }}>No clients yet</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748B' }}>Add your first client to start managing your CRM.</p>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '14px' }}>
                        <Plus size={16} /> Add Client
                    </button>
                </div>
            ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 80px', padding: '14px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Phone</span>
                        <span>Added</span>
                        <span style={{ textAlign: 'right' }}>Actions</span>
                    </div>
                    {/* Rows */}
                    {filtered.map((client) => (
                        <div key={client.id} style={{
                            display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 80px', padding: '16px 24px', alignItems: 'center',
                            borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s', cursor: 'pointer',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#FAFBFC'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: getColor(client.name), color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                                    {getInitials(client.name)}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{client.name}</span>
                            </div>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>{client.email || '—'}</span>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>{client.phone || '—'}</span>
                            <span style={{ fontSize: '13px', color: '#94A3B8' }}>{client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}</span>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => openEditModal(client)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                ><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(client.id)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                ><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No clients match your search.</div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <User size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Full Name
                                </label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Jane Doe" required
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                        <Mail size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Email
                                    </label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@email.com"
                                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                        <Phone size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Phone
                                    </label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+94 77 123 4567"
                                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                    <FileText size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Notes
                                </label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferences, allergies, anything to remember..." rows={3}
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                />
                            </div>

                            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
