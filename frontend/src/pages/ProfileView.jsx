import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, User, Heart, Lock, Bookmark, Image as ImageIcon, MapPin, Briefcase, GraduationCap, Clock, MessageCircle, MoreVertical, ShieldCheck, Phone, Mail, X, Check, Eye } from 'lucide-react';
import { showAlert } from '../components/GlobalModal';
import { searchProfileById, getProfile, sendInterest, shortlistProfile, getViewedYou } from '../services/api';
import './ProfileView.css';

const ProfileView = () => {
    const navigate = useNavigate();
    const { uniqueId: paramId } = useParams();
    const [previewTab, setPreviewTab] = useState('about');
    const [profileData, setProfileData] = useState({});
    const [preferenceData, setPreferenceData] = useState({});
    const [favouritesData, setFavouritesData] = useState({});
    const [loading, setLoading] = useState(false);

    const favouritesCategories = [
        { key: 'hobbies', label: 'Hobbies' },
        { key: 'sports', label: 'Sports' },
        { key: 'movies', label: 'Movies' },
        { key: 'read', label: 'Read' },
        { key: 'tvShows', label: 'TV Shows' },
        { key: 'destinations', label: 'Destinations' },
    ];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (paramId) {
                    // Viewing someone else
                    const data = await getProfileById(paramId);
                    setProfileData(data.profile || data);
                    setPreferenceData(data.preferences || {});
                    setFavouritesData(data.favourites || {});
                } else {
                    // Viewing own profile preview
                    const [profile, prefs, favs] = await Promise.all([
                        getProfile(),
                        getPreferences(),
                        getFavourites()
                    ]);
                    setProfileData(profile);
                    setPreferenceData(prefs);
                    setFavouritesData(favs);
                }
            } catch (err) {
                console.error('Failed to load profile view', err);
                if (err.message === 'Profile not found') {
                    showAlert('Profile not found', 'Error');
                    navigate('/home');
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [paramId, navigate]);

    const myUniqueId = localStorage.getItem('uniqueId') || '';

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not specified';
        const date = new Date(dateStr);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getLocationString = () => {
        const parts = [profileData.city, profileData.state, profileData.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Not specified';
    };

    const getDateFromProfile = () => {
        if (profileData.dob) {
            const direct = new Date(profileData.dob);
            if (!Number.isNaN(direct.getTime())) return direct;
        }
        if (profileData.dobDay && profileData.dobMonth && profileData.dobYear) {
            const monthIndexMap = {
                jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
                apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
                aug: 7, august: 7, sep: 8, sept: 8, september: 8,
                oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
            };
            const normalizedMonth = String(profileData.dobMonth).trim().toLowerCase();
            const monthIndex = monthIndexMap[normalizedMonth];
            if (monthIndex !== undefined) {
                const parsed = new Date(Number(profileData.dobYear), monthIndex, Number(profileData.dobDay));
                if (!Number.isNaN(parsed.getTime())) return parsed;
            }
        }
        return null;
    };

    const previewDate = getDateFromProfile();
    const previewAge = previewDate ? calculateAge(previewDate.toISOString().slice(0, 10)) : '';
    const previewDobText = previewDate ? formatDate(previewDate.toISOString().slice(0, 10)) : 'Not specified';
    const previewReligionText = [profileData.religion, profileData.sect, profileData.caste, profileData.horoscope].filter(Boolean).join(' | ') || 'Religion not specified';
    const previewFamilyLocation = [profileData.familyCity, profileData.familyState, profileData.familyCountry].filter(Boolean).join(', ') || profileData.familyLivingIn || 'Not specified';
    const previewFamilyType = profileData.familyType || 'Not specified';
    const previewBrothers = profileData.numberOfBrothers ?? profileData.brothers ?? '';
    const previewSisters = profileData.numberOfSisters ?? profileData.sisters ?? '';
    const previewMarriedBrothers = profileData.marriedBrothers ?? profileData.brothersMarried ?? '';
    const previewMarriedSisters = profileData.marriedSisters ?? profileData.sistersMarried ?? '';
    const previewDiet = profileData.dietaryHabit || profileData.diet || 'Not specified';
    const previewEducationPreference = preferenceData.prefEducation || "Doesn't Matter";
    const previewOccupationPreference = preferenceData.prefOccupation || "Doesn't Matter";
    const previewEmploymentPreference = preferenceData.prefEmploymentType || "Doesn't Matter";
    const previewIncomePreference = preferenceData.prefIncome || "Doesn't Matter";
    const previewCountryPreference = preferenceData.prefCountry || 'India';

    const pronounObj = profileData.gender === 'Female' ? 'her' : 'him';
    const pronounSubj = profileData.gender === 'Female' ? 'she' : 'he';
    const pronounPoss = profileData.gender === 'Female' ? 'her' : 'his';
    const pronounPossCap = profileData.gender === 'Female' ? 'Her' : 'His';

    // Count total photos (main + additional)
    const totalPhotos = (profileData.photo ? 1 : 0) + (profileData.additionalPhotos ? profileData.additionalPhotos.filter(p => p).length : 0);

    return (
        <div className="profile-view-page">
            <Navbar />

            <div className="pv-container">

                <button type="button" className="pv-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                    <ArrowLeft size={22} />
                </button>

                <div className="pv-hero">
                    {loading ? (
                        <div className="pv-loading-hero">
                            <Loader2 className="animate-spin" size={48} />
                        </div>
                    ) : (
                        <>
                            {/* Photo block */}
                            <div className="pv-photo-block">
                                {profileData.photo ? (
                                    <img src={profileData.photo} alt={profileData.fullName || 'Profile'} />
                                ) : (
                                    <div className="pv-photo-placeholder">
                                        <User size={88} color="#9ca3af" />
                                    </div>
                                )}

                                {/* Photo count badge */}
                                {totalPhotos > 0 && (
                                    <div className="pv-photo-count-badge">
                                        <Images size={16} />
                                        <span>{totalPhotos}</span>
                                    </div>
                                )}
                            </div>

                            {/* Name overlay at bottom of hero */}
                            <div className="pv-hero-info">
                                <h2 className="pv-name">{profileData.fullName || 'Member Name'}{previewAge ? `, ${previewAge}` : ''}</h2>
                                <p className="pv-id">ID - {profileData.uniqueId || myUniqueId}</p>
                                <p className="pv-managed">{profileData.gender === 'Female' ? 'Her' : 'His'} profile is managed by {profileData.profileFor || 'Self'}</p>
                            </div>
                        </>
                    )}

                    {/* Tabs */}
                    <div className="pv-tabs">
                        <button type="button" className={`pv-tab ${previewTab === 'about' ? 'active' : ''}`} onClick={() => setPreviewTab('about')}>About {paramId && paramId !== myUniqueId ? (profileData.gender === 'Female' ? 'Her' : 'Him') : 'Me'}</button>
                        <button type="button" className={`pv-tab ${previewTab === 'family' ? 'active' : ''}`} onClick={() => setPreviewTab('family')}>Family</button>
                        <button type="button" className={`pv-tab ${previewTab === 'looking' ? 'active' : ''}`} onClick={() => setPreviewTab('looking')}>Looking For</button>
                    </div>
                </div>

                <div className="pv-content">
                    {loading ? (
                        <div className="pv-loading-content">
                            <p>Fetching profile details...</p>
                        </div>
                    ) : (
                        previewTab === 'about' && (
                            <>
                                <div className="pv-quick-grid">
                                    <div className="pv-quick-item"><Ruler size={18} /><span>{profileData.height || 'Not specified'}</span></div>
                                    <div className="pv-quick-item"><MapPin size={18} /><span>{getLocationString()}</span></div>
                                    <div className="pv-quick-item"><Globe2 size={18} /><span>{previewReligionText}</span></div>
                                    <div className="pv-quick-item"><Briefcase size={18} /><span>{profileData.income || 'No Income'}</span></div>
                                    <div className="pv-quick-item"><Languages size={18} /><span>Mother tongue is {profileData.motherTongue || 'not specified'}</span></div>
                                    <div className="pv-quick-item">
                                        <Heart size={18} />
                                        <span>
                                            {profileData.maritalStatus || 'Never Married'}
                                            {profileData.maritalStatus && profileData.maritalStatus !== 'Never Married' && profileData.havingChildren === 'Yes' && profileData.numberOfChildren && (
                                                ` • ${profileData.numberOfChildren} Children`
                                            )}
                                        </span>
                                    </div>
                                    <div className="pv-quick-item"><Calendar size={18} /><span>{previewDobText}</span></div>
                                    {profileData.timeOfBirth && (
                                        <div className="pv-quick-item"><Clock size={18} /><span>{profileData.timeOfBirth}</span></div>
                                    )}
                                    {profileData.placeOfBirth && (
                                        <div className="pv-quick-item"><MapPin size={18} /><span>Born in {profileData.placeOfBirth}</span></div>
                                    )}
                                </div>

                                <div className="pv-card">
                                    <h3>About {pronounObj}</h3>
                                    <p>{profileData.about || 'No description added yet.'}</p>
                                    {profileData.disability && profileData.disability !== 'None' && (
                                        <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Disability:</strong> {profileData.disability}</p>
                                    )}
                                </div>

                                <div className="pv-card">
                                    <h3>{pronounPossCap} Education</h3>
                                    <p>{profileData.education || 'Not specified'}</p>
                                    {profileData.ugCollege && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>College:</strong> {profileData.ugCollege}</p>}
                                    {profileData.schoolName && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>School:</strong> {profileData.schoolName}</p>}
                                </div>

                                <div className="pv-card">
                                    <h3>{pronounPossCap} Career</h3>
                                    <p><strong>Occupation:</strong> {profileData.occupation || 'Not specified'}</p>
                                    <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Employment Type:</strong> {profileData.employmentType || 'Not specified'}</p>
                                    {profileData.organizationName && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Organization:</strong> {profileData.organizationName}</p>}
                                    {profileData.settlingAbroad && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Interested in settling abroad?:</strong> {profileData.settlingAbroad}</p>}
                                </div>
                            </>
                        )
                    )}

                    {!loading && previewTab === 'family' && (
                        <>
                            <div className="pv-card">
                                <h3>{pronounPossCap} Family</h3>
                                <div className="pv-row"><span>Family Type</span><strong>{previewFamilyType}</strong></div>
                                <div className="pv-row"><span>Based Out Of</span><strong>{previewFamilyLocation}</strong></div>
                                <div className="pv-row"><span>Family Status</span><strong>{profileData.familyStatus || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Living With Parents</span><strong>{profileData.livingWithParents || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Family Income</span><strong>{profileData.familyIncome || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Father</span><strong>{profileData.fatherOccupation || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Mother</span><strong>{profileData.motherOccupation || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Siblings</span><strong>{previewBrothers || 0} Brothers, {previewSisters || 0} Sisters</strong></div>
                                <div className="pv-row"><span>Married Siblings</span><strong>{previewMarriedBrothers || 0} Brothers, {previewMarriedSisters || 0} Sisters</strong></div>
                            </div>

                            <div className="pv-card">
                                <h3>{pronounPossCap} Lifestyle and Interests</h3>
                                <div className="pv-row"><span>Diet</span><strong>{previewDiet}</strong></div>
                                <div className="pv-row"><span>Drinking</span><strong>{profileData.drinking || 'Not specified'}</strong></div>
                                <div className="pv-row"><span>Smoking</span><strong>{profileData.smoking || 'Not specified'}</strong></div>
                                {favouritesCategories.map(cat => {
                                    const vals = favouritesData[cat.key];
                                    if (vals && vals.length > 0) {
                                        return <div className="pv-row" key={cat.key}><span>{cat.label}</span><strong>{vals.join(', ')}</strong></div>;
                                    }
                                    if (cat.key === 'hobbies') {
                                        return <div className="pv-row" key={cat.key}><span>Hobbies</span><strong>{profileData.hobbies || 'Not specified'}</strong></div>;
                                    }
                                    return null;
                                })}
                            </div>
                        </>
                    )}

                    {!loading && previewTab === 'looking' && (
                        <>
                            <div className="pv-card">
                                <h3>What {pronounSubj} is looking for...</h3>
                                <p>{profileData.partnerPreference || 'These are the desired partner qualities.'}</p>
                            </div>

                            <div className="pv-card">
                                <h3>Basic Details</h3>
                                <div className="pv-row"><span>Height</span><strong>{preferenceData.prefHeightFrom && preferenceData.prefHeightTo ? `${preferenceData.prefHeightFrom} - ${preferenceData.prefHeightTo}` : "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Age</span><strong>{preferenceData.prefAgeFrom || '18'} to {preferenceData.prefAgeTo || '30'} Years</strong></div>
                                <div className="pv-row"><span>Marital Status</span><strong>{preferenceData.prefMaritalStatus || "Doesn't Matter"}</strong></div>
                                {(preferenceData.prefMaritalStatus && preferenceData.prefMaritalStatus.trim() !== 'Never Married') && (
                                    <div className="pv-row"><span>Having Children</span><strong>{preferenceData.prefHavingChildren || "Doesn't Matter"}</strong></div>
                                )}
                                <div className="pv-row"><span>Religion</span><strong>{preferenceData.prefReligion || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Mother Tongue</span><strong>{preferenceData.prefMotherTongue || "Doesn't Matter"}</strong></div>
                                {preferenceData.prefReligion?.trim() === 'Hindu' && (
                                    <div className="pv-row"><span>Horoscope</span><strong>{preferenceData.prefHoroscope || "Doesn't Matter"}</strong></div>
                                )}
                                <div className="pv-row"><span>Country</span><strong>{previewCountryPreference}</strong></div>
                                <div className="pv-row"><span>State</span><strong>{preferenceData.prefState || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>City</span><strong>{preferenceData.prefCity || "Doesn't Matter"}</strong></div>
                            </div>

                            <div className="pv-card">
                                <h3>Desired Education and Occupation</h3>
                                <div className="pv-row"><span>Educational Level</span><strong>{previewEducationPreference}</strong></div>
                                <div className="pv-row"><span>Occupation</span><strong>{previewOccupationPreference}</strong></div>
                                <div className="pv-row"><span>Employment Type</span><strong>{previewEmploymentPreference}</strong></div>
                                <div className="pv-row"><span>Earning</span><strong>{previewIncomePreference}</strong></div>
                            </div>

                            <div className="pv-card">
                                <h3>Partner's Family Details</h3>
                                <div className="pv-row"><span>Family Status</span><strong>{preferenceData.prefFamilyStatus || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Family Type</span><strong>{preferenceData.prefFamilyType || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Living with Parents</span><strong>{preferenceData.prefLivingWithParents || "Doesn't Matter"}</strong></div>
                            </div>

                            <div className="pv-card">
                                <h3>Partner's Lifestyle and Appearance</h3>
                                <div className="pv-row"><span>Drinking Habits</span><strong>{preferenceData.prefDrinking || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Dietary Habits</span><strong>{preferenceData.prefDietary || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Smoking Habits</span><strong>{preferenceData.prefSmoking || "Doesn't Matter"}</strong></div>
                                <div className="pv-row"><span>Special Cases</span><strong>{preferenceData.prefPhysicalStatus || "Doesn't Matter"}</strong></div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProfileView;
