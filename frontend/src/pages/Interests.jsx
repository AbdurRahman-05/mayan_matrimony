import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    Loader2, User, Clock, Check, X, MapPin, Briefcase, GraduationCap,
    Heart, Languages, Sparkles, Star, MessageCircle
} from 'lucide-react';
import { getReceivedInterests, getSentInterests, respondToInterest, shortlistProfile, ignoreProfile } from '../services/api';
import './Interests.css';

const Interests = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('received'); // 'received' or 'sent'
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'accepted', 'declined'
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInterests();
    }, [activeSection, activeFilter]);

    const loadInterests = async () => {
        setLoading(true);
        try {
            const data = activeSection === 'received'
                ? await getReceivedInterests(activeFilter)
                : await getSentInterests(activeFilter);
            setInterests(data);
        } catch (err) {
            console.error('Failed to load interests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (e, id, status) => {
        e.stopPropagation();
        // Optimistic UI update for immediate feedback
        setInterests(prev => {
            if (activeFilter === 'all') {
                // In 'all', just update the status badge
                return prev.map(item => item.id === id ? { ...item, status } : item);
            } else {
                // In specific tabs like 'pending', remove the item since it's no longer pending
                return prev.filter(item => item.id !== id);
            }
        });

        try {
            await respondToInterest(id, status);
        } catch (err) {
            console.error(err);
            alert('Failed to respond to interest. Please try again.');
            loadInterests(); // revert on failure
        }
    };

    const handleShortlistAction = async (e, uniqueId) => {
        e.stopPropagation();
        try {
            await shortlistProfile(uniqueId);
            alert('You have shortlisted this profile successfully.');
        } catch (err) {
            alert(err.message || 'Failed to shortlist');
        }
    };

    const handleIgnoreAction = async (e, uniqueId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to ignore this profile? It will be hidden from your matches.')) {
            try {
                await ignoreProfile(uniqueId);
                alert('You have ignored this profile.');
                // After ignore, we should refresh the interest list
                loadInterests();
            } catch (err) {
                alert(err.message || 'Failed to ignore profile');
            }
        }
    };

    const handleChatAction = (e, uniqueId) => {
        e.stopPropagation();
        alert('Chat feature coming soon!');
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'accepted', label: 'Accepted/Replied' },
        { id: 'declined', label: 'Declined' }
    ];

    // Dynamic title based on section + filter
    const getTitle = () => {
        if (activeSection === 'received') {
            if (activeFilter === 'all') return 'All interests received';
            if (activeFilter === 'pending') return 'Pending interests';
            if (activeFilter === 'accepted') return 'Matches who accepted/replied to your interest';
            if (activeFilter === 'declined') return 'Declined interests';
        } else {
            if (activeFilter === 'all') return 'Interests sent by you';
            if (activeFilter === 'pending') return 'Matches yet to respond';
            if (activeFilter === 'accepted') return 'Matches who accepted/replied to your interest';
            if (activeFilter === 'declined') return 'Declined interests sent';
        }
        return 'Interests';
    };

    // Dynamic subtitle based on section + filter
    const getSubtitle = () => {
        if (activeSection === 'received') {
            if (activeFilter === 'all') return 'Interests and responses from free members';
            if (activeFilter === 'pending') return 'Interests from free members awaiting your response';
            if (activeFilter === 'accepted') return '';
            if (activeFilter === 'declined') return '';
        } else {
            return '';
        }
        return '';
    };

    // Dynamic empty state message based on section + filter
    const getEmptyMessage = () => {
        if (activeSection === 'received') {
            if (activeFilter === 'all') return 'No conversation till now';
            if (activeFilter === 'pending') return 'You have no pending interests/messages.';
            if (activeFilter === 'accepted') return 'You have no accepted interests or replies yet.';
            if (activeFilter === 'declined') return 'You have no declined interests yet.';
        } else {
            if (activeFilter === 'all') return 'You have not sent any interests yet';
            if (activeFilter === 'pending') return 'You have no pending interests';
            if (activeFilter === 'accepted') return 'You have no interests that were accepted/responded to';
            if (activeFilter === 'declined') return 'You have no declined interests yet';
        }
        return 'No interests found';
    };

    const getEmptySubMessage = () => {
        if (activeSection === 'received' && activeFilter === 'all') {
            return 'All incoming interests and responses will be shown here';
        }
        return '';
    };

    // Show "Explore matches" button only for sent section
    const showExploreBtn = activeSection === 'sent';

    const subtitle = getSubtitle();

    return (
        <div className="interests-page">
            <Navbar />
            <div className="interests-container">

                <div className="interests-layout">
                    {/* Sidebar */}
                    <aside className="interests-sidebar">
                        <div className="sidebar-group">
                            <h3 className="sidebar-title">Interests Received</h3>
                            <ul className="sidebar-nav">
                                {tabs.map(tab => (
                                    <li key={`received-${tab.id}`}>
                                        <button
                                            className={`sidebar-link ${activeSection === 'received' && activeFilter === tab.id ? 'active' : ''}`}
                                            onClick={() => { setActiveSection('received'); setActiveFilter(tab.id); }}
                                        >
                                            {tab.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="sidebar-divider"></div>

                        <div className="sidebar-group">
                            <h3 className="sidebar-title">Interests Sent</h3>
                            <ul className="sidebar-nav">
                                {tabs.map(tab => (
                                    <li key={`sent-${tab.id}`}>
                                        <button
                                            className={`sidebar-link ${activeSection === 'sent' && activeFilter === tab.id ? 'active' : ''}`}
                                            onClick={() => { setActiveSection('sent'); setActiveFilter(tab.id); }}
                                        >
                                            {tab.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="interests-content">
                        <div className="content-header">
                            <h2>{getTitle()}</h2>
                            {subtitle && <p className="content-subtitle">{subtitle}</p>}
                        </div>

                        <div className="content-body">
                            {loading ? (
                                <div className="loading-state">
                                    <Loader2 className="animate-spin" size={40} />
                                    <p>Loading interests...</p>
                                </div>
                            ) : interests.length > 0 ? (
                                <div className="match-results-list">
                                    {interests.map(item => {
                                        const profile = activeSection === 'received' ? item.sender : item.receiver;
                                        return (
                                            <div key={item.id} className="match-card" onClick={() => navigate(`/profile/${profile.uniqueId}`)}>
                                                <div className="match-card-top">
                                                    <div className="match-card-sidebar">
                                                        {profile.photo ? (
                                                            <img src={profile.photo} alt={profile.fullName} />
                                                        ) : (
                                                            <div className="request-photo-overlay">
                                                                <button className="request-photo-btn" onClick={(e) => e.stopPropagation()}>Request photo</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="match-card-main">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span className="active-today-label">
                                                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                                {activeSection === 'received' ? 'Received' : 'Sent'} {new Date(item.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <span className={`status-badge ${item.status}`}>{item.status}</span>
                                                        </div>
                                                        <h3 className="match-card-name">{profile.fullName}, {profile.age}</h3>
                                                        <div className="match-card-basics">
                                                            {profile.height} • {profile.city || 'Location N/A'} • {profile.religion}-{profile.caste || profile.sect || 'Community N/A'}
                                                        </div>
                                                        <div className="match-card-details-grid">
                                                            <div className="detail-item">
                                                                <Briefcase size={16} />
                                                                <span>{profile.occupation || 'Profession N/A'}</span> • <span>{profile.income || 'No Income'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <GraduationCap size={16} />
                                                                <span>{profile.education || 'Education N/A'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <Heart size={16} />
                                                                <span>{profile.maritalStatus || 'Never Married'}</span>
                                                            </div>
                                                            {profile.motherTongue && (
                                                                <div className="detail-item">
                                                                    <Languages size={16} />
                                                                    <span>{profile.motherTongue}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {item.message && (
                                                            <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #cbd5e1', fontStyle: 'italic', fontSize: '0.9rem', color: '#475569' }}>
                                                                "{item.message}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="match-card-footer">
                                                    {activeSection === 'received' && item.status === 'pending' ? (
                                                        <>
                                                            <button className="card-action-btn" style={{ color: '#00a650', borderRight: '1px solid #fde68a' }} onClick={(e) => handleRespond(e, item.id, 'accepted')}>
                                                                <Check size={18} />
                                                                Accept Interest
                                                            </button>
                                                            <button className="card-action-btn" style={{ color: '#ef4444' }} onClick={(e) => handleRespond(e, item.id, 'declined')}>
                                                                <X size={18} />
                                                                Decline
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); alert('Interest already processed'); }}>
                                                                <Sparkles size={18} />
                                                                Interest
                                                            </button>
                                                            <button className="card-action-btn" onClick={(e) => handleShortlistAction(e, profile.uniqueId)}>
                                                                <Star size={18} />
                                                                Shortlist
                                                            </button>
                                                            <button className="card-action-btn" onClick={(e) => handleIgnoreAction(e, profile.uniqueId)}>
                                                                <X size={18} />
                                                                Ignore
                                                            </button>
                                                            <button className="card-action-btn" onClick={(e) => handleChatAction(e, profile.uniqueId)}>
                                                                <MessageCircle size={18} />
                                                                Chat
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="illustration-wrapper">
                                        <img
                                            src="/interests_illustration.png"
                                            alt="No interests illustration"
                                            className="interests-illustration-img"
                                        />
                                    </div>
                                    <h3 className="empty-message">{getEmptyMessage()}</h3>
                                    {getEmptySubMessage() && (
                                        <p className="empty-sub-message">{getEmptySubMessage()}</p>
                                    )}
                                    {showExploreBtn && (
                                        <button className="explore-btn" onClick={() => navigate('/matches')}>
                                            Explore matches
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Interests;
