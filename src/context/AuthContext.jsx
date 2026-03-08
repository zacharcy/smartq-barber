import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [company, setCompany] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('smartq_token'));
    const [loading, setLoading] = useState(true);

    // On mount, if token exists, fetch company profile
    useEffect(() => {
        if (token) {
            fetchMe(token);
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchMe(authToken) {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCompany(data.company);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('smartq_token');
                setToken(null);
                setCompany(null);
            }
        } catch (err) {
            console.error('Auth fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }

    async function register(formData) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        localStorage.setItem('smartq_token', data.token);
        setToken(data.token);
        setCompany(data.company);
        return data;
    }

    async function login({ email, password }) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('smartq_token', data.token);
        setToken(data.token);
        setCompany(data.company);
        return data;
    }

    function logout() {
        localStorage.removeItem('smartq_token');
        setToken(null);
        setCompany(null);
    }

    // Helper for making authenticated API calls
    function authFetch(url, options = {}) {
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
    }

    return (
        <AuthContext.Provider value={{ company, setCompany, token, loading, register, login, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
