import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, X, Tag, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessServices() {
    const { authFetch } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', duration_min: 30, price: '', category: 'General' });
    const [saving, setSaving] = useState(false);

    const categories = ['General', 'Hair & Styling', 'Skin Care', 'Nails', 'Massage', 'Makeup', 'Waxing', 'Other'];

    useEffect(() => { fetchServices(); }, []);

    async function fetchServices() {
        try {
            const res = await authFetch('/api/services');
            const data = await res.json();
            setServices(data.services || []);
        } catch (err) {
            console.error('Failed to fetch services:', err);
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingService(null);
        setFormData({ name: '', duration_min: 30, price: '', category: 'General' });
        setShowModal(true);
    }

    function openEditModal(service) {
        setEditingService(service);
        setFormData({
            name: service.name,
            duration_min: service.duration_min,
            price: service.price,
            category: service.category,
        });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
            const method = editingService ? 'PUT' : 'POST';
            await authFetch(url, {
                method,
                body: JSON.stringify({ ...formData, price: parseFloat(formData.price) || 0 }),
            });
            setShowModal(false);
            fetchServices();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await authFetch(`/api/services/${id}`, { method: 'DELETE' });
            fetchServices();
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    function formatDuration(mins) {
        if (mins >= 60) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return m > 0 ? `${h}h ${m}min` : `${h}h`;
        }
        return `${mins}min`;
    }

    // Group services by category
    const grouped = services
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .reduce((acc, s) => {
            const cat = s.category || 'General';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s);
            return acc;
        }, {});

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 className="dash-page-title">Services Catalog</h1>
                    <p className="dash-page-subtitle">Update your service offerings, prices, and durations.</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal} style={{ borderRadius: '8px', padding: '12px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Add Service
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    style={{ width: '100%', padding: '12px 12px 12px 42px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', background: '#FFFFFF', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
            </div>

            {/* Service List */}
            {loading ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8' }}>Loading services...</p>
                </div>
            ) : services.length === 0 ? (
                <div className="dash-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <Tag size={40} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#334155' }}>No services yet</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748B' }}>Add your first service to get started.</p>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '14px' }}>
                        <Plus size={16} /> Add Service
                    </button>
                </div>
            ) : (
                Object.entries(grouped).map(([category, items]) => (
                    <div key={category} style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{category}</h3>
                            <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '99px' }}>{items.length}</span>
                        </div>
                        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {items.map((service, idx) => (
                                <div key={service.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '18px 24px',
                                    borderBottom: idx < items.length - 1 ? '1px solid #F1F5F9' : 'none',
                                    transition: 'background 0.15s',
                                    cursor: 'pointer',
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAFBFC'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '4px', height: '40px', background: '#D4AF37', borderRadius: '4px' }} />
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{service.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {formatDuration(service.duration_min)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>LKR {parseFloat(service.price).toLocaleString()}</span>
                                        <button onClick={() => openEditModal(service)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex', transition: 'all 0.15s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Service Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Haircut" required
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Duration</label>
                                    <select value={formData.duration_min} onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none', background: '#FFF', cursor: 'pointer' }}>
                                        <option value={15}>15 min</option>
                                        <option value={30}>30 min</option>
                                        <option value={45}>45 min</option>
                                        <option value={60}>1 hour</option>
                                        <option value={90}>1h 30min</option>
                                        <option value={120}>2 hours</option>
                                        <option value={150}>2h 30min</option>
                                        <option value={180}>3 hours</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Price (LKR)</label>
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" min="0" step="0.01"
                                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Category</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none', background: '#FFF', cursor: 'pointer' }}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
