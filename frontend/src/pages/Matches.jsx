import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { showAlert, showConfirm } from '../components/GlobalModal';
import {
    Users, Star, Eye, UserPlus, ChevronRight, Contact, UserSearch, Search,
    Image, Sparkles, Loader2, Heart, GraduationCap, Briefcase,
    MessageCircle, X, Languages, MapPin
} from 'lucide-react';
import {
    getMatches, getShortlistedProfiles, getViewedYou, getViewedByYou, getShortlistedYou,
    sendInterest, shortlistProfile, ignoreProfile, getNearbyMatches, getHoroscopeMatches, getMatchesWithPhotos,
    getEducationPreferenceMatches, getProfile, getSentInterests, globalCache
} from '../services/api';
import './Matches.css';

const Matches = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('your-matches');
    const [profiles, setProfiles] = useState(globalCache.matches['your-matches'] || []);
    const [cache, setCache] = useState(globalCache.matches);
    const [loading, setLoading] = useState(!globalCache.matches['your-matches']);
    const [userReligion, setUserReligion] = useState('');
    const [sentInterests, setSentInterests] = useState(globalCache.interests?.sent || []);
    const [shortlistedProfiles, setShortlistedProfiles] = useState(globalCache.matches['shortlisted-by-you'] || []);

    // Load user's religion from localStorage or API
    useEffect(() => {
        const loadReligion = async () => {
            try {
                const stored = localStorage.getItem('userProfile');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.religion) {
                        setUserReligion(parsed.religion);
                        return;
                    }
                }
                // Fallback: fetch from API
                const profile = await getProfile();
                if (profile.religion) {
                    setUserReligion(profile.religion);
                }
            } catch (e) { /* ignore */ }
        };
        loadReligion();
    }, []);

    useEffect(() => {
        // Pre-fetch all categories on mount to make tab switching instant
        const prefetchAll = async () => {
            if (!globalCache.matches['your-matches']) {
                setLoading(true);
            }
            try {
                const initialData = await getMatches();
                setCache(prev => {
                    const newCache = { ...prev, 'your-matches': initialData };
                    globalCache.matches = newCache;
                    return newCache;
                });
                setProfiles(initialData);

                // Fetch the rest asynchronously in background so first load is quick
                const updateCache = (key, data) => {
                    setCache(c => {
                        const newCache = { ...c, [key]: data };
                        globalCache.matches = newCache;
                        return newCache;
                    });
                    if (key === 'shortlisted-by-you') {
                        setShortlistedProfiles(data);
                    }
                };
                
                getShortlistedProfiles().then(d => updateCache('shortlisted-by-you', d));
                getViewedYou().then(d => updateCache('viewed-you', d));
                getShortlistedYou().then(d => updateCache('shortlisted-you', d));
                getViewedByYou().then(d => updateCache('viewed-by-you', d));
                getNearbyMatches().then(d => updateCache('nearby-matches', d));
                getHoroscopeMatches().then(d => updateCache('matches-with-horoscope', d));
                getMatchesWithPhotos().then(d => updateCache('matches-with-photos', d));
                getEducationPreferenceMatches().then(d => updateCache('education-preference', d));
                
                getSentInterests('all').then(d => {
                    if (!globalCache.interests) globalCache.interests = {};
                    globalCache.interests.sent = d;
                    setSentInterests(d);
                }).catch(err => console.error('Failed to load sent interests', err));
                
            } catch (err) {
                console.error('Initial fetch error', err);
            } finally {
                setLoading(false);
            }
        };
        prefetchAll();
    }, []);

    useEffect(() => {
        if (cache[activeCategory]) {
            setProfiles(cache[activeCategory]);
            setLoading(false);
        } else {
            // If not in cache (e.g. still pre-fetching or failed), show loading and fetch immediately
            setLoading(true);
            refreshCategoryData();
        }
    }, [activeCategory, cache]);

    const refreshCategoryData = async () => {
        try {
            let data = [];
            switch (activeCategory) {
                case 'your-matches': data = await getMatches(); break;
                case 'shortlisted-by-you': data = await getShortlistedProfiles(); break;
                case 'viewed-you': data = await getViewedYou(); break;
                case 'shortlisted-you': data = await getShortlistedYou(); break;
                case 'viewed-by-you': data = await getViewedByYou(); break;
                case 'nearby-matches': data = await getNearbyMatches(); break;
                case 'matches-with-horoscope': data = await getHoroscopeMatches(); break;
                case 'matches-with-photos': data = await getMatchesWithPhotos(); break;
                case 'education-preference': data = await getEducationPreferenceMatches(); break;
                default: data = [];
            }
            setCache(prev => {
                const newCache = { ...prev, [activeCategory]: data };
                globalCache.matches = newCache;
                return newCache;
            });
            setProfiles(data);
        } catch (err) {
            console.error('Failed to load match data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInterestAction = async (e, uniqueId) => {
        e.stopPropagation();
        try {
            await sendInterest(uniqueId);
            showAlert('Interest sent successfully.', 'Success');
            // Optimistic update
            setSentInterests(prev => [...prev, { receiver: { uniqueId } }]);
        } catch (err) {
            showAlert(err.message || 'Failed to send interest', 'Error');
        }
    };

    const handleShortlistAction = async (e, uniqueId) => {
        e.stopPropagation();
        try {
            await shortlistProfile(uniqueId);
            showAlert('You have shortlisted this profile successfully.', 'Success');
            // Optimistic update
            setShortlistedProfiles(prev => [...prev, { uniqueId }]);
            
            // Only reload if we are on a list that might have changed
            if (activeCategory === 'your-matches' || activeCategory === 'nearby-matches') {
                // leave as is
            } else {
                refreshCategoryData();
            }
        } catch (err) {
            showAlert(err.message || 'Failed to shortlist', 'Error');
        }
    };

    const handleIgnoreAction = async (e, uniqueId) => {
        e.stopPropagation();
        const confirmed = await showConfirm('Are you sure you want to ignore this profile? It will be hidden from your matches.', 'Confirm Action');
        if (confirmed) {
            // Optimistic update
            setProfiles(prev => prev.filter(p => p.uniqueId !== uniqueId));
            try {
                await ignoreProfile(uniqueId);
                showAlert('You have ignored this profile.', 'Success');
            } catch (err) {
                showAlert(err.message || 'Failed to ignore profile', 'Error');
                refreshCategoryData(); // revert
            }
        }
    };



    // Grouping the sidebar items as shown in the user's images
    const matchGroups = [
        {
            title: "All Matches",
            items: [
                { id: 'your-matches', label: 'Your Matches', desc: 'View all the profiles that match your preferences', icon: <Contact size={20} /> }
            ]
        },
        {
            title: "Based on activity",
            items: [
                { id: 'shortlisted-by-you', label: 'Shortlisted by you', desc: 'Matches you have shortlisted', icon: <Star size={20} fill="currentColor" /> },
                { id: 'viewed-you', label: 'Viewed you', desc: 'Matches who have viewed your profile', icon: <Eye size={20} /> },
                { id: 'shortlisted-you', label: 'Shortlisted you', desc: 'Matches who have shortlisted your profile', icon: <UserPlus size={20} /> },
                { id: 'viewed-by-you', label: 'Viewed by you', desc: 'Matches you have viewed', icon: <UserSearch size={20} /> }
            ]
        },
        {
            title: "",
            items: [
                { id: 'nearby-matches', label: 'Nearby matches', desc: 'Matches near your location', icon: <MapPin size={20} /> }
            ]
        },
        {
            title: "Based on profile details",
            items: [
                { id: 'matches-with-photos', label: 'Matches with photos', desc: 'Matches that have added photos', icon: <Image size={20} /> },
                { id: 'matches-with-horoscope', label: 'Matches with horoscope', desc: 'Matches that have added horoscope', icon: <Sparkles size={20} /> },
                { id: 'education-preference', label: 'Educational Preference', desc: 'Matches based on your partner education preference', icon: <GraduationCap size={20} /> }
            ]
        }
    ];

    // Filter matchGroups based on user's religion
    const isHindu = userReligion && userReligion.toLowerCase() === 'hindu';
    const filteredMatchGroups = matchGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            // Hide horoscope matches for non-Hindu users
            if (item.id === 'matches-with-horoscope' && !isHindu) return false;
            return true;
        })
    })).filter(group => group.items.length > 0); // Remove empty groups

    const getActiveItem = () => {
        for (const group of filteredMatchGroups) {
            const item = group.items.find(i => i.id === activeCategory);
            if (item) return item;
        }
        return filteredMatchGroups[0].items[0];
    };

    const activeItem = getActiveItem();
    const emptyTitle = activeCategory === 'viewed-you'
        ? 'No one has viewed your profile yet'
        : activeCategory === 'viewed-by-you'
            ? 'You have not viewed any profiles yet'
            : activeCategory === 'shortlisted-by-you'
                ? 'Your shortlist is empty'
                : activeCategory === 'education-preference'
                    ? "No matches found. Make sure you've set an Educational Preference."
                    : 'You have no matches right now';

    const renderList = () => {
        if (loading) {
            return (
                <div className="loading-state">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Loading matches...</p>
                </div>
            );
        }

        if (profiles.length === 0) {
            return (
                <div className="empty-state-wrapper">
                    <div className="empty-illustration">
                        <Users size={120} color="#cbd5e1" strokeWidth={1.5} fill="#e2e8f0" />
                        <div className="search-overlay">
                            <Search size={40} color="#1e293b" strokeWidth={2.5} />
                        </div>
                    </div>
                    <h3 className="empty-title">{emptyTitle}</h3>
                    {activeCategory === 'your-matches' && (
                        <button className="change-pref-btn" onClick={() => navigate('/profile', { state: { openPreferences: true } })}>Change Preferences</button>
                    )}
                </div>
            );
        }

        if (activeCategory === 'education-preference') {
            return (
                <div className="edu-pref-section">
                    <div className="edu-pref-scroll">
                        {profiles.map(p => {
                            const isInterested = sentInterests.some(i => i.receiver?.uniqueId === p.uniqueId);
                            return (
                            <div key={p.uniqueId} className="edu-pref-card" onClick={() => navigate(`/profile/${p.uniqueId}`)}>
                                <div className="edu-photo-container">
                                    {p.photo ? (
                                        <img src={p.photo} alt={p.fullName} />
                                    ) : (
                                        <div className="edu-no-photo">
                                            <Image size={24} />
                                            <span>No Photo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="edu-info">
                                    <h4 className="edu-name">{p.fullName}</h4>
                                    <span className="edu-age">{p.age} Yrs, {p.height}</span>
                                    <span className="edu-detail"><GraduationCap size={14} /> {p.education || 'Education N/A'}</span>
                                    <span className="edu-detail"><MapPin size={14} /> {p.city || 'Location N/A'}</span>
                                </div>
                                <div className="edu-actions">
                                    {!isInterested && (
                                        <button className="edu-btn edu-interest" onClick={(e) => handleSendInterestAction(e, p.uniqueId)}>
                                            <Heart size={16} /> Interest
                                        </button>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="match-results-list">
                {profiles.map(p => {
                    const isInterested = sentInterests.some(i => i.receiver?.uniqueId === p.uniqueId) || p.hasInterested;
                    const isShortlisted = shortlistedProfiles.some(s => s.uniqueId === p.uniqueId) || p.hasShortlisted || activeCategory === 'shortlisted-by-you';
                    return (
                    <div key={p.uniqueId} className="match-card" onClick={() => navigate(`/profile/${p.uniqueId}`)}>
                        <div className="match-card-top">
                            <div className="match-card-sidebar">
                                {p.photo ? (
                                    <img src={p.photo} alt={p.fullName} />
                                ) : (
                                    <div className="request-photo-overlay">
                                        <button className="request-photo-btn">Request photo</button>
                                    </div>
                                )}
                            </div>
                            <div className="match-card-main">
                                <span className="active-today-label">Active Today</span>
                                <h3 className="match-card-name">{p.fullName}, {p.age}</h3>
                                <div className="match-card-basics">
                                    {p.height} • {p.city || 'Location N/A'} • {p.religion}-{p.caste || p.sect || 'Community N/A'}
                                </div>
                                <div className="match-card-details-grid">
                                    <div className="detail-item">
                                        <Briefcase size={16} />
                                        <span>{p.occupation || 'Profession N/A'}</span> • <span>{p.income || 'No Income'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <GraduationCap size={16} />
                                        <span>{p.education || 'Education N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <Heart size={16} />
                                        <span>{p.maritalStatus || 'Never Married'}</span>
                                    </div>
                                    {p.motherTongue && (
                                        <div className="detail-item">
                                            <Languages size={16} />
                                            <span>{p.motherTongue}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="match-card-footer">
                            {!isInterested && (
                                <button className="card-action-btn" onClick={(e) => handleSendInterestAction(e, p.uniqueId)}>
                                    <Sparkles size={18} />
                                    Interest
                                </button>
                            )}
                            {isShortlisted ? (
                                <button className="card-action-btn" disabled style={{ color: '#fbbf24', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                                    <Star size={18} fill="currentColor" />
                                    Shortlisted
                                </button>
                            ) : (
                                <button className="card-action-btn" onClick={(e) => handleShortlistAction(e, p.uniqueId)}>
                                    <Star size={18} />
                                    Shortlist
                                </button>
                            )}
                            <button className="card-action-btn" onClick={(e) => handleIgnoreAction(e, p.uniqueId)}>
                                <X size={18} />
                                Ignore
                            </button>

                        </div>
                    </div>
                );
                })}
            </div>
        );
    };

    return (
        <div className="matches-page">
            <Navbar />
            <div className="matches-container">
                <div className="matches-layout glass-panel">

                    {/* Sidebar */}
                    <aside className="matches-sidebar">
                        {filteredMatchGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="match-group">
                                {group.title && <h4 className="group-title">{group.title}</h4>}
                                <ul className="group-list">
                                    {group.items.map(item => (
                                        <li key={item.id}>
                                            <button
                                                className={`match-link ${activeCategory === item.id ? 'active' : ''}`}
                                                onClick={() => setActiveCategory(item.id)}
                                            >
                                                <div className="link-icon">{item.icon}</div>
                                                <div className="link-content">
                                                    <span className="link-label">{item.label}</span>
                                                    <span className="link-desc">{item.desc}</span>
                                                </div>
                                                <ChevronRight size={16} className="chevron" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </aside>

                    {/* Main Content */}
                    <main className="matches-content">
                        <div className="content-header">
                            <h2>{activeItem.label}</h2>
                            <p>{activeItem.desc}</p>
                        </div>

                        <div className="matches-body">
                            {renderList()}
                        </div>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Matches;
