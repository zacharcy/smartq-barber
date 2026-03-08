import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, Check, Megaphone, Image as ImageIcon, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessPromotions() {
    const { token } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
        is_active: true
    });

    // File upload states
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/promotions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch promotions');
            setPromotions(data.promotions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setFormData(prev => ({ ...prev, image_url: data.url }));
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/api/promotions/${editingId}` : '/api/promotions';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save promotion');

            setIsModalOpen(false);
            fetchPromotions();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            const res = await fetch(`/api/promotions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete');
            setPromotions(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRequestSMS = async (id) => {
        try {
            console.log('Requesting promotion for id:', id, 'with token:', token ? 'present' : 'MISSING');
            const res = await fetch(`/api/promotions/${id}/request-sms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            console.log('Promote response:', res.status, data);
            if (!res.ok) throw new Error(data.error || 'Failed to submit request');
            alert('✅ Promotion request submitted for admin approval!');
            fetchPromotions();
        } catch (err) {
            console.error('Promote error:', err);
            alert('Error: ' + err.message);
        }
    };

    const openModal = (promo = null) => {
        if (promo) {
            setEditingId(promo.id);
            setFormData({
                title: promo.title,
                description: promo.description || '',
                image_url: promo.image_url || '',
                start_date: new Date(promo.start_date).toISOString().split('T')[0],
                end_date: new Date(promo.end_date).toISOString().split('T')[0],
                is_active: promo.is_active === 1 || promo.is_active === true
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                description: '',
                image_url: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                is_active: true
            });
        }
        setIsModalOpen(true);
        setError('');
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Megaphone size={28} color="var(--color-accent-gold)" />
                        Promotions
                    </h1>
                    <p style={{ color: '#64748B', margin: 0 }}>Design promotional campaigns to feature on the consumer dashboard.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> New Promotion
                </button>
            </div>

            {error && !isModalOpen && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={32} className="spin" color="var(--color-accent-gold)" />
                </div>
            ) : promotions.length === 0 ? (
                <div style={{ background: '#FFF', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', border: '1px dashed #E2E8F0' }}>
                    <Megaphone size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>No promotions yet</h3>
                    <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' }}>Create an eye-catching promotion to attract more customers on the consumer dashboard.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        Create Promotion
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {promotions.map(promo => {
                        const isActive = promo.is_active && new Date(promo.end_date) >= new Date();
                        return (
                            <div key={promo.id} style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                {/* Image Area */}
                                <div style={{ height: '180px', background: '#F8FAFC', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #E2E8F0' }}>
                                    {promo.image_url ? (
                                        <img src={promo.image_url} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <ImageIcon size={32} />
                                            <span style={{ fontSize: '12px' }}>No Image</span>
                                        </div>
                                    )}
                                    {/* Status Badge */}
                                    {(() => {
                                        const expired = new Date(promo.end_date) < new Date();
                                        let label, bg, color, border;
                                        if (expired) {
                                            label = 'Expired'; bg = '#F1F5F9'; color = '#64748B'; border = '#E2E8F0';
                                        } else if (promo.sms_status === 'hidden') {
                                            label = '🚫 Hidden'; bg = '#FEF2F2'; color = '#B91C1C'; border = '#FECACA';
                                        } else if (promo.sms_status === 'pending') {
                                            label = '⏳ Pending'; bg = '#FEF3C7'; color = '#92400E'; border = '#FDE68A';
                                        } else {
                                            label = '🟢 Active'; bg = '#DCFCE7'; color = '#166534'; border = '#86EFAC';
                                        }
                                        return (
                                            <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: bg, color, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {label}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Content Area */}
                                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>{promo.title}</h3>
                                    <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 16px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {promo.description || 'No description provided.'}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                                            <div>{new Date(promo.start_date).toLocaleDateString()} —</div>
                                            <div style={{ fontWeight: 500, color: new Date(promo.end_date) < new Date() ? '#EF4444' : '#0F172A' }}>
                                                {new Date(promo.end_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {/* Promote / Status */}
                                            {!promo.sms_status ? (
                                                <button
                                                    onClick={() => handleRequestSMS(promo.id)}
                                                    title="Request to promote this on the platform"
                                                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #D4AF37', background: 'linear-gradient(135deg, #FEF9E7, #FFF8E1)', color: '#92700C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                                                >
                                                    <Send size={13} /> Promote
                                                </button>
                                            ) : promo.sms_status === 'pending' ? (
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>⏳ Pending</span>
                                            ) : promo.sms_status === 'hidden' ? (
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>🚫 Hidden by Admin</span>
                                            ) : null}
                                            <button onClick={() => openModal(promo)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(promo.id)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#FFF', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#0F172A' }}>
                                {editingId ? 'Edit Promotion' : 'Create Promotion'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            {error && (
                                <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
                                    <AlertCircle size={16} style={{ marginTop: '2px' }} /> {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                                    placeholder="e.g. Summer Special 20% Off"
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                                    rows="3"
                                    placeholder="Details about the promotion..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Promotion Banner</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    {formData.image_url ? (
                                        <div style={{ position: 'relative', width: '100px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                            <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                            <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {uploading ? <Loader2 size={16} className="spin" /> : <ImageIcon size={16} />}
                                                {uploading ? 'Uploading...' : 'Upload Image'}
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                style={{ position: 'absolute', top: 0, left: 0, opacity: 0, cursor: 'pointer', height: '100%', width: '100%' }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="Or paste an image URL here..."
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>
                                {uploadError && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{uploadError}</p>}
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Recommended size: 1200x600px (2:1 ratio). Displayed prominently in the consumer dashboard.</p>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${formData.is_active ? 'var(--color-accent-gold)' : '#CBD5E1'}`, background: formData.is_active ? 'var(--color-accent-gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {formData.is_active && <Check size={14} color="#FFF" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Active (Visible to customers)</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Save Changes' : 'Create Promotion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
