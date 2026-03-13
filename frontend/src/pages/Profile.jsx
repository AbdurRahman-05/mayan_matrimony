import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, LogOut, Edit2, X, Save, Camera, Eye, MapPin, Briefcase, GraduationCap, Heart, Calendar, Ruler, Globe2, BadgeCheck, Users, Cigarette, Wine, ChevronRight, MoreVertical, ArrowLeft, Plus, Maximize2, Trash2, Image, Search, Settings, Utensils, Puzzle, Zap, Languages, Music, MessagesSquare, ChefHat, Shirt, Clock, Loader2 } from 'lucide-react';
import FavouritesModal from '../components/FavouritesModal';
import PartnerBasicDetailsEditor from '../components/PartnerBasicDetailsEditor';
import PartnerEducationEditor from '../components/PartnerEducationEditor';
import PartnerReligionEditor from '../components/PartnerReligionEditor';
import PartnerFamilyEditor from '../components/PartnerFamilyEditor';
import PartnerLifestyleEditor from '../components/PartnerLifestyleEditor';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { showAlert } from '../components/GlobalModal';
import { getProfile, updateProfile, getFullProfile, updatePreferences, updateFavourites, syncPhotos, uploadPhoto, deletePhoto as apiDeletePhoto, setMainPhoto, logout as apiLogout } from '../services/api';
import './Profile.css';
import { getCountries, getStates, getCities, getCastes, getSects } from '../data/locationData';
import { profileManagedOptions, genderOptions, maritalOptions, booleanOptions, childrenCountOptions, physicalStatusOptions, disabilityOptions, heights, religions, horoscopes, educationOptions, employedInOptions, occupations, currencies, languages, incomes, residentialStatusOptions, dietOptions, smokingOptions, drinkingOptions, familyTypeOptions, familyStatusOptions, familyValuesOptions, fatherOccupationOptions, motherOccupationOptions, siblingCounts, familyIncomes, livingWithParentsOptions, settleAbroadOptions, getMarriedCounts } from '../data/sharedOptions';

