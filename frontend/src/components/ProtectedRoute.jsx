import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

const ProtectedRoute = ({ children, requireVerification = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const loggedIn = isAuthenticated();
    const isDeactivated = localStorage.getItem('isDeactivated') === 'true';
    let isVerified = true;
    try {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (userProfile.isVerified === false) {
            isVerified = false;
        }
    } catch(e) {}

    useEffect(() => {
        if (!loggedIn) {
            navigate('/');
        } else if (isDeactivated && location.pathname !== '/settings') {
            // If profile is deactivated, redirect to settings page
            navigate('/settings');
        } else if (loggedIn && requireVerification && !isVerified && location.pathname !== '/verify') {
            // If user is not verified, redirect to verify page
            navigate('/verify');
        }
    }, [loggedIn, isDeactivated, isVerified, requireVerification, navigate, location.pathname]);

    if (!loggedIn) return null;

    return children;
};

export default ProtectedRoute;
