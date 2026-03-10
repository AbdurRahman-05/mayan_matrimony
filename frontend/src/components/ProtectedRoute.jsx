import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const loggedIn = isAuthenticated();
    const isDeactivated = localStorage.getItem('isDeactivated') === 'true';

    useEffect(() => {
        if (!loggedIn) {
            navigate('/');
        } else if (isDeactivated && location.pathname !== '/settings') {
            // If profile is deactivated, redirect to settings page
            navigate('/settings');
        }
    }, [loggedIn, isDeactivated, navigate, location.pathname]);

    if (!loggedIn) return null;

    return children;
};

export default ProtectedRoute;
