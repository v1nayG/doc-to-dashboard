import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    // Auth disabled for testing: provide default test user
    const [user, setUser] = useState({ _id: '000000000000000000000001', username: 'testuser', email: 'test@example.com' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Set auth token for axios requests
    const setAuthToken = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    };

    // Check if user is logged in on mount
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    const res = await axios.get(`${API_BASE}/auth/me`);
                    setUser(res.data);
                } catch (err) {
                    // Keep mock user for testing even if /me fails
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    // Register user
    const register = async (username, email, password) => {
        try {
            setError(null);
            const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
            setAuthToken(res.data.token);
            setUser({ _id: res.data._id, username: res.data.username, email: res.data.email });
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            return false;
        }
    };

    // Login user
    const login = async (email, password) => {
        try {
            setError(null);
            const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
            setAuthToken(res.data.token);
            setUser({ _id: res.data._id, username: res.data.username, email: res.data.email });
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            return false;
        }
    };

    // Logout user
    const logout = () => {
        setAuthToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, register, login, logout, setError }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