const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('about');
    const [editingSection, setEditingSection] = useState(null);
    const [showPhotoManager, setShowPhotoManager] = useState(false);
    const [photoMenuIndex, setPhotoMenuIndex] = useState(null);
    const [fullViewPhoto, setFullViewPhoto] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownSearchTerm, setDropdownSearchTerm] = useState('');
    const [emailError, setEmailError] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [ageError, setAgeError] = useState('');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [activeFavModal, setActiveFavModal] = useState(null);
    const [showProfilePreview, setShowProfilePreview] = useState(false);
    const [previewTab, setPreviewTab] = useState('about');
    const [draftPhotos, setDraftPhotos] = useState([]);

    // Favourites data (multi-select categories) - initialize from cache
    const favDefaults = { hobbies: [], sports: [], movies: [], read: [], tvShows: [], destinations: [] };
    const cachedFavsStr = localStorage.getItem('userFavourites');
    const cachedFavs = cachedFavsStr ? (() => { try { return JSON.parse(cachedFavsStr); } catch (e) { return {}; } })() : {};
    const [favouritesData, setFavouritesData] = useState(
        cachedFavsStr ? { ...favDefaults, ...cachedFavs } : favDefaults
    );

    // Favourites options for each category
    const favouritesOptions = {
        hobbies: [
            'Collecting Stamps', 'Collecting Coins', 'Collecting antiques', 'Art / Handicraft',
            'Painting', 'Cooking', 'Photography', 'Film-making', 'Reading', 'Writing',
            'Gardening', 'Bird Watching', 'Travelling', 'Cycling', 'Fishing', 'Swimming',
            'Dancing', 'Singing', 'Playing Musical Instruments', 'Yoga', 'Meditation',
            'Blogging', 'DIY Crafts', 'Origami', 'Pottery', 'Knitting', 'Embroidery',
            'Astrology', 'Astronomy', 'Volunteering', 'Social Service'
        ],
        sports: [
            'Cricket', 'Football', 'Badminton', 'Tennis', 'Table Tennis', 'Hockey',
            'Volleyball', 'Basketball', 'Swimming', 'Running', 'Cycling', 'Kabaddi',
            'Wrestling', 'Boxing', 'Chess', 'Carrom', 'Gym / Fitness', 'Martial Arts',
            'Golf', 'Skating', 'Archery', 'Horse Riding', 'Snooker / Billiards',
            'Athletics', 'Yoga', 'Handball', 'Rugby'
        ],
        movies: [
            'Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi',
            'Fantasy', 'Documentary', 'Animation', 'Musical', 'Mystery', 'Historical',
            'Biographical', 'Adventure', 'Family', 'Crime', 'War', 'Western',
            'Superhero', 'Suspense', 'Psychological'
        ],
        read: [
            'Fiction', 'Non-Fiction', 'Mystery / Thriller', 'Romance', 'Science Fiction',
            'Fantasy', 'Biography', 'Self-Help', 'History', 'Poetry', 'Comics',
            'Religious / Spiritual', 'Business', 'Technology', 'Health & Wellness',
            'Travel', 'Cookbooks', 'Philosophy', 'Psychology', 'Political',
            'Classic Literature', 'Young Adult', 'Children\'s Books'
        ],
        tvShows: [
            'Drama', 'Comedy', 'Reality TV', 'News', 'Sports', 'Documentaries',
            'Crime / Thriller', 'Sci-Fi / Fantasy', 'Talk Shows', 'Cooking Shows',
            'Travel Shows', 'Animated', 'Game Shows', 'Soap Opera', 'Mini Series',
            'Stand-up Comedy', 'Music Shows', 'Religious / Spiritual', 'Horror',
            'Historical', 'Medical Drama', 'Legal Drama'
        ],
        destinations: [
            'Beach', 'Mountains', 'Historical Places', 'Pilgrimage', 'Adventure',
            'Wildlife', 'Islands', 'Countryside', 'City Tours', 'Cruise', 'Desert',
            'Forest', 'Backpacking', 'Luxury Resorts', 'Hill Stations', 'Lake / River',
            'Cultural Heritage', 'Waterfalls', 'Camping', 'Road Trips', 'International Travel',
            'Temple Towns', 'National Parks', 'Scenic Villages'
        ],
    };

    const favouritesCategories = [
        { key: 'hobbies', label: 'Hobbies' },
        { key: 'sports', label: 'Sports' },
        { key: 'movies', label: 'Movies' },
        { key: 'read', label: 'Read' },
        { key: 'tvShows', label: 'TV Shows' },
        { key: 'destinations', label: 'Destinations' },
    ];

    const [loading, setLoading] = useState(!localStorage.getItem('userProfile'));

    const handleFavDone = async (key, selectedItems) => {
        try {
            const updated = { ...favouritesData, [key]: selectedItems };
            setFavouritesData(updated);
            await updateFavourites(updated);
            setActiveFavModal(null);
        } catch (err) {
            showAlert('Failed to update favourites', 'Error');
        }
    };
    const [incomeSearchTerm, setIncomeSearchTerm] = useState('');

    // Initialize data from localStorage cache for instant display
    const cachedProfileStr = localStorage.getItem('userProfile');
    const cachedProfile = cachedProfileStr ? (() => { try { return JSON.parse(cachedProfileStr); } catch (e) { return {}; } })() : {};
    const uniqueId = cachedProfile.uniqueId || 'SM-000000';
    const userType = cachedProfile.userType || 'Normal';

    const profileDefaults = {
        uniqueId: uniqueId,
        fullName: 'Member Name',
        gender: '',
        dob: '',
        mobile: '',
        email: '',
        alternateMobile: '',
        isdCode: '+91',
        altIsdCode: '+91',
        mobilePrivacy: 'Visible to all paid members',
        religion: '',
        caste: '',
        horoscope: '',
        motherTongue: '',
        country: 'India',
        state: '',
        city: '',
        education: '',
        occupation: '',
        employmentType: '',
        currency: 'INR',
        income: '',
        height: '',
        maritalStatus: 'Never Married',
        smoking: '',
        drinking: '',
        physicalStatus: 'Normal',
        partnerPreference: '',
        about: '',
        profileFor: 'Self',
        photo: '',
        additionalPhotos: ['', '', ''],
        fatherOccupation: '',
        motherOccupation: '',
        numberOfBrothers: '',
        marriedBrothers: '',
        numberOfSisters: '',
        marriedSisters: '',
        familyStatus: '',
        familyType: '',
        familyIncome: '',
        livingWithParents: '',
        familyCountry: 'India',
        familyState: '',
        familyCity: '',
        organizationName: '',
        settlingAbroad: '',
        havingChildren: '',
        numberOfChildren: '',
        residentialStatus: '',
    };

    // Use cached data as initial state so UI shows data instantly
    const [profileData, setProfileData] = useState(
        cachedProfileStr ? { ...profileDefaults, ...cachedProfile } : profileDefaults
    );

    const prefDefaults = {
        prefAgeFrom: '',
        prefAgeTo: '',
        prefHeightFrom: '',
        prefHeightTo: '',
        prefReligion: '',
        prefCaste: '',
        prefEducation: '',
        prefOccupation: '',
        prefMaritalStatus: '',
        prefCountry: '',
        prefState: '',
        prefCity: '',
        prefMotherTongue: '',
        prefPhysicalStatus: '',
        prefEmploymentType: '',
        prefFamilyStatus: '',
        prefFamilyType: '',
        prefLivingWithParents: '',
        prefDietary: '',
        prefSmoking: '',
        prefDrinking: '',
    };
    const cachedPrefsStr = localStorage.getItem('userPreferences');
    const cachedPrefs = cachedPrefsStr ? (() => { try { return JSON.parse(cachedPrefsStr); } catch (e) { return {}; } })() : {};
    const [preferenceData, setPreferenceData] = useState(
        cachedPrefsStr ? { ...prefDefaults, ...cachedPrefs } : prefDefaults
    );

    const [editForm, setEditForm] = useState({});
    const [prefForm, setPrefForm] = useState({});
    const [activePrefEditor, setActivePrefEditor] = useState(null); // e.g. 'basic', 'education', etc.

    // Removed inline definition for shared options

    useEffect(() => {
        if (!showProfilePreview) return undefined;
        const previousOverflow = document.body.style.overflow;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowProfilePreview(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [showProfilePreview]);

    useEffect(() => {
        if (showPhotoManager && profileData) {
            const photos = [];
            if (profileData.photo) photos.push({ src: profileData.photo, isMain: true });
            if (profileData.additionalPhotos) {
                profileData.additionalPhotos.filter(p => p).forEach(p => photos.push({ src: p, isMain: false }));
            }
            setDraftPhotos(photos);
        }
    }, [showPhotoManager, profileData]);

    useEffect(() => {
        if (location.state?.openPreferences) {
            setActiveTab('looking');
        }
        if (location.state?.openPhotos) {
            setShowPhotoManager(true);
        }
        if (location.state?.openSection) {
            // Need to wait for profile data to load first
            const timer = setTimeout(() => {
                const section = location.state.openSection;
                setEditForm(prev => {
                    const savedProfile = localStorage.getItem('userProfile');
                    if (savedProfile) {
                        try {
                            return { ...JSON.parse(savedProfile) };
                        } catch (e) { }
                    }
                    return prev;
                });
                setEditingSection(section);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!localStorage.getItem('userProfile')) {
                setLoading(true);
            }
            try {
                // Single API call fetches profile + preferences + favourites
                const { profile, preferences, favourites } = await getFullProfile();
                setProfileData(prev => ({ ...prev, ...profile }));
                setPreferenceData(prev => ({ ...prev, ...preferences }));
                setFavouritesData(prev => ({ ...prev, ...favourites }));
            } catch (err) {
                console.error('Failed to load profile data', err);
                if (err.message === 'Access denied' || err.message === 'Invalid token') {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [navigate]);

    const handleLogout = () => {
        apiLogout();
        navigate('/');
    };

    const handleUpdateProfile = async () => {
        try {
            const payload = {
                ...profileData,
                ...preferenceData,
                ...favouritesData,
                fullName: profileData.fullName,
                userType: userType,
                uniqueId: profileData.uniqueId
            };
            await updateProfile(payload);
            showAlert('Profile updated successfully!', 'Success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert(error.message || 'Failed to update profile.', 'Error');
        }
    };

    const handleEditSection = (section) => {
        setEditForm({ ...profileData });
        setEditingSection(section);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'religion') {
            setEditForm(prev => ({ ...prev, religion: value, caste: '', sect: '' }));
        } else if (name === 'country') {
            setEditForm(prev => ({ ...prev, country: value, state: '', city: '', residentialStatus: value === 'India' ? '' : prev.residentialStatus }));
        } else if (name === 'state') {
            setEditForm(prev => ({ ...prev, state: value, city: '' }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddPhoto = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const MAX_PHOTOS = 3;
        if (draftPhotos.length >= MAX_PHOTOS) {
            showAlert('You can upload a maximum of 3 images only.', 'Warning');
            e.target.value = '';
            return;
        }

        const remainingSlots = MAX_PHOTOS - draftPhotos.length;
        const filesToProcess = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            showAlert(`You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}. Only the first ${remainingSlots} will be added.`, 'Warning');
        }

        setLoading(true);
        try {
            const newDrafts = [...draftPhotos];
            for (const file of filesToProcess) {
                const base64 = await convertFileToBase64(file);
                const isFirstPhoto = newDrafts.length === 0;
                newDrafts.push({ src: base64, isMain: isFirstPhoto });
            }
            setDraftPhotos(newDrafts);
        } catch (error) {
            console.error("Error converting photo", error);
            showAlert('Failed to process photo', 'Error');
        } finally {
            setLoading(false);
        }
        e.target.value = '';
    };

    const handleSetAsProfile = (index) => {
        const newDrafts = draftPhotos.map((p, i) => ({ ...p, isMain: i === index }));
        setDraftPhotos(newDrafts);
        setPhotoMenuIndex(null);
    };

    const handleDeletePhoto = (index) => {
        const newDrafts = [...draftPhotos];
        const deletingMain = newDrafts[index].isMain;
        newDrafts.splice(index, 1);

        if (deletingMain && newDrafts.length > 0) {
            newDrafts[0].isMain = true;
        }

        setDraftPhotos(newDrafts);
        setPhotoMenuIndex(null);
    };

    const handleSaveDraftPhotos = async () => {
        setLoading(true);
        try {
            await syncPhotos(draftPhotos);
            const fullData = await getFullProfile();
            setProfileData(prev => ({ ...prev, ...fullData.profile }));
            setPreferenceData(prev => ({ ...prev, ...fullData.preferences }));
            setFavouritesData(prev => ({ ...prev, ...fullData.favourites }));
            setShowPhotoManager(false);
            showAlert('Photos saved successfully!', 'Success');
        } catch (error) {
            console.error(error);
            showAlert('Failed to save photos.', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const togglePhotoMenu = (index) => {
        setPhotoMenuIndex(photoMenuIndex === index ? null : index);
    };

    // Get all photos for display outside photo manager
    const getAllPhotos = () => {
        const photos = [];
        if (profileData.photo) photos.push({ src: profileData.photo, isMain: true });
        if (profileData.additionalPhotos) {
            profileData.additionalPhotos.filter(p => p).forEach(p => photos.push({ src: p, isMain: false }));
        }
        return photos;
    };

    const validateMobile = (isd, number) => {
        if (!number) return false;
        const cleaned = number.replace(/\D/g, '');
        if (isd === '+91' || isd === '+1') {
            return cleaned.length === 10;
        }
        if (isd === '+44') {
            return cleaned.length === 10 || cleaned.length === 11;
        }
        return cleaned.length >= 7 && cleaned.length <= 15;
    };

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSaveSection = async () => {
        if (editingSection === 'basic' && editForm.dob) {
            const age = calculateAge(editForm.dob);
            if (age < 18) {
                setAgeError('Age should be above 18.');
                return;
            }
        }
        if (editingSection === 'contact') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (editForm.email && !emailRegex.test(editForm.email)) {
                setEmailError('Please provide a valid email ID.');
                return;
            }
            if (!validateMobile(editForm.isdCode || '+91', editForm.mobile)) {
                setMobileError('Incorrect phone number. Please check the number.');
                return;
            }
        }
        setEmailError('');
        setMobileError('');
        setAgeError('');
        setLoading(true);
        try {
            // Merge editForm into profileData so we send the complete profile, not partial data
            const mergedData = { ...profileData, ...editForm };
            await updateProfile(mergedData);
            const fullData = await getFullProfile();
            setProfileData(prev => ({ ...prev, ...fullData.profile }));
            setPreferenceData(prev => ({ ...prev, ...fullData.preferences }));
            setFavouritesData(prev => ({ ...prev, ...fullData.favourites }));
            setEditingSection(null);
            showAlert('Details updated successfully!', 'Success');
        } catch (err) {
            showAlert(err.message || 'Failed to update profile', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPreferenceClick = () => {
        setPrefForm({ ...preferenceData });
        setActivePrefEditor('generic');
    };

    const handlePrefFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'prefReligion') {
            setPrefForm(prev => ({ ...prev, prefReligion: value, prefCaste: '' }));
        } else if (name === 'prefCountry') {
            setPrefForm(prev => ({ ...prev, prefCountry: value, prefState: '', prefCity: '' }));
        } else if (name === 'prefState') {
            setPrefForm(prev => ({ ...prev, prefState: value, prefCity: '' }));
        } else {
            setPrefForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePrefSave = async () => {
        setLoading(true);
        try {
            await updatePreferences(prefForm);
            const fullData = await getFullProfile();
            setProfileData(prev => ({ ...prev, ...fullData.profile }));
            setPreferenceData(prev => ({ ...prev, ...fullData.preferences }));
            setFavouritesData(prev => ({ ...prev, ...fullData.favourites }));
            setActivePrefEditor(null);
        } catch (err) {
            showAlert(err.message || 'Failed to update preferences', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const calculateCompletion = () => {
        const fields = [
            'photo', 'fullName', 'gender', 'dob', 'height', 'maritalStatus', 'religion', 'motherTongue', 
            'about', 'profileFor', 'education', 'occupation', 'employmentType', 'familyType', 'familyStatus', 
            'fatherOccupation', 'motherOccupation', 'mobile', 'email', 'diet', 'smoking', 'drinking'
        ];
        let completed = 0;
        let total = fields.length + 1; // +1 for interests
        fields.forEach(field => {
            const value = profileData[field];
            if (value && value !== 'Not Specified' && value !== '') {
                completed++;
            }
        });
        
        // custom check for interests
        const favs = favouritesData || {};
        if (
            (favs.hobbies && favs.hobbies.length > 0) ||
            (favs.sports && favs.sports.length > 0) ||
            (favs.movies && favs.movies.length > 0) ||
            (favs.read && favs.read.length > 0) ||
            (favs.tvShows && favs.tvShows.length > 0) ||
            (favs.destinations && favs.destinations.length > 0)
        ) {
            completed++;
        }
        
        return Math.round((completed / total) * 100);
    };

    const completionPercentage = calculateCompletion();

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
                jan: 0, january: 0,
                feb: 1, february: 1,
                mar: 2, march: 2,
                apr: 3, april: 3,
                may: 4,
                jun: 5, june: 5,
                jul: 6, july: 6,
                aug: 7, august: 7,
                sep: 8, sept: 8, september: 8,
                oct: 9, october: 9,
                nov: 10, november: 10,
                dec: 11, december: 11,
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
    const previewDiet = profileData.diet || 'Not specified';
    const previewHobbies = (favouritesData.hobbies && favouritesData.hobbies.length > 0) ? favouritesData.hobbies.join(', ') : (profileData.hobbies || 'Not specified');
    const previewEducationPreference = preferenceData.prefEducation || "Doesn't Matter";
    const previewOccupationPreference = preferenceData.prefOccupation || "Doesn't Matter";
    const previewEmploymentPreference = preferenceData.prefEmploymentType || "Doesn't Matter";
    const previewIncomePreference = preferenceData.prefIncome || "Doesn't Matter";
    const previewCountryPreference = preferenceData.prefCountry || 'India';

    // Pronouns based on gender
    const pronounObj = profileData.gender === 'Female' ? 'her' : 'him';
    const pronounSubj = profileData.gender === 'Female' ? 'she' : 'he';
    const pronounPoss = profileData.gender === 'Female' ? 'her' : 'his';
    const pronounObjCap = profileData.gender === 'Female' ? 'Her' : 'Him';
    const pronounPossCap = profileData.gender === 'Female' ? 'Her' : 'His';

    const openProfilePreview = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        navigate('/profile-view');
    };

    // Section edit modal renderer
    const renderSectionModal = () => {
        if (!editingSection) return null;

        // Full-page editor for basic section
        if (editingSection === 'basic') {
            // Use shared maritalOptions
            const locationStr = [editForm.country, editForm.state, editForm.city].filter(Boolean).join(', ');
            const formatDob = (dob) => {
                if (!dob) return '';
                const d = new Date(dob);
                if (isNaN(d.getTime())) return dob;
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">Basic Details</h2>
                                <p className="bd-subtitle">Update these details to get suitable matches</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            {/* Name */}
                            <div className="bd-field">
                                <span className="bd-label">Name</span>
                                <input type="text" className="bd-value-input" name="fullName" value={editForm.fullName || ''} onChange={handleFormChange} />
                            </div>


                            {/* Gender */}
                            <div className="bd-field" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                                <span className="bd-label">Gender <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '5px' }}>(Cannot be changed)</span></span>
                                <div className="bd-field-row">
                                    <span className="bd-value" style={{ color: '#6b7280' }}>{editForm.gender || 'Not specified'}</span>
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="bd-field" style={{ position: 'relative' }}>
                                <span className="bd-label">Date of Birth</span>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={editForm.dob || ''}
                                        onChange={(e) => {
                                            handleFormChange(e);
                                            setAgeError('');
                                        }}
                                        style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', outline: 'none', color: '#1a2a3a', fontFamily: 'inherit' }}
                                    />
                                    {ageError && <span style={{ color: '#D4AF37', fontSize: '0.8rem', marginTop: '5px' }}>{ageError}</span>}
                                </div>
                            </div>

                            {/* Marital Status */}
                            <div className="bd-field bd-field-no-border">
                                <span className="bd-label">Marital Status</span>
                                <div className="bd-chips">
                                    {maritalOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.maritalStatus === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => {
                                                const newForm = { ...prev, maritalStatus: opt };
                                                if (opt === 'Never Married') {
                                                    newForm.havingChildren = '';
                                                    newForm.numberOfChildren = '';
                                                }
                                                return newForm;
                                            })}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Having Children - shown only if marital status ≠ Never Married */}
                            {editForm.maritalStatus && editForm.maritalStatus !== 'Never Married' && (
                                <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Having Children?', field: 'havingChildren', options: ['Yes', 'No'] })}>
                                    <span className="bd-label">Having Children?</span>
                                    <div className="bd-field-row">
                                        <span className="bd-value">{editForm.havingChildren || 'Select'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                </div>
                            )}

                            {/* Number of Children - shown only if havingChildren = Yes */}
                            {editForm.maritalStatus && editForm.maritalStatus !== 'Never Married' && editForm.havingChildren === 'Yes' && (
                                <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Number of Children', field: 'numberOfChildren', options: ['1', '2', '3', '4+'] })}>
                                    <span className="bd-label">Number of Children</span>
                                    <div className="bd-field-row">
                                        <span className="bd-value">{editForm.numberOfChildren || 'Select'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                </div>
                            )}

                            {/* Height */}
                            <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Height', field: 'height', options: ["4ft 5in (134 cm)", "4ft 6in (137 cm)", "4ft 7in (139 cm)", "4ft 8in (142 cm)", "4ft 9in (144 cm)", "4ft 10in (147 cm)", "4ft 11in (149 cm)", "5ft (152 cm)", "5ft 1in (154 cm)", "5ft 2in (157 cm)", "5ft 3in (160 cm)", "5ft 4in (162 cm)", "5ft 5in (165 cm)", "5ft 6in (167 cm)", "5ft 7in (170 cm)", "5ft 8in (172 cm)", "5ft 9in (175 cm)", "5ft 10in (177 cm)", "5ft 11in (180 cm)", "6ft (182 cm)", "6ft 1in (185 cm)", "6ft 2in (187 cm)"] })}>
                                <span className="bd-label">Height</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.height || 'Select Height'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Religion */}
                            <div className="bd-field" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                                <span className="bd-label">Religion <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '5px' }}>(Cannot be changed)</span></span>
                                <div className="bd-field-row">
                                    <span className="bd-value" style={{ color: '#6b7280' }}>{editForm.religion || 'Not specified'}</span>
                                </div>
                            </div>

                            {/* Sect */}
                            {editForm.religion && (
                                <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Sect', field: 'sect', options: getSects(editForm.religion) })}>
                                    <span className="bd-label">Sect</span>
                                    <div className="bd-field-row">
                                        <span className="bd-value">{editForm.sect || 'Select Sect'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                </div>
                            )}

                            {/* Caste */}
                            {editForm.religion && (
                                <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Caste', field: 'caste', options: getCastes(editForm.religion) })}>
                                    <span className="bd-label">Caste</span>
                                    <div className="bd-field-row">
                                        <span className="bd-value">{editForm.caste || 'Select Caste'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                </div>
                            )}

                            {/* Hindu Special Fields */}
                            {editForm.religion === 'Hindu' && (
                                <>
                                    <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Horoscope', field: 'horoscope', options: horoscopes })}>
                                        <span className="bd-label">Horoscope</span>
                                        <div className="bd-field-row">
                                            <span className="bd-value">{editForm.horoscope || 'Select Horoscope'}</span>
                                            <ChevronRight size={18} color="#9ca3af" />
                                        </div>
                                    </div>
                                    <div className="bd-field">
                                        <span className="bd-label">Time of Birth</span>
                                        <input type="time" className="bd-value-input" name="timeOfBirth" value={editForm.timeOfBirth || ''} onChange={handleFormChange} />
                                    </div>
                                    <div className="bd-field">
                                        <span className="bd-label">Place of Birth</span>
                                        <input type="text" className="bd-value-input" name="placeOfBirth" value={editForm.placeOfBirth || ''} onChange={handleFormChange} placeholder="Enter place of birth" />
                                    </div>
                                </>
                            )}

                            {/* Mother Tongue */}
                            <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Mother Tongue', field: 'motherTongue', options: languages })}>
                                <span className="bd-label">Mother Tongue</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.motherTongue || 'Select Language'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Current Location */}
                            <div className="bd-field bd-field-no-border">
                                <span className="bd-label" style={{ marginBottom: '10px' }}>Current Location</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="bd-field-row" onClick={() => setActiveDropdown({ title: 'Country', field: 'country', options: getCountries() })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                                        <span className="bd-value" style={{ flex: 1, color: editForm.country ? '#1a2a3a' : '#9ca3af' }}>{editForm.country || 'Country'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                    {editForm.country === 'India' ? (
                                        <>
                                            <div className="bd-field-row" onClick={() => editForm.country && setActiveDropdown({ title: 'State', field: 'state', options: getStates(editForm.country) })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: editForm.country ? 'pointer' : 'not-allowed', opacity: editForm.country ? 1 : 0.6 }}>
                                                <span className="bd-value" style={{ flex: 1, color: editForm.state ? '#1a2a3a' : '#9ca3af' }}>{editForm.state || 'State'}</span>
                                                <ChevronRight size={18} color="#9ca3af" />
                                            </div>
                                            <div className="bd-field-row" onClick={() => editForm.state && setActiveDropdown({ title: 'City', field: 'city', options: getCities(editForm.country, editForm.state) })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: editForm.state ? 'pointer' : 'not-allowed', opacity: editForm.state ? 1 : 0.6 }}>
                                                <span className="bd-value" style={{ flex: 1, color: editForm.city ? '#1a2a3a' : '#9ca3af' }}>{editForm.city || 'City'}</span>
                                                <ChevronRight size={18} color="#9ca3af" />
                                            </div>
                                        </>
                                    ) : editForm.country ? (
                                        <div className="bd-field-row" onClick={() => setActiveDropdown({ title: 'Residential Status', field: 'residentialStatus', options: ['Citizen', 'Permanent Resident', 'Work Permit', 'Student Visa', 'Temporary Visa', 'Other'] })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                                            <span className="bd-value" style={{ flex: 1, color: editForm.residentialStatus ? '#1a2a3a' : '#9ca3af' }}>{editForm.residentialStatus || 'Residential Status'}</span>
                                            <ChevronRight size={18} color="#9ca3af" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Annual Income */}
                            <div className="bd-field">
                                <span className="bd-label">Annual Income</span>
                                <div className="bd-field-row" onClick={() => setShowIncomeModal(true)} style={{ cursor: 'pointer' }}>
                                    <span className="bd-value">{editForm.income || 'Select Income'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>
                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>

                    {showIncomeModal && (
                        <div className="bd-income-modal">
                            <div className="bd-income-modal-inner">
                                <h3 className="bd-income-modal-title">
                                    <button className="bd-income-modal-close" onClick={() => setShowIncomeModal(false)}>
                                        <ArrowLeft size={22} />
                                    </button>
                                    Annual Income
                                </h3>
                                <div className="bd-income-search">
                                    <input
                                        type="text"
                                        placeholder="Type to search"
                                        value={incomeSearchTerm}
                                        onChange={(e) => setIncomeSearchTerm(e.target.value)}
                                    />
                                    <Search size={20} />
                                </div>
                                <div className="bd-income-list">
                                    {[
                                        "No Income", "Rs. 0 - 1 Lakh", "Rs. 1 - 2 Lakh", "Rs. 2 - 3 Lakh",
                                        "Rs. 3 - 4 Lakh", "Rs. 4 - 5 Lakh", "Rs. 5 - 7.5 Lakh", "Rs. 7.5 - 10 Lakh",
                                        "Rs. 10 - 15 Lakh", "Rs. 15 - 20 Lakh", "Rs. 20 - 30 Lakh", "Rs. 30 - 50 Lakh",
                                        "Rs. 50 - 75 Lakh", "Rs. 75 - 1 Crore", "Rs. 1 Crore & Above"
                                    ].filter(inc => inc.toLowerCase().includes(incomeSearchTerm.toLowerCase())).map(incomeStr => (
                                        <label key={incomeStr} className={`bd-income-option ${editForm.income === incomeStr ? 'selected' : ''}`} onClick={() => {
                                            setEditForm(prev => ({ ...prev, income: incomeStr }));
                                            setShowIncomeModal(false);
                                            setIncomeSearchTerm('');
                                        }}>
                                            <div className="bd-income-radio"></div>
                                            <span>{incomeStr}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Full-page editor for about section
        if (editingSection === 'about') {
            // Use shared options
            const aboutText = editForm.about || '';

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">About Me</h2>
                                <p className="bd-subtitle">Mention details about yourself, your personality & more</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            {/* About Me Text */}
                            <div className="bd-field bd-field-no-border">
                                <span className="bd-label">About Me</span>
                                <textarea
                                    className="bd-textarea"
                                    name="about"
                                    value={editForm.about || ''}
                                    onChange={handleFormChange}
                                    placeholder="Write about yourself, your personality, interests, and what makes you unique..."
                                    rows={6}
                                    maxLength={1000}
                                />
                                <div className="bd-char-count">
                                    <span className={aboutText.length < 100 ? 'bd-count-warn' : 'bd-count-ok'}>
                                        {aboutText.length}/100
                                    </span>
                                </div>
                            </div>

                            {/* Profile Managed By */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Profile Managed By</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {profileManagedOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.profileFor === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, profileFor: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Disability */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Disability?</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {disabilityOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${(editForm.disability || 'None') === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, disability: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            );
        }

        // Full-page editor for education section
        if (editingSection === 'education') {
            // Use shared educationOptions

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">Education</h2>
                                <p className="bd-subtitle">Update details about your educational background</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            {/* Highest Education */}
                            <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: 'Highest Education', field: 'education', options: educationOptions })}>
                                <span className="bd-label">Highest Education</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.education || 'Select Education'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* College */}
                            <div className="bd-field">
                                <span className="bd-label">College Name</span>
                                <input type="text" className="bd-value-input" name="ugCollege" value={editForm.ugCollege || ''} onChange={handleFormChange} placeholder="Enter your college name" />
                            </div>

                            {/* School Name */}
                            <div className="bd-field">
                                <span className="bd-label">School Name</span>
                                <input type="text" className="bd-value-input" name="schoolName" value={editForm.schoolName || ''} onChange={handleFormChange} placeholder="Enter your school name" />
                            </div>

                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            );
        }
        // Full-page editor for career section
        if (editingSection === 'career') {
            // Use shared options

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">Career</h2>
                                <p className="bd-subtitle">Update details about your professional background</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            {/* Employed In */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Employed In</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {employedInOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.employmentType === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, employmentType: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Occupation */}
                            <div className="bd-field" style={{ cursor: 'pointer', marginTop: '1.5rem' }} onClick={() => setActiveDropdown({ title: 'Occupation', field: 'occupation', options: occupations })}>
                                <span className="bd-label">Occupation</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.occupation || 'Select Occupation'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Organization Name */}
                            <div className="bd-field">
                                <span className="bd-label">Organisation Name</span>
                                <input
                                    type="text"
                                    className="bd-value-input"
                                    name="organizationName"
                                    value={editForm.organizationName || ''}
                                    onChange={handleFormChange}
                                    placeholder="Enter organisation name"
                                />
                            </div>

                            {/* Interested in settling abroad */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Interested in settling abroad?</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {settleAbroadOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.settlingAbroad === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, settlingAbroad: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (editingSection === 'family') {
            // Use shared options

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">About My Family</h2>
                                <p className="bd-subtitle" style={{ color: '#64748b' }}>Talk about your family members, values and background</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            {/* Family Status */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Family Status</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {familyStatusOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.familyStatus === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, familyStatus: opt }))}
                                            style={{ backgroundColor: editForm.familyStatus === opt ? '#fdf8e8' : '#fff', color: editForm.familyStatus === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.familyStatus === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '30px', padding: '10px 20px', fontSize: '0.95rem' }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Family Type */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Family Type</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {familyTypeOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.familyType === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, familyType: opt }))}
                                            style={{ backgroundColor: editForm.familyType === opt ? '#fdf8e8' : '#fff', color: editForm.familyType === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.familyType === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '30px', padding: '10px 20px', fontSize: '0.95rem' }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Living with parents */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Living with parents</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {livingWithParentsOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.livingWithParents === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, livingWithParents: opt }))}
                                            style={{ backgroundColor: editForm.livingWithParents === opt ? '#fdf8e8' : '#fff', color: editForm.livingWithParents === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.livingWithParents === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '30px', padding: '10px 20px', fontSize: '0.95rem' }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Family Income */}
                            <div className="bd-field" style={{ cursor: 'pointer', marginTop: '10px' }} onClick={() => setActiveDropdown({ title: "Family Income", field: 'familyIncome', options: familyIncomes })}>
                                <span className="bd-label">Family Income</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.familyIncome || 'Select Income'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Father's Occupation */}
                            <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: "Father's Occupation", field: 'fatherOccupation', options: fatherOccupationOptions })}>
                                <span className="bd-label">Father's Occupation</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.fatherOccupation || 'Select Occupation'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Mother's Occupation */}
                            <div className="bd-field" style={{ cursor: 'pointer' }} onClick={() => setActiveDropdown({ title: "Mother's Occupation", field: 'motherOccupation', options: motherOccupationOptions })}>
                                <span className="bd-label">Mother's Occupation</span>
                                <div className="bd-field-row">
                                    <span className="bd-value">{editForm.motherOccupation || 'Select Occupation'}</span>
                                    <ChevronRight size={18} color="#9ca3af" />
                                </div>
                            </div>

                            {/* Number of Brothers */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>No. of Brother(s)</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {siblingCounts.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.numberOfBrothers === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => {
                                                const newForm = { ...prev, numberOfBrothers: opt };
                                                if (opt === "0") newForm.marriedBrothers = "";
                                                return newForm;
                                            })}
                                            style={{ backgroundColor: editForm.numberOfBrothers === opt ? '#fdf8e8' : '#fff', color: editForm.numberOfBrothers === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.numberOfBrothers === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', fontSize: '0.95rem' }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Number of Married Brothers */}
                            {editForm.numberOfBrothers && editForm.numberOfBrothers !== "0" && (
                                <div className="bd-field bd-field-no-border" style={{ paddingTop: '1rem' }}>
                                    <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>No. of Married Brother(s)</span>
                                    <div className="bd-chips" style={{ marginTop: '10px' }}>
                                        {getMarriedCounts(editForm.numberOfBrothers).map(opt => (
                                            <button
                                                key={opt}
                                                className={`bd-chip ${editForm.marriedBrothers === opt ? 'active' : ''}`}
                                                onClick={() => setEditForm(prev => ({ ...prev, marriedBrothers: opt }))}
                                                style={{ backgroundColor: editForm.marriedBrothers === opt ? '#fdf8e8' : '#fff', color: editForm.marriedBrothers === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.marriedBrothers === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', fontSize: '0.95rem' }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Number of Sisters */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>No. of Sister(s)</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {siblingCounts.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.numberOfSisters === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => {
                                                const newForm = { ...prev, numberOfSisters: opt };
                                                if (opt === "0") newForm.marriedSisters = "";
                                                return newForm;
                                            })}
                                            style={{ backgroundColor: editForm.numberOfSisters === opt ? '#fdf8e8' : '#fff', color: editForm.numberOfSisters === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.numberOfSisters === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', fontSize: '0.95rem' }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Number of Married Sisters */}
                            {editForm.numberOfSisters && editForm.numberOfSisters !== "0" && (
                                <div className="bd-field bd-field-no-border" style={{ paddingTop: '1rem' }}>
                                    <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>No. of Married Sister(s)</span>
                                    <div className="bd-chips" style={{ marginTop: '10px' }}>
                                        {getMarriedCounts(editForm.numberOfSisters).map(opt => (
                                            <button
                                                key={opt}
                                                className={`bd-chip ${editForm.marriedSisters === opt ? 'active' : ''}`}
                                                onClick={() => setEditForm(prev => ({ ...prev, marriedSisters: opt }))}
                                                style={{ backgroundColor: editForm.marriedSisters === opt ? '#fdf8e8' : '#fff', color: editForm.marriedSisters === opt ? '#1a2a3a' : '#64748b', borderColor: editForm.marriedSisters === opt ? '#D4AF37' : '#e2e8f0', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', fontSize: '0.95rem' }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Family based out of */}
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
                                <span className="bd-label" style={{ marginBottom: '10px', fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Family based out of</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="bd-field-row" onClick={() => setActiveDropdown({ title: 'Family Country', field: 'familyCountry', options: getCountries() })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                                        <span className="bd-value" style={{ flex: 1, color: editForm.familyCountry ? '#1a2a3a' : '#9ca3af' }}>{editForm.familyCountry || 'Country'}</span>
                                        <ChevronRight size={18} color="#9ca3af" />
                                    </div>
                                    {editForm.familyCountry === 'India' && (
                                        <>
                                            <div className="bd-field-row" onClick={() => editForm.familyCountry && setActiveDropdown({ title: 'Family State', field: 'familyState', options: getStates(editForm.familyCountry) })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: editForm.familyCountry ? 'pointer' : 'not-allowed', opacity: editForm.familyCountry ? 1 : 0.6 }}>
                                                <span className="bd-value" style={{ flex: 1, color: editForm.familyState ? '#1a2a3a' : '#9ca3af' }}>{editForm.familyState || 'State'}</span>
                                                <ChevronRight size={18} color="#9ca3af" />
                                            </div>
                                            <div className="bd-field-row" onClick={() => editForm.familyState && setActiveDropdown({ title: 'Family City', field: 'familyCity', options: getCities(editForm.familyCountry, editForm.familyState) })} style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: editForm.familyState ? 'pointer' : 'not-allowed', opacity: editForm.familyState ? 1 : 0.6 }}>
                                                <span className="bd-value" style={{ flex: 1, color: editForm.familyCity ? '#1a2a3a' : '#9ca3af' }}>{editForm.familyCity || 'City'}</span>
                                                <ChevronRight size={18} color="#9ca3af" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (editingSection === 'contact') {
            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">Contact Details</h2>
                                <p className="bd-subtitle" style={{ color: '#64748b' }}>Update details that would help profiles get in touch with you</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            <div className="bd-field" style={{ paddingTop: '10px', cursor: 'not-allowed', opacity: 0.7 }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#64748b' }}>Email Id <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '5px' }}>(Cannot be changed)</span></span>
                                <input type="email" className="bd-value-input" name="email" value={editForm.email || ''} readOnly style={{ padding: '8px 0', borderBottom: 'none', color: '#6b7280', pointerEvents: 'none' }} />
                            </div>
                            <div className="bd-field" style={{ paddingTop: '10px', cursor: 'not-allowed', opacity: 0.7 }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#64748b' }}>Registered Mobile Number <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '5px' }}>(Linked to Account - Cannot be changed)</span></span>
                                <input type="text" className="bd-value-input" value={`+91 ${editForm.registeredMobile || ''}`} readOnly style={{ padding: '8px 0', borderBottom: 'none', color: '#6b7280', pointerEvents: 'none' }} />
                            </div>
                            <div className="bd-field">
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#64748b' }}>Contact Phone Number</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 0', borderBottom: mobileError ? '1px solid #dc2626' : 'none' }}>
                                    <div style={{ width: '45px', color: '#1a2a3a', fontWeight: '500', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center' }}>+91</div>
                                    <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }}></div>
                                    <input type="tel" className="bd-value-input" name="mobile" value={editForm.mobile || ''} onChange={(e) => { handleFormChange(e); setMobileError(''); }} placeholder="Enter contact mobile number" style={{ flex: 1 }} />
                                </div>
                                {mobileError && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{mobileError}</span>}
                            </div>
                            <div className="bd-field" style={{ borderBottom: 'none' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#64748b' }}>Alternate Number</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 0' }}>
                                    <div style={{ width: '45px', color: '#1a2a3a', fontWeight: '500', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center' }}>+91</div>
                                    <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }}></div>
                                    <input type="tel" className="bd-value-input" name="alternateMobile" value={editForm.alternateMobile || ''} onChange={handleFormChange} placeholder="Enter alternate number" style={{ flex: 1 }} />
                                </div>
                            </div>
                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>

                    </div>
                </div>
            );
        }

        if (editingSection === 'lifestyle') {
            // Use shared dietOptions, smokingOptions, drinkingOptions

            return (
                <div className="bd-overlay">
                    <div className="bd-container">
                        <div className="bd-header">
                            <button className="bd-back-btn" onClick={() => setEditingSection(null)}>
                                <ArrowLeft size={22} />
                            </button>
                            <div className="bd-header-text">
                                <h2 className="bd-title">Lifestyle & Interests</h2>
                                <p className="bd-subtitle">Update your personal habits</p>
                            </div>
                        </div>

                        <div className="bd-fields">
                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Dietary Habit</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {dietOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.diet === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, diet: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Drinking Habit</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {drinkingOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.drinking === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, drinking: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bd-field bd-field-no-border" style={{ paddingTop: '1.5rem' }}>
                                <span className="bd-label" style={{ fontSize: '0.95rem', color: '#1a2a3a', fontWeight: 600 }}>Smoking Habit</span>
                                <div className="bd-chips" style={{ marginTop: '10px' }}>
                                    {smokingOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={`bd-chip ${editForm.smoking === opt ? 'active' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, smoking: opt }))}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="bd-save-area">
                            <button className="bd-save-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Circular progress component
    const CircularProgress = ({ percentage }) => {
        const radius = 32;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        return (
            <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#D4AF37" strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{percentage}%</text>
            </svg>
        );
    };

    const renderDropdownModal = () => {
        if (!activeDropdown) return null;
        const searchEnabled = activeDropdown.options.length > 8;
        const visibleOptions = activeDropdown.options.filter(opt => {
            if (!searchEnabled || !dropdownSearchTerm) return true;
            const optStr = typeof opt === 'string' ? opt : (opt.label || opt.toString());
            return optStr.toLowerCase().includes(dropdownSearchTerm.toLowerCase());
        });

        return (
            <div className="bd-income-modal" style={{ zIndex: 1400 }}>
                <div className="bd-income-modal-inner">
                    <h3 className="bd-income-modal-title">
                        <button className="bd-income-modal-close" onClick={() => { setActiveDropdown(null); setDropdownSearchTerm(''); }}>
                            <ArrowLeft size={22} />
                        </button>
                        {activeDropdown.title}
                    </h3>
                    {searchEnabled && (
                        <div className="bd-income-search">
                            <input
                                type="text"
                                placeholder={`Search ${activeDropdown.title}`}
                                value={dropdownSearchTerm}
                                onChange={(e) => setDropdownSearchTerm(e.target.value)}
                            />
                            <Search size={20} />
                        </div>
                    )}
                    <div className="bd-income-list">
                        {visibleOptions.map((opt, idx) => {
                            const isObj = typeof opt === 'object';
                            const optVal = isObj ? opt.value : opt;
                            const optLabel = isObj ? opt.label : opt;
                            if (isObj && opt.isHeader) return <div key={optLabel + idx} style={{ padding: '10px 0', fontSize: '1.1rem', fontWeight: 600, color: '#1a2a3a', background: '#f8f9fa', paddingLeft: '8px', marginTop: '10px' }}>{optLabel}</div>;
                            if (!optVal && !optLabel) return null;

                            return (
                                <label key={optVal + idx} className={`bd-income-option ${editForm[activeDropdown.field] === optVal ? 'selected' : ''}`} onClick={() => {
                                    if (activeDropdown.field === 'country') {
                                        setEditForm(prev => ({ ...prev, country: optVal, state: '', city: '', residentialStatus: optVal === 'India' ? '' : prev.residentialStatus }));
                                    } else if (activeDropdown.field === 'state') {
                                        setEditForm(prev => ({ ...prev, state: optVal, city: '' }));
                                    } else if (activeDropdown.field === 'familyCountry') {
                                        setEditForm(prev => ({ ...prev, familyCountry: optVal, familyState: '', familyCity: '' }));
                                    } else if (activeDropdown.field === 'familyState') {
                                        setEditForm(prev => ({ ...prev, familyState: optVal, familyCity: '' }));
                                    } else if (activeDropdown.field === 'religion') {
                                        setEditForm(prev => ({ ...prev, religion: optVal, caste: '', sect: '' }));
                                    } else if (activeDropdown.field === 'havingChildren') {
                                        setEditForm(prev => {
                                            const newForm = { ...prev, havingChildren: optVal };
                                            if (optVal !== 'Yes') {
                                                newForm.numberOfChildren = '';
                                            }
                                            return newForm;
                                        });
                                    } else {
                                        setEditForm(prev => ({ ...prev, [activeDropdown.field]: optVal }));
                                    }
                                    setActiveDropdown(null);
                                    setDropdownSearchTerm('');
                                }}>
                                    <div className="bd-income-radio"></div>
                                    <span>{optLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="profile-page">
            <Navbar />

            {/* Full-page loading spinner */}
            {loading && (
                <div className="profile-loading-overlay">
                    <div className="profile-loading-spinner-wrapper">
                        <Loader2 size={48} className="profile-spinner-icon" />
                        <p className="profile-loading-text">Loading your profile...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <>

                    {/* Profile Hero Header */}
                    <div className="ep-hero">
                        <div className="ep-hero-inner">
                            <div className="ep-hero-photo">
                                {profileData.photo ? (
                                    <img src={profileData.photo} alt={profileData.fullName} />
                                ) : (
                                    <div className="ep-hero-photo-placeholder">
                                        <User size={80} color="#9ca3af" />
                                    </div>
                                )}
                            </div>
                            <div className="ep-hero-actions">
                                <button className="ep-add-photos-btn" onClick={() => setShowPhotoManager(true)}>
                                    <Camera size={16} />
                                    {getAllPhotos().length > 0 ? (
                                        <span className="ep-photo-count">{getAllPhotos().length}</span>
                                    ) : (
                                        ' Add Photos'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="ep-eye-btn"
                                    onClick={openProfilePreview}
                                    aria-label="View profile preview"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                            <div className="ep-hero-info">
                                <h1 className="ep-hero-name">{profileData.fullName}</h1>
                                <p className="ep-hero-id">ID - {profileData.uniqueId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="ep-container">
                        {/* Tabs */}
                        <div className="ep-tabs">
                            <button className={`ep-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About Me</button>
                            <button className={`ep-tab ${activeTab === 'looking' ? 'active' : ''}`} onClick={() => setActiveTab('looking')}>Looking For</button>
                        </div>

                        {activeTab === 'about' && (
                            <div className="ep-about-content">

                                {/* Basic Details */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Basic Details</h3>
                                            <p className="ep-section-subtitle">Brief outline of personal information</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('basic')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-detail-list">
                                        <div className="ep-detail-item">
                                            <Ruler size={18} className="ep-detail-icon" />
                                            <span>{profileData.height || 'Height not specified'}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Globe2 size={18} className="ep-detail-icon" />
                                            <span>{[profileData.religion, profileData.sect, profileData.caste, profileData.horoscope].filter(Boolean).join(' • ') || 'Religion not specified'}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ep-detail-icon"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                            <span>Mother Tongue is {profileData.motherTongue || 'not specified'}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <MapPin size={18} className="ep-detail-icon" />
                                            <span>{getLocationString()}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Briefcase size={18} className="ep-detail-icon" />
                                            <span>{profileData.income || 'No Income'}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Calendar size={18} className="ep-detail-icon" />
                                            <span>{formatDate(profileData.dob)}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Heart size={18} className="ep-detail-icon" />
                                            <span>
                                                {profileData.maritalStatus || 'Never Married'}
                                                {profileData.maritalStatus && profileData.maritalStatus !== 'Never Married' && profileData.havingChildren === 'Yes' && profileData.numberOfChildren && (
                                                    ` • ${profileData.numberOfChildren} Children`
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ep-detail-extra">
                                        <div className="ep-detail-item">
                                            <Users size={18} className="ep-detail-icon" />
                                            <span>Profile managed by {profileData.profileFor || 'Self'}</span>
                                        </div>
                                    </div>
                                    {(!profileData.height || !profileData.religion || !profileData.motherTongue || !profileData.country || !profileData.income || !profileData.dob || !profileData.maritalStatus) && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('basic')} style={{ margin: 0 }}>
                                                <Plus size={16} /> Add Basic Details
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* About Me */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">About Me</h3>
                                            <p className="ep-section-subtitle">Describe yourself in a few words</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('about')}><Edit2 size={18} /></button>
                                    </div>
                                    <div>
                                        {profileData.about ? (
                                            <p className="ep-about-text">{profileData.about}</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <p className="ep-about-text" style={{ fontStyle: 'italic', margin: 0 }}>Write something about yourself...</p>
                                                <button className="ep-empty-add-action" onClick={() => handleEditSection('about')}>
                                                    <Plus size={16} /> Add About Me
                                                </button>
                                            </div>
                                        )}
                                        {profileData.disability && profileData.disability !== 'None' && (
                                            <p className="ep-about-text" style={{ marginTop: '12px' }}><strong>Disability:</strong> {profileData.disability}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Education */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Education</h3>
                                            <p className="ep-section-subtitle">Showcase your educational qualification</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('education')}><Edit2 size={18} /></button>
                                    </div>
                                    {profileData.education || profileData.ugCollege || profileData.schoolName ? (
                                        <>
                                            {profileData.education && (
                                                <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                    <div className="ep-icon-circle"><GraduationCap size={20} /></div>
                                                    <div>
                                                        <strong>{profileData.education}</strong>
                                                        <p className="ep-sub-text">Degree</p>
                                                    </div>
                                                </div>
                                            )}
                                            {profileData.ugCollege && (
                                                <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                    <div className="ep-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></div>
                                                    <div>
                                                        <strong>{profileData.ugCollege}</strong>
                                                        <p className="ep-sub-text">College</p>
                                                    </div>
                                                </div>
                                            )}
                                            {profileData.schoolName && (
                                                <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                    <div className="ep-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg></div>
                                                    <div>
                                                        <strong>{profileData.schoolName}</strong>
                                                        <p className="ep-sub-text">School</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <p className="ep-empty-text" style={{ margin: 0 }}>No education details added yet</p>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('education')}>
                                                <Plus size={16} /> Add Education
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Career */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Career</h3>
                                            <p className="ep-section-subtitle">Give a glimpse of your professional life</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('career')}><Edit2 size={18} /></button>
                                    </div>
                                    {profileData.occupation ? (
                                        <>
                                            <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                <div className="ep-icon-circle"><Briefcase size={20} /></div>
                                                <div>
                                                    <strong>{profileData.occupation}</strong>
                                                    <p className="ep-sub-text">{profileData.employmentType || 'Employment type not specified'}</p>
                                                </div>
                                            </div>
                                            {profileData.organizationName && (
                                                <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                    <div className="ep-icon-circle"><BadgeCheck size={20} /></div>
                                                    <div>
                                                        <strong>{profileData.organizationName}</strong>
                                                        <p className="ep-sub-text">Organisation</p>
                                                    </div>
                                                </div>
                                            )}
                                            {profileData.settlingAbroad && (
                                                <div className="ep-detail-item" style={{ marginBottom: '12px' }}>
                                                    <div className="ep-icon-circle"><Globe2 size={20} /></div>
                                                    <div>
                                                        <strong>Settling Abroad: {profileData.settlingAbroad}</strong>
                                                        <p className="ep-sub-text">Preference</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <p className="ep-empty-text" style={{ margin: 0 }}>No career details added yet</p>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('career')}>
                                                <Plus size={16} /> Add Career Details
                                            </button>
                                        </div>
                                    )}
                                    {(!profileData.organizationName || !profileData.settlingAbroad) && profileData.occupation && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 12px 0' }}>Add Organisation Name, Thoughts on settling abroad</p>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('career')} style={{ margin: 0 }}>
                                                <Plus size={16} /> Add Missing Details
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Family */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Family</h3>
                                            <p className="ep-section-subtitle">Introduce your family members, values and background</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('family')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-detail-list">
                                        {profileData.fatherOccupation && (
                                            <div className="ep-detail-item"><Users size={18} className="ep-detail-icon" /><span>Father: {profileData.fatherOccupation}</span></div>
                                        )}
                                        {profileData.motherOccupation && (
                                            <div className="ep-detail-item"><Users size={18} className="ep-detail-icon" /><span>Mother: {profileData.motherOccupation}</span></div>
                                        )}
                                        {(profileData.numberOfBrothers || profileData.numberOfSisters) && (
                                            <div className="ep-detail-item"><Users size={18} className="ep-detail-icon" /><span>{profileData.numberOfBrothers || 0} Brothers, {profileData.numberOfSisters || 0} Sisters</span></div>
                                        )}
                                    </div>
                                    {!profileData.fatherOccupation && !profileData.motherOccupation && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '10px' }}>
                                            <p className="ep-empty-text" style={{ margin: 0 }}>No family details added yet</p>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('family')}>
                                                <Plus size={16} /> Add Family Details
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Contact */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Contact</h3>
                                            <p className="ep-section-subtitle">Details that would help profiles get in touch with you</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('contact')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-detail-list">
                                        <div className="ep-detail-item ep-contact-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ep-detail-icon"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                                <span style={{ fontSize: '1rem', color: '#1f2937' }}>{profileData.email || 'Add email'}</span>
                                            </div>
                                        </div>
                                        <div className="ep-detail-item ep-contact-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ep-detail-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                <span style={{ fontSize: '1rem', color: '#1f2937' }}>{profileData.mobile ? `${profileData.isdCode || '+91'} ${profileData.mobile}` : 'Add phone number'}</span>
                                            </div>
                                            <Settings size={20} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setShowPrivacyModal(true)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 12px 0' }}>Add Alternate Email, Alternate Mobile No.</p>
                                        <button className="ep-empty-add-action" onClick={() => handleEditSection('contact')} style={{ margin: 0 }}>
                                            <Plus size={16} /> Add Additional Contact
                                        </button>
                                    </div>
                                </div>

                                {/* My Lifestyle & Interests */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">My Lifestyle & Interests</h3>
                                            <p className="ep-section-subtitle">Give other profiles a glimpse of your favourite activities</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => handleEditSection('lifestyle')}><Edit2 size={18} /></button>
                                    </div>

                                    <h4 className="ep-subsection-title" style={{ marginTop: '24px' }}>Habits</h4>
                                    <div className="ep-habits-grid">
                                        <div className="ep-habit-card" onClick={() => handleEditSection('lifestyle')} style={{ borderRadius: '8px', padding: '24px 16px', alignItems: 'flex-start', textAlign: 'left', gap: '12px', border: profileData.drinking ? '1.5px solid #f5e6a3' : '1px solid #e5e7eb', backgroundColor: profileData.drinking ? '#fef9e7' : 'transparent' }}>
                                            <Wine size={24} color={profileData.drinking ? "#D4AF37" : "#9ca3af"} strokeWidth={profileData.drinking ? 2 : 1.5} />
                                            <span style={{ fontSize: '0.9rem', color: profileData.drinking ? '#D4AF37' : '#64748b', fontWeight: profileData.drinking ? '600' : '500' }}>{profileData.drinking ? `Drinking: ${profileData.drinking}` : 'Add Drinking Habits'}</span>
                                        </div>
                                        <div className="ep-habit-card" onClick={() => handleEditSection('lifestyle')} style={{ borderRadius: '8px', padding: '24px 16px', alignItems: 'flex-start', textAlign: 'left', gap: '12px', border: profileData.diet ? '1.5px solid #f5e6a3' : '1px solid #e5e7eb', backgroundColor: profileData.diet ? '#fef9e7' : 'transparent' }}>
                                            <Utensils size={24} color={profileData.diet ? "#D4AF37" : "#9ca3af"} strokeWidth={profileData.diet ? 2 : 1.5} />
                                            <span style={{ fontSize: '0.9rem', color: profileData.diet ? '#D4AF37' : '#64748b', fontWeight: profileData.diet ? '600' : '500' }}>{profileData.diet ? `Diet: ${profileData.diet}` : 'Add Dietary Habits'}</span>
                                        </div>
                                        <div className="ep-habit-card" onClick={() => handleEditSection('lifestyle')} style={{ borderRadius: '8px', padding: '24px 16px', alignItems: 'flex-start', textAlign: 'left', gap: '12px', border: profileData.smoking ? '1.5px solid #f5e6a3' : '1px solid #e5e7eb', backgroundColor: profileData.smoking ? '#fef9e7' : 'transparent' }}>
                                            <Cigarette size={24} color={profileData.smoking ? "#D4AF37" : "#9ca3af"} strokeWidth={profileData.smoking ? 2 : 1.5} />
                                            <span style={{ fontSize: '0.9rem', color: profileData.smoking ? '#D4AF37' : '#64748b', fontWeight: profileData.smoking ? '600' : '500' }}>{profileData.smoking ? `Smoking: ${profileData.smoking}` : 'Add Smoking Habits'}</span>
                                        </div>
                                    </div>

                                    <h4 className="ep-subsection-title" style={{ marginTop: '32px' }}>My Favourites</h4>
                                    <div className="fav-categories-list">
                                        {favouritesCategories.map(cat => (
                                            <div
                                                key={cat.key}
                                                className="fav-category-item"
                                                onClick={() => setActiveFavModal(cat.key)}
                                            >
                                                <span className="fav-category-label">{cat.label}</span>
                                                {favouritesData[cat.key] && favouritesData[cat.key].length > 0 ? (
                                                    <span className="fav-category-values">
                                                        {favouritesData[cat.key].join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="fav-category-empty">Tap to add</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {(!profileData.drinking || !profileData.diet || !profileData.smoking) && (
                                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <button className="ep-empty-add-action" onClick={() => handleEditSection('lifestyle')} style={{ margin: 0 }}>
                                                <Plus size={16} /> Add Lifestyle Details
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Update Profile */}
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <button className="btn btn-outline" onClick={handleLogout} style={{ color: '#D4AF37', borderColor: '#D4AF37' }}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'looking' && (
                            <div className="ep-about-content">

                                {/* Partner's Basic Details */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Partner's Basic Details</h3>
                                            <p className="ep-section-subtitle">Basic preferences for your life partner</p>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => setActivePrefEditor('basic')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-detail-list">
                                        <div className="ep-detail-item">
                                            <Calendar size={18} className="ep-detail-icon" />
                                            <span>{preferenceData.prefAgeFrom && preferenceData.prefAgeTo ? `${preferenceData.prefAgeFrom} years - ${preferenceData.prefAgeTo} years` : "Doesn't Matter"}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Ruler size={18} className="ep-detail-icon" />
                                            <span>{preferenceData.prefHeightFrom && preferenceData.prefHeightTo ? `${preferenceData.prefHeightFrom} - ${preferenceData.prefHeightTo}` : "Doesn't Matter"}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <MapPin size={18} className="ep-detail-icon" />
                                            <span>{preferenceData.prefCountry || "Doesn't Matter"}</span>
                                        </div>
                                        <div className="ep-detail-item">
                                            <Heart size={18} className="ep-detail-icon" />
                                            <span>{preferenceData.prefMaritalStatus || "Doesn't Matter"}</span>
                                        </div>
                                        {(preferenceData.prefMaritalStatus && preferenceData.prefMaritalStatus.trim() !== 'Never Married') && (
                                            <div className="ep-detail-item">
                                                <Users size={18} className="ep-detail-icon" />
                                                <span>Having Children: {preferenceData.prefHavingChildren || "Doesn't Matter"}</span>
                                            </div>
                                        )}
                                        <div className="ep-detail-item">
                                            <Users size={18} className="ep-detail-icon" />
                                            <span>Profile managed by {profileData.profileFor || "Doesn't Matter"}</span>
                                        </div>
                                    </div>
                                </div>


                                {/* Partner's Education and Occupation */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Partner's Education and Occupation</h3>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => setActivePrefEditor('education')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-pref-list">
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><GraduationCap size={20} /></div>
                                            <div>
                                                <strong>Highest degree achieved</strong>
                                                <p className="ep-sub-text">{preferenceData.prefEducation || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Briefcase size={20} /></div>
                                            <div>
                                                <strong>Occupation could be</strong>
                                                <p className="ep-sub-text">{preferenceData.prefOccupation || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><BadgeCheck size={20} /></div>
                                            <div>
                                                <strong>Employment type</strong>
                                                <p className="ep-sub-text">{preferenceData.prefEmploymentType || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row" style={{ borderBottom: 'none' }}>
                                            <div className="ep-icon-circle">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                            </div>
                                            <div>
                                                <strong>Should be earning</strong>
                                                <p className="ep-sub-text">{preferenceData.prefIncome || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Partner's Religion and Ethnicity */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Partner's Religion and Ethnicity</h3>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => setActivePrefEditor('religion')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-pref-list">
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Globe2 size={20} /></div>
                                            <div>
                                                <strong>Religion</strong>
                                                <p className="ep-sub-text">{preferenceData.prefReligion || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" /></svg>
                                            </div>
                                            <div>
                                                <strong>Sect</strong>
                                                <p className="ep-sub-text">{preferenceData.prefSect || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path d="M7 17h10" /></svg>
                                            </div>
                                            <div>
                                                <strong>Caste</strong>
                                                <p className="ep-sub-text">{preferenceData.prefCaste || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row" style={{ borderBottom: (preferenceData.prefReligion?.trim() === 'Hindu') ? '1px solid #f0f0f0' : 'none' }}>
                                            <div className="ep-icon-circle">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            </div>
                                            <div>
                                                <strong>Mother Tongue</strong>
                                                <p className="ep-sub-text">{preferenceData.prefMotherTongue || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        {preferenceData.prefReligion?.trim() === 'Hindu' && (
                                            <div className="ep-pref-row" style={{ borderBottom: 'none' }}>
                                                <div className="ep-icon-circle">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                                </div>
                                                <div>
                                                    <strong>Horoscope</strong>
                                                    <p className="ep-sub-text">{preferenceData.prefHoroscope || "Doesn't Matter"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Partner's Family Details */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Partner's Family Details</h3>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => setActivePrefEditor('family')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-pref-list">
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Users size={20} /></div>
                                            <div>
                                                <strong>Family Status</strong>
                                                <p className="ep-sub-text">{preferenceData.prefFamilyStatus || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Users size={20} /></div>
                                            <div>
                                                <strong>Family Type</strong>
                                                <p className="ep-sub-text">{preferenceData.prefFamilyType || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row" style={{ borderBottom: 'none' }}>
                                            <div className="ep-icon-circle"><Users size={20} /></div>
                                            <div>
                                                <strong>Living with Parents</strong>
                                                <p className="ep-sub-text">{preferenceData.prefLivingWithParents || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Partner's Lifestyle and Appearance */}
                                <div className="ep-section-card">
                                    <div className="ep-section-header">
                                        <div>
                                            <h3 className="ep-section-title">Partner's Lifestyle and Appearance</h3>
                                        </div>
                                        <button className="ep-edit-btn" onClick={() => setActivePrefEditor('lifestyle')}><Edit2 size={18} /></button>
                                    </div>
                                    <div className="ep-pref-list">
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Wine size={20} /></div>
                                            <div>
                                                <strong>Drinking Habits</strong>
                                                <p className="ep-sub-text">{preferenceData.prefDrinking || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Utensils size={20} /></div>
                                            <div>
                                                <strong>Dietary Habits</strong>
                                                <p className="ep-sub-text">{preferenceData.prefDietary || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row">
                                            <div className="ep-icon-circle"><Cigarette size={20} /></div>
                                            <div>
                                                <strong>Smoking Habits</strong>
                                                <p className="ep-sub-text">{preferenceData.prefSmoking || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                        <div className="ep-pref-row" style={{ borderBottom: 'none' }}>
                                            <div className="ep-icon-circle">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                                            </div>
                                            <div>
                                                <strong>Special Cases</strong>
                                                <p className="ep-sub-text">{preferenceData.prefPhysicalStatus || "Doesn't Matter"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Update Profile (Preferences) */}
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <button className="btn btn-outline" onClick={handleUpdateProfile} style={{ color: '#c49b63', borderColor: '#c49b63' }}>
                                        <Save size={16} /> Update Profile
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {showProfilePreview && createPortal(
                        <div
                            className="ppv-overlay"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) {
                                    setShowProfilePreview(false);
                                }
                            }}
                        >
                            <div className="ppv-container">
                                <div className="ppv-topbar">
                                    <button type="button" className="ppv-back-btn" onClick={() => setShowProfilePreview(false)} aria-label="Close preview">
                                        <ArrowLeft size={24} />
                                    </button>
                                </div>

                                <div className="ppv-hero">
                                    <div className="ppv-hero-main">
                                        <div className="ppv-hero-photo">
                                            {profileData.photo ? (
                                                <img src={profileData.photo} alt={profileData.fullName || 'Profile'} />
                                            ) : (
                                                <div className="ppv-photo-placeholder">
                                                    <User size={88} color="#6b7c8e" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ppv-hero-text">
                                            <h2>{profileData.fullName || 'Member Name'}{previewAge ? `, ${previewAge}` : ''}</h2>
                                            <p>ID - {profileData.uniqueId || uniqueId}</p>
                                        </div>
                                    </div>
                                    <div className="ppv-managed-strip">
                                        Profile is managed by {profileData.profileFor || 'Self'}
                                    </div>
                                    <div className="ppv-tabs">
                                        <button type="button" className={`ppv-tab ${previewTab === 'about' ? 'active' : ''}`} onClick={() => setPreviewTab('about')}>About {pronounObj}</button>
                                        <button type="button" className={`ppv-tab ${previewTab === 'family' ? 'active' : ''}`} onClick={() => setPreviewTab('family')}>{pronounPossCap} Family</button>
                                        <button type="button" className={`ppv-tab ${previewTab === 'looking' ? 'active' : ''}`} onClick={() => setPreviewTab('looking')}>What {pronounSubj} is looking for</button>
                                    </div>
                                </div>

                                <div className="ppv-content">
                                    {previewTab === 'about' && (
                                        <>
                                            <div className="ppv-quick-grid">
                                                <div className="ppv-quick-item"><Ruler size={18} /><span>{profileData.height || 'Not specified'}</span></div>
                                                <div className="ppv-quick-item"><MapPin size={18} /><span>{getLocationString()}</span></div>
                                                <div className="ppv-quick-item"><Globe2 size={18} /><span>{previewReligionText}</span></div>
                                                <div className="ppv-quick-item"><Briefcase size={18} /><span>{profileData.income || 'No Income'}</span></div>
                                                <div className="ppv-quick-item"><Languages size={18} /><span>Mother tongue is {profileData.motherTongue || 'not specified'}</span></div>
                                                <div className="ppv-quick-item">
                                                    <Heart size={18} />
                                                    <span>
                                                        {profileData.maritalStatus || 'Never Married'}
                                                        {profileData.maritalStatus && profileData.maritalStatus !== 'Never Married' && profileData.havingChildren === 'Yes' && profileData.numberOfChildren && (
                                                            ` • ${profileData.numberOfChildren} Children`
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="ppv-quick-item"><Calendar size={18} /><span>{previewDobText}</span></div>
                                                {profileData.timeOfBirth && (
                                                    <div className="ppv-quick-item"><Clock size={18} /><span>{profileData.timeOfBirth}</span></div>
                                                )}
                                                {profileData.placeOfBirth && (
                                                    <div className="ppv-quick-item"><MapPin size={18} /><span>Born in {profileData.placeOfBirth}</span></div>
                                                )}
                                            </div>

                                            <div className="ppv-card">
                                                <h3>About {pronounObj}</h3>
                                                <p>{profileData.about || 'No description added yet.'}</p>
                                                {profileData.disability && profileData.disability !== 'None' && (
                                                    <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Disability:</strong> {profileData.disability}</p>
                                                )}
                                            </div>

                                            <div className="ppv-card">
                                                <h3>{pronounPossCap} Education</h3>
                                                <p>{profileData.education || 'Not specified'}</p>
                                                {profileData.ugCollege && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>College:</strong> {profileData.ugCollege}</p>}
                                                {profileData.schoolName && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>School:</strong> {profileData.schoolName}</p>}
                                            </div>

                                            <div className="ppv-card">
                                                <h3>{pronounPossCap} Career</h3>
                                                <p><strong>Occupation:</strong> {profileData.occupation || 'Not specified'}</p>
                                                <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Employment Type:</strong> {profileData.employmentType || 'Not specified'}</p>
                                                {profileData.organizationName && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Organization:</strong> {profileData.organizationName}</p>}
                                                {profileData.settlingAbroad && <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#4b5563' }}><strong>Interested in settling abroad?:</strong> {profileData.settlingAbroad}</p>}
                                            </div>
                                        </>
                                    )}

                                    {previewTab === 'family' && (
                                        <>
                                            <div className="ppv-card">
                                                <h3>{pronounPossCap} Family</h3>
                                                <div className="ppv-row"><span>Family Type</span><strong>{previewFamilyType}</strong></div>
                                                <div className="ppv-row"><span>Based Out Of</span><strong>{previewFamilyLocation}</strong></div>
                                                <div className="ppv-row"><span>Family Status</span><strong>{profileData.familyStatus || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Living With Parents</span><strong>{profileData.livingWithParents || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Family Income</span><strong>{profileData.familyIncome || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Father</span><strong>{profileData.fatherOccupation || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Mother</span><strong>{profileData.motherOccupation || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Siblings</span><strong>{previewBrothers || 0} Brothers, {previewSisters || 0} Sisters</strong></div>
                                                <div className="ppv-row"><span>Married Siblings</span><strong>{previewMarriedBrothers || 0} Brothers, {previewMarriedSisters || 0} Sisters</strong></div>
                                            </div>

                                            <div className="ppv-card">
                                                <h3>{pronounPossCap} Lifestyle and Interests</h3>
                                                <div className="ppv-row"><span>Diet</span><strong>{previewDiet}</strong></div>
                                                <div className="ppv-row"><span>Drinking</span><strong>{profileData.drinking || 'Not specified'}</strong></div>
                                                <div className="ppv-row"><span>Smoking</span><strong>{profileData.smoking || 'Not specified'}</strong></div>
                                                {favouritesCategories.map(cat => {
                                                    const vals = favouritesData[cat.key];
                                                    if (vals && vals.length > 0) {
                                                        return <div className="ppv-row" key={cat.key}><span>{cat.label}</span><strong>{vals.join(', ')}</strong></div>;
                                                    }
                                                    // Fallback for Hobbies if missing in favouritesData
                                                    if (cat.key === 'hobbies') {
                                                        return <div className="ppv-row" key={cat.key}><span>Hobbies</span><strong>{profileData.hobbies || 'Not specified'}</strong></div>;
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {previewTab === 'looking' && (
                                        <>
                                            <div className="ppv-card">
                                                <h3>What {pronounSubj} is looking for...</h3>
                                                <p>{profileData.partnerPreference || 'These are the desired partner qualities.'}</p>
                                            </div>

                                            <div className="ppv-card">
                                                <h3>Basic Details</h3>
                                                <div className="ppv-row"><span>Height</span><strong>{preferenceData.prefHeightFrom && preferenceData.prefHeightTo ? `${preferenceData.prefHeightFrom} - ${preferenceData.prefHeightTo}` : "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Age</span><strong>{preferenceData.prefAgeFrom || '18'} to {preferenceData.prefAgeTo || '30'} Years</strong></div>
                                                <div className="ppv-row"><span>Marital Status</span><strong>{preferenceData.prefMaritalStatus || "Doesn't Matter"}</strong></div>
                                                {(preferenceData.prefMaritalStatus && preferenceData.prefMaritalStatus.trim() !== 'Never Married') && (
                                                    <div className="ppv-row"><span>Having Children</span><strong>{preferenceData.prefHavingChildren || "Doesn't Matter"}</strong></div>
                                                )}
                                                <div className="ppv-row"><span>Religion</span><strong>{preferenceData.prefReligion || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Mother Tongue</span><strong>{preferenceData.prefMotherTongue || "Doesn't Matter"}</strong></div>
                                                {preferenceData.prefReligion?.trim() === 'Hindu' && (
                                                    <div className="ppv-row"><span>Horoscope</span><strong>{preferenceData.prefHoroscope || "Doesn't Matter"}</strong></div>
                                                )}
                                                <div className="ppv-row"><span>Country</span><strong>{previewCountryPreference}</strong></div>
                                                <div className="ppv-row"><span>State</span><strong>{preferenceData.prefState || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>City</span><strong>{preferenceData.prefCity || "Doesn't Matter"}</strong></div>
                                            </div>

                                            <div className="ppv-card">
                                                <h3>Desired Education and Occupation</h3>
                                                <div className="ppv-row"><span>Educational Level</span><strong>{previewEducationPreference}</strong></div>
                                                <div className="ppv-row"><span>Occupation</span><strong>{previewOccupationPreference}</strong></div>
                                                <div className="ppv-row"><span>Employment Type</span><strong>{previewEmploymentPreference}</strong></div>
                                                <div className="ppv-row"><span>Earning</span><strong>{previewIncomePreference}</strong></div>
                                            </div>

                                            <div className="ppv-card">
                                                <h3>Partner's Family Details</h3>
                                                <div className="ppv-row"><span>Family Status</span><strong>{preferenceData.prefFamilyStatus || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Family Type</span><strong>{preferenceData.prefFamilyType || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Living with Parents</span><strong>{preferenceData.prefLivingWithParents || "Doesn't Matter"}</strong></div>
                                            </div>

                                            <div className="ppv-card">
                                                <h3>Partner's Lifestyle and Appearance</h3>
                                                <div className="ppv-row"><span>Drinking Habits</span><strong>{preferenceData.prefDrinking || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Dietary Habits</span><strong>{preferenceData.prefDietary || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Smoking Habits</span><strong>{preferenceData.prefSmoking || "Doesn't Matter"}</strong></div>
                                                <div className="ppv-row"><span>Special Cases</span><strong>{preferenceData.prefPhysicalStatus || "Doesn't Matter"}</strong></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {renderSectionModal()}
                    {renderDropdownModal()}

                    {/* Preference Modal (Generic - Other fields) */}
                    {activePrefEditor === 'generic' && (
                        <div className="modal-overlay" onClick={() => setActivePrefEditor(null)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Edit Partner Preference</h3>
                                    <button className="modal-close" onClick={() => setActivePrefEditor(null)}><X size={24} /></button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group"><label>Age From</label>
                                            <select name="prefAgeFrom" value={prefForm.prefAgeFrom || ''} onChange={handlePrefFormChange}>
                                                <option value="">Select</option>
                                                {Array.from({ length: 43 }, (_, i) => 18 + i).map(a => <option key={a} value={a}>{a} years</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Age To</label>
                                            <select name="prefAgeTo" value={prefForm.prefAgeTo || ''} onChange={handlePrefFormChange}>
                                                <option value="">Select</option>
                                                {Array.from({ length: 43 }, (_, i) => 18 + i).map(a => <option key={a} value={a}>{a} years</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Religion</label>
                                            <select name="prefReligion" value={prefForm.prefReligion || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                <option value="Hindu">Hindu</option><option value="Muslim">Muslim</option><option value="Christian">Christian</option><option value="Sikh">Sikh</option>
                                            </select>
                                        </div>
                                        {prefForm.prefReligion && (
                                            <div className="form-group"><label>Caste</label>
                                                <select name="prefCaste" value={prefForm.prefCaste || ''} onChange={handlePrefFormChange}>
                                                    <option value="">Any</option>
                                                    {getCastes(prefForm.prefReligion).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group"><label>Mother Tongue</label>
                                            <select name="prefMotherTongue" value={prefForm.prefMotherTongue || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Marital Status</label>
                                            <select name="prefMaritalStatus" value={prefForm.prefMaritalStatus || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                <option value="Never Married">Never Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Education</label>
                                            <select name="prefEducation" value={prefForm.prefEducation || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                <option value="Doctorate">Doctorate</option><option value="Masters">Masters</option><option value="Bachelors">Bachelors</option><option value="Diploma">Diploma</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Occupation</label>
                                            <select name="prefOccupation" value={prefForm.prefOccupation || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                {occupations.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Country</label>
                                            <select name="prefCountry" value={prefForm.prefCountry || ''} onChange={handlePrefFormChange}>
                                                <option value="">Any</option>
                                                {getCountries().map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-outline" onClick={() => setActivePrefEditor(null)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handlePrefSave}><Save size={16} /> Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Photo Manager Overlay */}
                    {showPhotoManager && (
                        <div className="pm-overlay">
                            <div className="pm-container">
                                <div className="pm-header">
                                    <button className="pm-back-btn" onClick={() => { setShowPhotoManager(false); setPhotoMenuIndex(null); }}>
                                        <ArrowLeft size={22} />
                                    </button>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {draftPhotos.length > 0 && draftPhotos.length < 3 && (
                                            <label className="pm-add-more-btn">
                                                <Camera size={16} /> Add Photos
                                                <input type="file" hidden accept="image/jpg,image/jpeg,image/png" multiple onChange={handleAddPhoto} />
                                            </label>
                                        )}
                                        {draftPhotos.length >= 3 && (
                                            <span style={{ fontSize: '0.8rem', color: '#9ca3af', alignSelf: 'center' }}>Max 3 photos</span>
                                        )}
                                        <button className="pm-save-btn btn btn-primary" onClick={handleSaveDraftPhotos} disabled={loading}>
                                            {loading ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Save
                                        </button>
                                    </div>
                                </div>

                                {draftPhotos.length === 0 ? (
                                    /* Upload Screen - No photos yet */
                                    <div className="pm-upload-screen">
                                        <h2 className="pm-upload-title">Impress them with your latest photo</h2>
                                        <p className="pm-upload-subtitle">Profile photos ensure a 5% increase in matches</p>

                                        <label className="pm-upload-btn">
                                            Upload Photo
                                            <input type="file" hidden accept="image/jpg,image/jpeg,image/png" multiple onChange={handleAddPhoto} />
                                        </label>
                                        <p className="pm-upload-format">Supported file format jpg, jpeg, png | upto 10 mb</p>

                                        <div className="pm-tips">
                                            <div className="pm-tips-header">
                                                <span className="pm-tips-icon">💡</span>
                                                <h4>Here are a few tips</h4>
                                            </div>
                                            <p className="pm-tips-subtitle">Avoid the following photos to highlight your profile better</p>
                                            <div className="pm-tips-grid">
                                                <div className="pm-tip-item">
                                                    <div className="pm-tip-avatar">
                                                        <User size={32} color="#bbb" />
                                                        <span className="pm-tip-x">✕</span>
                                                    </div>
                                                    <span>Blur photo</span>
                                                </div>
                                                <div className="pm-tip-item">
                                                    <div className="pm-tip-avatar">
                                                        <User size={32} color="#bbb" />
                                                        <span className="pm-tip-x">✕</span>
                                                    </div>
                                                    <span>Side face</span>
                                                </div>
                                                <div className="pm-tip-item">
                                                    <div className="pm-tip-avatar">
                                                        <User size={32} color="#bbb" />
                                                        <span className="pm-tip-x">✕</span>
                                                    </div>
                                                    <span>Watermark</span>
                                                </div>
                                                <div className="pm-tip-item">
                                                    <div className="pm-tip-avatar">
                                                        <User size={32} color="#bbb" />
                                                        <span className="pm-tip-x">✕</span>
                                                    </div>
                                                    <span>Group profile pic</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Photo Grid - Has photos */
                                    <div className="pm-photo-grid" onClick={() => setPhotoMenuIndex(null)}>
                                        {draftPhotos.map((photo, index) => (
                                            <div className="pm-photo-card" key={index} onClick={e => e.stopPropagation()}>
                                                <div className="pm-photo-wrapper" onClick={() => setFullViewPhoto(photo.src)}>
                                                    <img src={photo.src} alt={`Photo ${index + 1}`} />
                                                    {photo.isMain && (
                                                        <div className="pm-profile-badge">Profile Photo</div>
                                                    )}
                                                </div>
                                                <button className="pm-menu-btn" onClick={(e) => { e.stopPropagation(); togglePhotoMenu(index); }}>
                                                    <MoreVertical size={18} />
                                                </button>
                                                {photoMenuIndex === index && (
                                                    <div className="pm-dropdown">
                                                        {!photo.isMain && (
                                                            <button className="pm-dropdown-item" onClick={() => handleSetAsProfile(index)}>
                                                                <Image size={16} /> Set as Profile Picture
                                                            </button>
                                                        )}
                                                        <button className="pm-dropdown-item pm-dropdown-delete" onClick={() => handleDeletePhoto(index)}>
                                                            <Trash2 size={16} /> Delete Image
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Full Size Photo Viewer */}
                    {fullViewPhoto && (
                        <div className="pm-fullview-overlay" onClick={() => setFullViewPhoto(null)}>
                            <button className="pm-fullview-close" onClick={() => setFullViewPhoto(null)}><X size={28} /></button>
                            <img src={fullViewPhoto} alt="Full size" className="pm-fullview-img" onClick={e => e.stopPropagation()} />
                        </div>
                    )}

                    {/* Mobile Privacy Modal */}
                    {showPrivacyModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPrivacyModal(false)}>
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ fontSize: '1.25rem', color: '#1a2a3a', marginBottom: '20px', fontWeight: 600 }}>Mobile Privacy</h3>
                                {[
                                    { val: 'Visible to all paid members', desc: 'Only premium members can view' },
                                    { val: 'Only to Interest Sent/Accepted', desc: 'Showonly to members I accept/expressed interest in' },
                                    { val: 'Hide from All', desc: 'No contact to be shown to anyone' }
                                ].map(opt => {
                                    const currentPrivacy = editingSection === 'contact' ? editForm?.mobilePrivacy : profileData?.mobilePrivacy;
                                    const isActive = currentPrivacy === opt.val || (opt.val === 'Visible to all paid members' && !currentPrivacy);
                                    return (
                                        <div key={opt.val} style={{ display: 'flex', gap: '15px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => {
                                            if (editingSection === 'contact') {
                                                setEditForm(prev => ({ ...prev, mobilePrivacy: opt.val }));
                                            } else {
                                                setProfileData(prev => {
                                                    const updated = { ...prev, mobilePrivacy: opt.val };
                                                    localStorage.setItem('userProfile', JSON.stringify(updated));
                                                    return updated;
                                                });
                                            }
                                            setTimeout(() => setShowPrivacyModal(false), 200);
                                        }}>
                                            <div style={{ marginTop: '2px' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isActive ? '6px solid #D4AF37' : '2px solid #9ca3af', boxSizing: 'border-box' }}></div>
                                            </div>
                                            <div>
                                                <div style={{ color: isActive ? '#1a2a3a' : '#475569', fontWeight: 600, fontSize: '1rem', margin: '0 0 4px 0' }}>{opt.val}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{opt.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {renderSectionModal()}

                    {/* Favourites Multi-Select Modal */}
                    {activeFavModal && (
                        <FavouritesModal
                            title={favouritesCategories.find(c => c.key === activeFavModal)?.label || ''}
                            options={favouritesOptions[activeFavModal] || []}
                            selected={favouritesData[activeFavModal] || []}
                            onDone={(selectedItems) => handleFavDone(activeFavModal, selectedItems)}
                            onClose={() => setActiveFavModal(null)}
                        />
                    )}

                    {activePrefEditor === 'basic' && (
                        <PartnerBasicDetailsEditor
                            initialData={preferenceData}
                            onSave={(updatedData) => {
                                setPreferenceData(updatedData);
                                localStorage.setItem('userPreferences', JSON.stringify(updatedData));
                                setActivePrefEditor(null);
                            }}
                            onClose={() => setActivePrefEditor(null)}
                        />
                    )}

                    {activePrefEditor === 'education' && (
                        <PartnerEducationEditor
                            initialData={preferenceData}
                            onSave={(updatedData) => {
                                setPreferenceData(updatedData);
                                localStorage.setItem('userPreferences', JSON.stringify(updatedData));
                                setActivePrefEditor(null);
                            }}
                            onClose={() => setActivePrefEditor(null)}
                        />
                    )}

                    {activePrefEditor === 'religion' && (
                        <PartnerReligionEditor
                            initialData={preferenceData}
                            onSave={(updatedData) => {
                                const newData = { ...preferenceData, ...updatedData };
                                setPreferenceData(newData);
                                localStorage.setItem('userPreferences', JSON.stringify(newData));
                                setActivePrefEditor(null);
                            }}
                            onCancel={() => setActivePrefEditor(null)}
                        />
                    )}

                    {activePrefEditor === 'lifestyle' && (
                        <PartnerLifestyleEditor
                            initialData={preferenceData}
                            onSave={(updatedData) => {
                                const newData = { ...preferenceData, ...updatedData };
                                setPreferenceData(newData);
                                localStorage.setItem('userPreferences', JSON.stringify(newData));
                                setActivePrefEditor(null);
                            }}
                            onCancel={() => setActivePrefEditor(null)}
                        />
                    )}

                    {activePrefEditor === 'family' && (
                        <PartnerFamilyEditor
                            initialData={preferenceData}
                            onSave={(updatedData) => {
                                const newData = { ...preferenceData, ...updatedData };
                                setPreferenceData(newData);
                                localStorage.setItem('userPreferences', JSON.stringify(newData));
                                setActivePrefEditor(null);
                            }}
                            onCancel={() => setActivePrefEditor(null)}
                        />
                    )}

                    <Footer />
                </>
            )}
        </div>
    );
};

export default Profile;
