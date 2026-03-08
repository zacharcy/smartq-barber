import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Camera, Building2, MapPin, Phone, FileText, Tag, Image as ImageIcon, Hash, Link2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    'Hair Salon', 'Barbershop', 'Nail Salon', 'Spa & Wellness',
    'Beauty Salon', 'Skin Care Clinic', 'Massage Therapy',
    'Tattoo & Piercing', 'Eyebrows & Lashes', 'Makeup Studio',
    'Tanning Studio', 'Medical Spa', 'Fitness & Gym', 'Other',
];

export default function BusinessSettings() {
    const { authFetch, company, setCompany } = useAuth();
    const fileRef = useRef(null);
    const [form, setForm] = useState({
        name: '', phone: '', category: '', address: '',
        city: '', country: '', description: '', image_url: '', keywords: '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'url'

    useEffect(() => {
        if (company) {
            setForm({
                name: company.name || '',
                phone: company.phone || '',
                category: company.category || '',
                address: company.address || '',
                city: company.city || '',
                country: company.country || '',
                description: company.description || '',
                image_url: company.image_url || '',
                keywords: company.keywords || '',
            });
        }
    }, [company]);

    function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setSaved(false); }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadFile(file);
    }

    async function uploadFile(file) {
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (JPEG, PNG, WebP, or GIF).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be smaller than 5 MB.');
            return;
        }
        setUploading(true);
        setUploadError('');
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (data.url) {
                update('image_url', data.url);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) uploadFile(file);
    }

    function handleDragOver(e) {
        e.preventDefault();
        setDragActive(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        setDragActive(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authFetch('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.company && setCompany) setCompany(data.company);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    const inputStyle = {
        width: '100%', padding: '12px 14px', fontSize: '14px',
        border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
    };
    const labelStyle = {
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
        fontSize: '13px', fontWeight: 600, color: '#334155',
    };

    function focusH(e) { e.target.style.borderColor = '#D4AF37'; }
    function blurH(e) { e.target.style.borderColor = '#E2E8F0'; }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '28px' }}>
                <h1 className="dash-page-title">Settings</h1>
                <p className="dash-page-subtitle">Configure your salon profile — these details appear on your public listing.</p>
            </div>

            <form onSubmit={handleSave} style={{ maxWidth: '720px' }}>
                {/* Cover Image */}
                <div className="dash-card" style={{ padding: '24px', marginBottom: '20px' }}>
                    <label style={labelStyle}><Camera size={14} /> Cover Image</label>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94A3B8' }}>This image appears on your listing card. Upload a file or paste a URL.</p>

                    {/* Image Preview */}
                    {form.image_url && (
                        <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: '#F1F5F9', position: 'relative' }}>
                            <img src={form.image_url} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }} />
                            <button type="button" onClick={() => update('image_url', '')}
                                style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Toggle Switch: Upload / URL */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '14px', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
                        <button type="button" onClick={() => setImageMode('upload')}
                            style={{
                                padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
                                display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
                                background: imageMode === 'upload' ? '#D4AF37' : '#F8FAFC',
                                color: imageMode === 'upload' ? '#fff' : '#64748B',
                                transition: 'all 0.15s',
                            }}>
                            <Upload size={14} /> Upload File
                        </button>
                        <button type="button" onClick={() => setImageMode('url')}
                            style={{
                                padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
                                borderLeft: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
                                background: imageMode === 'url' ? '#D4AF37' : '#F8FAFC',
                                color: imageMode === 'url' ? '#fff' : '#64748B',
                                transition: 'all 0.15s',
                            }}>
                            <Link2 size={14} /> Paste URL
                        </button>
                    </div>

                    {imageMode === 'upload' ? (
                        /* ── Drag & Drop Upload Zone ── */
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragActive ? '#D4AF37' : '#CBD5E1'}`,
                                borderRadius: '12px',
                                padding: '36px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: dragActive ? 'rgba(212,175,55,0.05)' : '#FAFBFC',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.03)'; }}
                            onMouseLeave={(e) => { if (!dragActive) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FAFBFC'; } }}
                        >
                            <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} />
                            {uploading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 size={32} style={{ color: '#D4AF37', animation: 'spin 1s linear infinite' }} />
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <Upload size={22} style={{ color: '#D4AF37' }} />
                                    </div>
                                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        Click to upload or drag &amp; drop
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                                        JPEG, PNG, WebP or GIF &bull; Max 5 MB
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        /* ── URL Input ── */
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Link2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input type="url" value={form.image_url} onChange={(e) => update('image_url', e.target.value)}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    style={{ ...inputStyle, paddingLeft: '36px' }}
                                    onFocus={focusH} onBlur={blurH} />
                            </div>
                        </div>
                    )}

                    {uploadError && (
                        <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>{uploadError}</p>
                    )}
                </div>

                {/* Business Details */}
                <div className="dash-card" style={{ padding: '24px', marginBottom: '20px' }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>Business Details</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={labelStyle}><Building2 size={14} /> Business Name</label>
                            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} required
                                onFocus={focusH} onBlur={blurH} />
                        </div>
                        <div>
                            <label style={labelStyle}><Tag size={14} /> Category</label>
                            <select value={form.category} onChange={(e) => update('category', e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer', background: '#FFF' }} onFocus={focusH} onBlur={blurH}>
                                <option value="">Select category</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={labelStyle}><Phone size={14} /> Phone</label>
                            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} placeholder="+94 77 123 4567"
                                onFocus={focusH} onBlur={blurH} />
                        </div>
                        <div>
                            <label style={labelStyle}><MapPin size={14} /> Address</label>
                            <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} style={inputStyle} placeholder="42 Main St"
                                onFocus={focusH} onBlur={blurH} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={labelStyle}><MapPin size={14} /> City</label>
                            <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} style={inputStyle} placeholder="Colombo"
                                onFocus={focusH} onBlur={blurH} />
                        </div>
                        <div>
                            <label style={labelStyle}><MapPin size={14} /> Country</label>
                            <input type="text" value={form.country} onChange={(e) => update('country', e.target.value)} style={inputStyle} placeholder="Sri Lanka"
                                onFocus={focusH} onBlur={blurH} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}><FileText size={14} /> Description</label>
                        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3}
                            placeholder="Tell clients what makes your business special..."
                            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                            onFocus={focusH} onBlur={blurH} />
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94A3B8' }}>This text appears on your listing in the marketplace.</p>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label style={labelStyle}><Hash size={14} /> Keywords</label>
                        <input type="text" value={form.keywords} onChange={(e) => update('keywords', e.target.value)}
                            placeholder="e.g. haircut, colour, bridal, massage, nails"
                            style={inputStyle} onFocus={focusH} onBlur={blurH} />
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94A3B8' }}>Comma-separated keywords to help customers find you.</p>
                    </div>
                </div>

                {/* Email (read-only) */}
                <div className="dash-card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <label style={labelStyle}>Email (cannot be changed)</label>
                    <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#64748B' }}>{company?.email || '—'}</div>
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary" style={{
                    padding: '14px 32px', fontSize: '15px', borderRadius: '10px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1,
                }}>
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : <><Save size={18} /> Save Changes</>}
                </button>
            </form>
        </div>
    );
}
