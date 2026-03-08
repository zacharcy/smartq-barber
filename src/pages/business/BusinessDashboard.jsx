import React from 'react';
import { Calendar, Users, ShoppingBag, PieChart, Settings, Bell } from 'lucide-react';

export default function BusinessDashboard() {
    return (
        <div className="business-dashboard animate-fade-in">
            {/* Sidebar */}
            <aside className="sidebar dash-card">
                <div className="logo">
                    <h2>FreshaBiz</h2>
                </div>
                <nav className="sidebar-nav">
                    <a href="#" className="nav-item active">
                        <Calendar className="icon" size={20} />
                        <span>Calendar</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Users className="icon" size={20} />
                        <span>Clients</span>
                    </a>
                    <a href="#" className="nav-item">
                        <ShoppingBag className="icon" size={20} />
                        <span>Sales & POS</span>
                    </a>
                    <a href="#" className="nav-item">
                        <PieChart className="icon" size={20} />
                        <span>Analytics</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Settings className="icon" size={20} />
                        <span>Settings</span>
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="topbar dash-card">
                    <div className="search-bar">
                        <input type="text" placeholder="Search clients, appointments..." />
                    </div>
                    <div className="topbar-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="avatar"></div>
                            <span>Admin</span>
                        </div>
                        <a href="/" className="btn-secondary">View Consumer App</a>
                    </div>
                </header>

                <section className="dashboard-content">
                    <h1>Visual Calendar</h1>
                    <p className="text-muted">Manage your daily appointments and staff schedules.</p>

                    <div className="calendar-container dash-card">
                        <div className="calendar-header">
                            <div className="date-picker">Today, Feb 23</div>
                            <div className="view-toggles">
                                <button className="active">Day</button>
                                <button>Week</button>
                                <button>Month</button>
                            </div>
                        </div>
                        <div className="calendar-grid">
                            {/* Timeline implementation will go here */}
                            <div className="timeline">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="time-slot">{i + 9}:00 AM</div>
                                ))}
                            </div>
                            <div className="staff-columns">
                                <div className="staff-column">
                                    <div className="staff-header">Sarah</div>
                                    <div className="appointment-card primary">
                                        <span className="time">10:00 - 11:00</span>
                                        <span className="client">Alex J.</span>
                                        <span className="service">Hair Coloring</span>
                                    </div>
                                </div>
                                <div className="staff-column">
                                    <div className="staff-header">Michael</div>
                                    <div className="appointment-card warning">
                                        <span className="time">9:30 - 10:30</span>
                                        <span className="client">Sam K.</span>
                                        <span className="service">Deep Massage</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
