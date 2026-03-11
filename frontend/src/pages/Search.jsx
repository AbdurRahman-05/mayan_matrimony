import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search as SearchIcon, User, Heart, Bookmark, Loader2, MapPin, Briefcase, GraduationCap, Sparkles, Star, X, MessageCircle, Languages, Clock, MoreVertical } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { showAlert, showConfirm } from '../components/GlobalModal';
import { countryStateCityMap } from '../data/locationData';
import { searchProfiles, searchProfileById, sendInterest, shortlistProfile, ignoreProfile } from '../services/api';
import './Search.css';
import './Matches.css';

const Search = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('criteria');

    // Multi-select state (arrays) — empty = "Doesn't Matter"
    const [criteria, setCriteria] = useState({
        ageFrom: '18',
        ageTo: '21',
        heightFrom: "5'0\"",
        heightTo: "6'0\"",
        profileCreatedBy: [],
        maritalStatus: [],
        havingChildren: [],
        motherTongue: [],
        physicalStatus: [],
        religion: '',
        section: [],
        caste: [],
        dosham: [],
        star: [],
        raasi: [],
        education: [],
        occupation: [],
        employmentType: [],
        income: [],
        country: [],
        state: [],
        city: [],
        residentialStatus: [],
        smoking: [],
        drinking: [],
        foodHabits: []
    });

    const handleMultiChange = (name, selected) => {
        setCriteria(prev => ({ ...prev, [name]: selected }));
    };

    const handleSingleChange = (e) => {
        const { name, value } = e.target;
        setCriteria(prev => ({ ...prev, [name]: value }));
    };

    // When religion changes, reset section/caste
    const handleReligionChange = (e) => {
        const value = e.target.value;
        setCriteria(prev => ({ ...prev, religion: value, section: [], caste: [] }));
    };

    const religionCasteMap = {
        'Hindu': ['Brahmin', 'Gounder', 'Vanniyar', 'Thevar', 'Nadar', 'Chettiar', 'Yadav', 'Mudaliar', 'Naidu', 'Pillai', 'Reddy', 'Viswakarma', 'SC/ST', 'Caste No Bar'],
        'Muslim': ['Sunni', 'Shia', 'Pathan', 'Syed', 'Sheikh', 'Lebbai', 'Maraicar', 'Rowther', 'Mapila', 'Caste No Bar'],
        'Christian': ['Roman Catholic', 'Protestant', 'Pentecost', 'CSI', 'Latin Catholic', 'Syrian Catholic', 'Caste No Bar'],
        'Sikh': ['Jat', 'Ramgarhia', 'Ramdasia', 'Arora', 'Khatri', 'Caste No Bar'],
        'Jain': ['Shwetamber', 'Digamber', 'Caste No Bar'],
        'Buddhist': ['Neo Buddhist', 'Caste No Bar'],
        'Inter-Religion': ['Caste No Bar']
    };

    const religionSectionMap = {
        'Hindu': ['Saiva', 'Vaishnava', 'Smartha', 'Srivaishnava', 'Others'],
        'Muslim': ['Sunni', 'Shia', 'Others'],
        'Christian': ['Catholic', 'Protestant', 'Orthodox', 'Others'],
        'Sikh': ['Others'],
        'Jain': ['Others'],
        'Buddhist': ['Others'],
        'Inter-Religion': ['Others']
    };

    const casteOptionsForReligion = criteria.religion ? (religionCasteMap[criteria.religion] || []) : [];
    const sectionOptionsForReligion = criteria.religion ? (religionSectionMap[criteria.religion] || []) : [];

    const allCountries = Object.keys(countryStateCityMap);

    // States based on selected countries (or all if none selected)
    const activeCountries = criteria.country.length > 0 ? criteria.country : allCountries;
    let availableStates = [];
    activeCountries.forEach(c => {
        if (countryStateCityMap[c]) {
            availableStates.push(...Object.keys(countryStateCityMap[c]));
        }
    });
    availableStates = [...new Set(availableStates)];

    // Cities based on selected states
    let availableCities = [];
    if (criteria.state.length > 0) {
        criteria.state.forEach(s => {
            activeCountries.forEach(c => {
                if (countryStateCityMap[c] && countryStateCityMap[c][s]) {
                    availableCities.push(...countryStateCityMap[c][s]);
                }
            });
        });
    } else if (criteria.country.length > 0) {
        // If country selected but no state, show all cities for selected countries
        criteria.country.forEach(c => {
            if (countryStateCityMap[c]) {
                Object.values(countryStateCityMap[c]).forEach(cities => {
                    availableCities.push(...cities);
                });
            }
        });
    }
    availableCities = [...new Set(availableCities)];

    const isIndiaSelected = criteria.country.includes('India');
    const isOtherSelected = criteria.country.some(c => c !== 'India');
    const isNoCountrySelected = criteria.country.length === 0;

    const showStateCity = isIndiaSelected;
    const showResidentialStatus = isOtherSelected || isNoCountrySelected;

    // Option lists for each dropdown (no "Any" / "Doesn't Matter" — that's the default display when nothing selected)
    const optionLists = {
        profileCreatedBy: ['Self', 'Parents', 'Sibling', 'Friend', 'Relative', 'Others'],
        maritalStatus: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
        havingChildren: ['No', 'Yes'],
        motherTongue: ['Tamil', 'English', 'Telugu', 'Hindi', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Urdu', 'Punjabi', 'Odia'],
        physicalStatus: ['Normal', 'Physically Challenged'],
        religion: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Inter-Religion'],
        caste: ['Brahmin', 'Gounder', 'Vanniyar', 'Thevar', 'Nadar', 'Chettiar', 'Yadav', 'Mudaliar', 'Naidu', 'Pillai', 'Reddy', 'Viswakarma', 'SC/ST', 'Caste No Bar'],
        subCaste: [],
        dosham: ['Yes', 'No'],
        star: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
        raasi: ['Mesham (Aries)', 'Rishabam (Taurus)', 'Mithunam (Gemini)', 'Kadagam (Cancer)', 'Simmam (Leo)', 'Kanni (Virgo)', 'Thulam (Libra)', 'Viruchigam (Scorpio)', 'Dhanusu (Sagittarius)', 'Magaram (Capricorn)', 'Kumbam (Aquarius)', 'Meenam (Pisces)'],
        education: [
            "B.E/B.Tech", "B.Pharma", "M.E/M.Tech", "M.Pharma", "M.S. (Engineering)", "B.Arch", "M.Arch", "B.Des", "M.Des", "B.FAD", "B.FTech", "BID", "B.Tech LL.B.", "M.FTech", "MID", "MIB", "M.Plan", "MPH", "A.M.E.", "CISE", "ITIL",
            "MBA/PGDM", "BBA", "BHM", "BAM", "BBM", "BFM", "BFT", "B.H.A.", "BHMCT", "BHMTT", "BMS", "MAM", "MHA", "MMS", "MMM", "MTM", "MTA", "MHRM", "MBM", "Executive MBA", "CWM",
            "MBBS", "M.D.", "BAMS", "BHMS", "BDS", "M.S. (Medicine)", "MVSc.", "BVSc.", "MDS", "BPT", "MPT", "DM", "MCh", "BCVT", "BMLT", "BMRIT", "BMRT", "BNYS", "BOT", "B.O.Th", "BOPTM", "BPMT", "B.P.Ed", "B.P.E.S",
            "MCA", "BCA", "B.IT", "MCM", "PGDCA", "DCA", "ADCA",
            "B.Com", "CA", "CS", "ICWA", "M.Com", "CFA", "BBI", "BBE", "B.Com (Hons)", "MBE", "MBF", "MFC",
            "B.A", "B.Sc", "M.A", "M.Sc", "B.Ed", "M.Ed", "MSW", "BFA", "MFA", "BJMC", "MJMC", "B.Agri", "B.A. (Hons)", "BCT & CA", "B.El.Ed", "B.F.Sc.", "B.J", "B.Lib.I.Sc.", "B.Lib.Sc", "B.Litt", "ETT", "TTC", "P.P.T.T.C",
            "PhD", "M.Phil", "LL.D.", "D.Litt", "Pharm.D", "FPM",
            "Diploma/Certificate", "Class XII", "Trade School", "Class X or Below",
            "Other"
        ],
        occupation: ["Software Professional", "Manager", "Engineer", "Doctor", "Teacher", "Banker", "Civil Services", "Business Owner", "Accountant", "Administrator", "Architect", "Consultant", "Designer", "Lawyer", "Marketing Professional", "Pharmacist", "Sales Professional", "Writer/Editor", "Other"],
        employmentType: ["Private Sector", "Government/Public Sector", "Civil Service", "Defense", "Business/Self Employed", "Not Working", "Student", "Retired", "Other"],
        income: ['No Income', '0 - 1 Lakh', '1 - 3 Lakhs', '3 - 5 Lakhs', '5 - 7 Lakhs', '7 - 10 Lakhs', '10 - 15 Lakhs', '15 - 20 Lakhs', '20 - 30 Lakhs', '30 Lakhs and above'],
        country: allCountries,
        state: availableStates,
        city: availableCities,
        residentialStatus: ['Citizenship', 'Permanent Resident', 'Work Permit', 'Student Visa', 'Temporary Visa'],
        smoking: ['No', 'Occasionally', 'Yes', 'Regularly'],
        drinking: ['No', 'Occasionally', 'Yes', 'Regularly'],
        foodHabits: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']
    };

    const placeholderMap = {
        profileCreatedBy: 'Search Profile created by',
        maritalStatus: 'Search Marital status',
        havingChildren: 'Search',
        motherTongue: 'Search Mother tongue',
        physicalStatus: 'Search Physical status',
        religion: 'Search Religion',
        section: 'Search Section',
        caste: 'Search Caste',
        dosham: 'Search Dosham',
        star: 'Search Star',
        raasi: 'Search Raasi',
        education: 'Search Higher education',
        occupation: 'Search Occupation',
        employmentType: 'Search Employment type',
        income: 'Search Annual income',
        country: 'Search Country',
        state: 'Search State',
        city: 'Search City',
        residentialStatus: 'Search Residential status',
        smoking: 'Search Smoking habits',
        drinking: 'Search Drinking habits',
        foodHabits: 'Search Food habits'
    };

    const [searchId, setSearchId] = useState('');
    const [foundProfile, setFoundProfile] = useState(null);
    const [searchAttempted, setSearchAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [totalMatches, setTotalMatches] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setShowResults(false);
        try {
            const data = await searchProfiles(criteria);
            setSearchResults(data.profiles);
            setTotalMatches(data.total);
            setShowResults(true);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleIdSearch = async () => {
        setSearchAttempted(true);
        let queryId = searchId.trim().toUpperCase().replace(/^ID[\s-]*/i, '');
        if (queryId && !queryId.startsWith('SM-')) {
            queryId = `SM-${queryId}`;
        }
        if (!queryId || queryId === 'SM-') { setFoundProfile(null); return; }
        setLoading(true);
        try {
            const found = await searchProfileById(queryId);
            setFoundProfile(found);
        } catch (err) {
            console.error('ID Search failed', err);
            setFoundProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInterestAction = async (e, uniqueId) => {
        e.stopPropagation();
        try {
            await sendInterest(uniqueId, "I'm interested in your profile.");
            showAlert('Interest sent successfully.', 'Success');
        } catch (err) {
            showAlert(err.message || 'Failed to send interest', 'Error');
        }
    };

    const handleShortlistAction = async (e, uniqueId) => {
        e.stopPropagation();
        try {
            await shortlistProfile(uniqueId);
            showAlert('You have shortlisted this profile successfully.', 'Success');
        } catch (err) {
            showAlert(err.message || 'Failed to shortlist', 'Error');
        }
    };

    const handleIgnoreAction = async (e, uniqueId) => {
        e.stopPropagation();
        const confirmed = await showConfirm('Are you sure you want to ignore this profile? It will be hidden from your matches.', 'Confirm Action');
        if (confirmed) {
            try {
                await ignoreProfile(uniqueId);
                showAlert('You have ignored this profile.', 'Success');
            } catch (err) {
                showAlert(err.message || 'Failed to ignore profile', 'Error');
            }
        }
    };



    const ageOptions = [];
    for (let i = 18; i <= 70; i++) ageOptions.push(i);

    const heightOptions = [
        "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
        "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
        "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\"", "6'9\"",
        "7'0\""
    ];

    // Helper to render a multi-select row
    const renderMultiRow = (label, name) => (
        <div className="criteria-row">
            <label className="criteria-label">{label}</label>
            <div className="criteria-value">
                <MultiSelectDropdown
                    options={optionLists[name]}
                    selected={criteria[name]}
                    onChange={(sel) => handleMultiChange(name, sel)}
                    placeholder={placeholderMap[name]}
                />
            </div>
        </div>
    );

    return (
        <div className="search-page">
            <Navbar />
            <div className="search-container">
                <div className="search-panel">
                    {/* Tabs */}
                    <div className="search-tabs">
                        <button className={`search-tab ${activeTab === 'criteria' ? 'active' : ''}`} onClick={() => { setActiveTab('criteria'); setShowResults(false); }}>By Criteria</button>
                        <button className={`search-tab ${activeTab === 'id' ? 'active' : ''}`} onClick={() => { setActiveTab('id'); setFoundProfile(null); setSearchAttempted(false); setShowResults(false); }}>By Profile ID</button>
                    </div>

                    {/* Content */}
                    <div className="search-content">
                        {activeTab === 'criteria' && (
                            <div className="criteria-search">
                                <h2 className="criteria-title">Search profiles using the below criteria</h2>

                                {/* Basic Details */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Basic Details</h3></div>
                                    <div className="criteria-table">
                                        <div className="criteria-row">
                                            <label className="criteria-label">Age</label>
                                            <div className="criteria-value">
                                                <select name="ageFrom" value={criteria.ageFrom} onChange={handleSingleChange} className="criteria-select criteria-select-sm">
                                                    {ageOptions.map(a => <option key={`af-${a}`} value={a}>{a}</option>)}
                                                </select>
                                                <span className="criteria-to">to</span>
                                                <select name="ageTo" value={criteria.ageTo} onChange={handleSingleChange} className="criteria-select criteria-select-sm">
                                                    {ageOptions.map(a => <option key={`at-${a}`} value={a}>{a}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="criteria-row">
                                            <label className="criteria-label">Height</label>
                                            <div className="criteria-value">
                                                <select name="heightFrom" value={criteria.heightFrom} onChange={handleSingleChange} className="criteria-select criteria-select-sm">
                                                    {heightOptions.map(h => <option key={`hf-${h}`} value={h}>{h}</option>)}
                                                </select>
                                                <span className="criteria-to">to</span>
                                                <select name="heightTo" value={criteria.heightTo} onChange={handleSingleChange} className="criteria-select criteria-select-sm">
                                                    {heightOptions.map(h => <option key={`ht-${h}`} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {renderMultiRow('Profile Created By', 'profileCreatedBy')}
                                        {renderMultiRow('Marital Status', 'maritalStatus')}
                                        {!(criteria.maritalStatus.length === 1 && criteria.maritalStatus.includes('Never Married')) && renderMultiRow('Having Children', 'havingChildren')}
                                        {renderMultiRow('Mother Tongue', 'motherTongue')}
                                        {renderMultiRow('Physical Status', 'physicalStatus')}
                                    </div>
                                </div>

                                {/* Religious Details */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Religious Details</h3></div>
                                    <div className="criteria-table">
                                        <div className="criteria-row">
                                            <label className="criteria-label">Religion</label>
                                            <div className="criteria-value">
                                                <select name="religion" value={criteria.religion} onChange={handleReligionChange} className="criteria-select">
                                                    <option value="">Doesn't Matter</option>
                                                    <option value="Hindu">Hindu</option>
                                                    <option value="Muslim">Muslim</option>
                                                    <option value="Christian">Christian</option>
                                                    <option value="Sikh">Sikh</option>
                                                    <option value="Jain">Jain</option>
                                                    <option value="Buddhist">Buddhist</option>
                                                    <option value="Inter-Religion">Inter-Religion</option>
                                                </select>
                                            </div>
                                        </div>
                                        {criteria.religion && (
                                            <div className="criteria-row">
                                                <label className="criteria-label">Section</label>
                                                <div className="criteria-value">
                                                    <MultiSelectDropdown
                                                        options={sectionOptionsForReligion}
                                                        selected={criteria.section}
                                                        onChange={(sel) => handleMultiChange('section', sel)}
                                                        placeholder="Search Section"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {criteria.religion && (
                                            <div className="criteria-row">
                                                <label className="criteria-label">Caste</label>
                                                <div className="criteria-value">
                                                    <MultiSelectDropdown
                                                        options={casteOptionsForReligion}
                                                        selected={criteria.caste}
                                                        onChange={(sel) => handleMultiChange('caste', sel)}
                                                        placeholder="Search Caste"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Horoscope Details */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Horoscope Details</h3></div>
                                    <div className="criteria-table">
                                        {renderMultiRow('Horoscope', 'raasi')}
                                    </div>
                                </div>

                                {/* Professional Details */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Professional Details</h3></div>
                                    <div className="criteria-table">
                                        {renderMultiRow('Higher Education', 'education')}
                                        {renderMultiRow('Occupation', 'occupation')}
                                        {renderMultiRow('Employment Type', 'employmentType')}
                                        {renderMultiRow('Annual Income', 'income')}
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Location Details</h3></div>
                                    <div className="criteria-table">
                                        {renderMultiRow('Country', 'country')}
                                        {showStateCity && renderMultiRow('State', 'state')}
                                        {showStateCity && renderMultiRow('City', 'city')}
                                        {showResidentialStatus && renderMultiRow('Residential Status', 'residentialStatus')}
                                    </div>
                                </div>

                                {/* Lifestyle */}
                                <div className="criteria-section">
                                    <div className="section-header"><h3>Lifestyle</h3></div>
                                    <div className="criteria-table">
                                        {renderMultiRow('Smoking Habits', 'smoking')}
                                        {renderMultiRow('Drinking Habits', 'drinking')}
                                        {renderMultiRow('Food Habits', 'foodHabits')}
                                    </div>
                                </div>

                                {/* Bottom bar */}
                                <div className="criteria-bottom-bar">
                                    <span className="match-count">
                                        <strong>{loading ? 'Searching...' : `${totalMatches} match`}</strong> based on your criteria
                                    </span>
                                    <div className="search-actions-group">
                                        <button className="criteria-search-btn" onClick={handleSearch} disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : <SearchIcon size={16} />} Search
                                        </button>
                                    </div>
                                </div>

                                {showResults && searchResults.length > 0 && (
                                    <div className="match-results-list">
                                        <h3>Search Results ({searchResults.length})</h3>
                                        {searchResults.map(p => (
                                            <div key={p.uniqueId} className="match-card" onClick={() => navigate(`/profile/${p.uniqueId}`)}>
                                                <div className="match-card-top">
                                                    <div className="match-card-sidebar">
                                                        {p.photo || p.image ? (
                                                            <img src={p.photo || p.image} alt={p.fullName} />
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
                                                            {p.height} • {p.city || 'Location N/A'} • {p.religion}-{p.caste || p.sect || p.section || 'Community N/A'}
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
                                                    <button className="card-action-btn" onClick={(e) => handleSendInterestAction(e, p.uniqueId)}>
                                                        <Sparkles size={18} />
                                                        Interest
                                                    </button>
                                                    <button className="card-action-btn" onClick={(e) => handleShortlistAction(e, p.uniqueId)}>
                                                        <Star size={18} />
                                                        Shortlist
                                                    </button>
                                                    <button className="card-action-btn" onClick={(e) => handleIgnoreAction(e, p.uniqueId)}>
                                                        <X size={18} />
                                                        Ignore
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showResults && searchResults.length === 0 && !loading && (
                                    <div className="no-results-msg">
                                        <SearchIcon size={40} />
                                        <p>No profiles found matching your criteria. Try loosening your filters.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'id' && (
                            <div className="id-search-section">
                                <h2 className="criteria-title">Search by Profile ID</h2>
                                <p className="id-search-desc">Enter the unique Matrimony ID to view a specific member's profile.</p>
                                <div className="id-search-input-wrap">
                                    <input type="text" placeholder="Enter Matrimony ID (e.g. SM-A1B2C3)" value={searchId}
                                        onChange={(e) => { setSearchId(e.target.value.toUpperCase()); setSearchAttempted(false); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleIdSearch(); }}
                                        className="id-search-input" />
                                    <button className="criteria-search-btn" onClick={handleIdSearch}><SearchIcon size={16} /> Search</button>
                                </div>

                                {searchAttempted && foundProfile && (
                                    <div className="match-results-list" style={{ marginTop: '20px' }}>
                                        <div className="match-card" onClick={() => navigate(`/profile/${foundProfile.uniqueId}`)}>
                                            <div className="match-card-top">
                                                <div className="match-card-sidebar">
                                                    {foundProfile.photo || foundProfile.image ? (
                                                        <img src={foundProfile.photo || foundProfile.image} alt={foundProfile.fullName} />
                                                    ) : (
                                                        <div className="request-photo-overlay">
                                                            <button className="request-photo-btn">Request photo</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="match-card-main">
                                                    <span className="active-today-label">Active Today</span>
                                                    <h3 className="match-card-name">{foundProfile.fullName}, {foundProfile.age}</h3>
                                                    <div className="match-card-basics">
                                                        {foundProfile.height} • {foundProfile.city || 'Location N/A'} • {foundProfile.religion}-{foundProfile.caste || foundProfile.sect || foundProfile.section || 'Community N/A'}
                                                    </div>
                                                    <div className="match-card-details-grid">
                                                        <div className="detail-item">
                                                            <Briefcase size={16} />
                                                            <span>{foundProfile.occupation || 'Profession N/A'}</span> • <span>{foundProfile.income || 'No Income'}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <GraduationCap size={16} />
                                                            <span>{foundProfile.education || 'Education N/A'}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <Heart size={16} />
                                                            <span>{foundProfile.maritalStatus || 'Never Married'}</span>
                                                        </div>
                                                        {foundProfile.motherTongue && (
                                                            <div className="detail-item">
                                                                <Languages size={16} />
                                                                <span>{foundProfile.motherTongue}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="match-card-footer">
                                                <button className="card-action-btn" onClick={(e) => handleSendInterestAction(e, foundProfile.uniqueId)}>
                                                    <Sparkles size={18} />
                                                    Interest
                                                </button>
                                                <button className="card-action-btn" onClick={(e) => handleShortlistAction(e, foundProfile.uniqueId)}>
                                                    <Star size={18} />
                                                    Shortlist
                                                </button>
                                                <button className="card-action-btn" onClick={(e) => handleIgnoreAction(e, foundProfile.uniqueId)}>
                                                    <X size={18} />
                                                    Ignore
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {searchAttempted && !foundProfile && searchId.trim() && (
                                    <div className="id-not-found">
                                        <User size={40} color="#ef4444" />
                                        <h4>Profile Not Found</h4>
                                        <p>No profile found with ID "{(searchId.trim().toUpperCase().replace(/^ID[\s-]*/i, '').startsWith('SM-') ? searchId.trim().toUpperCase().replace(/^ID[\s-]*/i, '') : 'SM-' + searchId.trim().toUpperCase().replace(/^ID[\s-]*/i, ''))}". Please check the ID and try again.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};
export default Search;
