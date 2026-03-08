import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, ShoppingBag, PieChart, Settings, Bell, LayoutDashboard, MessageSquare, LogOut, UsersRound, FileText, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BusinessLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { company, logout } = useAuth();

    // Enforce business theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'business');
        return () => document.documentElement.removeAttribute('data-theme');
    }, []);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    function handleLogout() {
        logout();
        navigate('/business/login');
    }

    // Get company initials for avatar
    const initials = company?.name
        ? company.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'L';

    return (
        <div className="business-dashboard animate-fade-in">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => window.location.href = '/'}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--color-accent-gold), #B38F2B)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-sans)', boxShadow: '0 2px 4px rgba(212,175,55,0.3)' }}>S</div>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px', fontFamily: 'var(--font-sans)' }}>SmartQ</span>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/business/dashboard" className={`nav-item ${isActive('/business/dashboard') ? 'active' : ''}`}>
                        <LayoutDashboard className="icon" size={20} />
                        <span>Home</span>
                    </Link>
                    <Link to="/business/calendar" className={`nav-item ${isActive('/business/calendar') ? 'active' : ''}`}>
                        <Calendar className="icon" size={20} />
                        <span>Calendar</span>
                    </Link>
                    <Link to="/business/appointments" className={`nav-item ${isActive('/business/appointments') ? 'active' : ''}`}>
                        <FileText className="icon" size={20} />
                        <span>Appointments</span>
                    </Link>
                    <Link to="/business/clients" className={`nav-item ${isActive('/business/clients') ? 'active' : ''}`}>
                        <Users className="icon" size={20} />
                        <span>Clients</span>
                    </Link>
                    <Link to="/business/services" className={`nav-item ${isActive('/business/services') ? 'active' : ''}`}>
                        <ShoppingBag className="icon" size={20} />
                        <span>Services</span>
                    </Link>
                    <Link to="/business/promotions" className={`nav-item ${isActive('/business/promotions') ? 'active' : ''}`}>
                        <Megaphone className="icon" size={20} />
                        <span>Promotions</span>
                    </Link>
                    <Link to="/business/team" className={`nav-item ${isActive('/business/team') ? 'active' : ''}`}>
                        <UsersRound className="icon" size={20} />
                        <span>Team</span>
                    </Link>
                    <Link to="/business/inbox" className={`nav-item ${isActive('/business/inbox') ? 'active' : ''}`}>
                        <MessageSquare className="icon" size={20} />
                        <span>AI Chat Inbox</span>
                    </Link>
                    <Link to="/business/settings" className={`nav-item ${isActive('/business/settings') ? 'active' : ''}`}>
                        <Settings className="icon" size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="topbar">
                    <div className="search-bar">
                        <input type="text" placeholder="Search clients, appointments, or services..." />
                    </div>
                    <div className="topbar-actions">
                        <button className="icon-btn" aria-label="Notifications"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="avatar" style={{ background: 'var(--color-accent-gold)', color: '#fff' }}>{initials}</div>
                            <span>{company?.name || 'My Business'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </header>

                <section className="dashboard-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}
