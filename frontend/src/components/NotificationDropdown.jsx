import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, Eye, Star, MapPin, UserCheck, Image, X, AlertCircle, Sparkles, Bookmark } from 'lucide-react';
import { getNotifications, respondPhotoRequest } from '../services/api';
import './NotificationDropdown.css';

const ICON_MAP = {
    interest: Heart,
    profile_view: Eye,
    my_shortlist: Bookmark,
    shortlisted_by: Star,
    nearby: MapPin,
    horoscope: Sparkles,
    photo_match: Image,
    profile_incomplete: AlertCircle,
};

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
        } catch { return []; }
    });
    const [removedIds, setRemovedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('removedNotificationIds') || '[]');
        } catch { return []; }
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            if (data && data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const activeNotifications = notifications.filter(n => !removedIds.includes(n.id));
    const unreadCount = activeNotifications.filter(n => !readIds.includes(n.id)).length;

    const handleMarkAllRead = useCallback((e) => {
        if (e) e.stopPropagation();
        const allIds = activeNotifications.map(n => n.id);
        const updatedReadIds = [...new Set([...readIds, ...allIds])];
        setReadIds(updatedReadIds);
        localStorage.setItem('readNotificationIds', JSON.stringify(updatedReadIds));
    }, [activeNotifications, readIds]);

    const handleToggle = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState) {
            fetchNotifications();
            // Mark visible notifications as read on opening
            handleMarkAllRead();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        const updatedReadIds = [...new Set([...readIds, notification.id])];
        setReadIds(updatedReadIds);
        localStorage.setItem('readNotificationIds', JSON.stringify(updatedReadIds));

        setIsOpen(false);

        // Navigate to the appropriate page
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleRemove = (e, notificationId) => {
        e.stopPropagation();
        const updatedRemovedIds = [...new Set([...removedIds, notificationId])];
        setRemovedIds(updatedRemovedIds);
        localStorage.setItem('removedNotificationIds', JSON.stringify(updatedRemovedIds));
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={handleToggle}
                aria-label="Notifications"
                id="notification-bell-btn"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="notification-overlay" onClick={handleClose} />
                    <div className="notification-dropdown" id="notification-dropdown">
                        {/* Header with Close & Mark All Read Buttons */}
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="notification-header-actions">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        className="mark-all-read-btn"
                                        onClick={handleMarkAllRead}
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    className="notification-close-btn"
                                    onClick={handleClose}
                                    aria-label="Close notifications"
                                    id="notification-close-btn"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="notification-list">
                            {loading && activeNotifications.length === 0 ? (
                                <div className="notification-empty">
                                    <div className="notification-empty-icon">⏳</div>
                                    <p>Loading notifications...</p>
                                </div>
                            ) : activeNotifications.length === 0 ? (
                                <div className="notification-empty">
                                    <div className="notification-empty-icon">🔔</div>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                activeNotifications.map(notification => {
                                    const IconComponent = ICON_MAP[notification.type] || Bell;
                                    const isUnread = !readIds.includes(notification.id);

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`notification-item ${isUnread ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className={`notification-icon-circle ${notification.type}`}>
                                                <IconComponent size={18} />
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-content-header">
                                                    <p className="notification-title">{notification.title}</p>
                                                    <button
                                                        className="notification-remove-btn"
                                                        onClick={(e) => handleRemove(e, notification.id)}
                                                        title="Remove notification"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <p className="notification-message">{notification.message}</p>
                                                {notification.userId && (
                                                    <span className="notification-user-id">
                                                        ID: {notification.userId}
                                                    </span>
                                                )}
                                                <span className="notification-time">
                                                    {timeAgo(notification.timestamp)}
                                                </span>
                                                {notification.type === 'photo_request' && notification.status === 'pending' && (
                                                    <div className="photo-req-actions" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            className="photo-req-btn photo-req-accept"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await respondPhotoRequest(notification.requestId, 'accept');
                                                                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, status: 'accepted', title: 'Photo Request Accepted', message: `You accepted photo request from ${notification.userName}` } : n));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="photo-req-btn photo-req-decline"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await respondPhotoRequest(notification.requestId, 'decline');
                                                                    handleRemove(e, notification.id);
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {activeNotifications.length > 5 && (
                            <div className="notification-footer">
                                <a href="/matches" onClick={(e) => { e.preventDefault(); setIsOpen(false); navigate('/matches'); }}>
                                    View all activity →
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;
