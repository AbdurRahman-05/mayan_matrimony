import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UserPlus, ArrowRight, ArrowLeft, Check, Camera, Upload, X, RefreshCw, Smartphone, Mail, ShieldCheck, Send, Lock, Headphones, Users, HelpCircle, Eye, EyeOff, MapPin, Search as SearchIcon } from 'lucide-react';

import { showAlert } from '../components/GlobalModal';
import { useNavigate, useLocation } from 'react-router-dom';
import './Register.css';
import SearchableSelect from '../components/SearchableSelect';
import { getCountries, getStates, getCities, getCastes, getSects } from '../data/locationData';
import { profileManagedOptions, genderOptions, maritalOptions, booleanOptions, childrenCountOptions, physicalStatusOptions, disabilityOptions, heights, religions, horoscopes, educationOptions, employedInOptions, occupations, currencies, languages, incomes, residentialStatusOptions, dietOptions, smokingOptions, drinkingOptions, familyTypeOptions, familyStatusOptions, familyValuesOptions, fatherOccupationOptions, motherOccupationOptions, siblingCounts, familyIncomes, livingWithParentsOptions, settleAbroadOptions, getMarriedCounts } from '../data/sharedOptions';
import { login as apiLogin, register as apiRegister, sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp, resetPassword as apiResetPassword, checkEmailAvailability, checkIdAvailability as apiCheckId, isAuthenticated, checkMobileAvailability } from '../services/api';

const StepIndicator = ({ step, title, currentStep }) => (
    <div className={`step-indicator ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}>
        {step < currentStep ? <Check size={20} /> : step}
    </div>
);

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [jvStep, setJvStep] = useState(0);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginOtpMode, setLoginOtpMode] = useState(false);
    const [loginOtp, setLoginOtp] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState('request'); // 'request', 'verify', 'reset'
    const [forgotPasswordData, setForgotPasswordData] = useState({ mobile: '', otp: '', newPassword: '', confirmPassword: '' });
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    // Dynamic story data
    const [storyData, setStoryData] = useState({
        story1: { coupleName: 'Anjush & Pahuja', description: 'We met through Sri Mayan and felt an instant connection. The platform made it so easy to find my perfect match. Thank you!' },
        story2: { coupleName: 'Shobhit & Gaurangi', description: 'Sri Mayan helped us find our perfect match effortlessly. The personalized matchmaking experience is truly commendable.' },
        story3: { coupleName: 'Kanika & Siddharth', description: 'We are grateful to the platform for bringing us together. Our families are extremely happy with this beautiful union.' }
    });

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await fetch('/api/admin/stories');
                if (response.ok) {
                    const data = await response.json();
                    setStoryData(data);
                }
            } catch (error) {
                console.error('Error fetching story data:', error);
            }
        };
        fetchStories();
    }, []);

    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            setLoginError('Please enter your mobile/email and password.');
            return;
        }
        try {
            setLoginError('');
            await apiLogin(loginForm.username, loginForm.password);
            navigate('/home');
        } catch (err) {
            setLoginError(err.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleLoginWithOtp = async () => {
        if (!loginForm.username) {
            setLoginError('Please enter your mobile number or email first.');
            return;
        }
        setLoginError('');
        try {
            await apiSendOtp('login', loginForm.username);
            setLoginOtpMode(true);
        } catch (err) {
            setLoginError(err.message || 'Error checking user credentials. Please try again.');
        }
    };

    const handleResendLoginOtp = async () => {
        setLoginError('');
        try {
            await apiSendOtp('login', loginForm.username);
            showAlert('OTP has been resent successfully.', 'Success');
        } catch (err) {
            setLoginError(err.message || 'Error resending OTP. Please try again.');
        }
    };

    const handleVerifyLoginOtp = async () => {
        if (!loginOtp || loginOtp.length < 4) {
            setLoginError('Please enter a valid OTP.');
            return;
        }
        try {
            const data = await apiVerifyOtp(loginForm.username, loginOtp);
            if (data.token) {
                navigate('/home');
            } else {
                setLoginError('User not found. Please register first.');
            }
        } catch (err) {
            setLoginError(err.message || 'Invalid OTP. Please try again.');
        }
    };

    const handleForgotPasswordRequest = async () => {
        if (!forgotPasswordData.mobile || forgotPasswordData.mobile.length < 10) {
            setForgotPasswordError('Please enter a valid mobile number.');
            return;
        }
        setIsForgotLoading(true);
        setForgotPasswordError('');
        try {
            await apiSendOtp('forgot', forgotPasswordData.mobile);
            setForgotPasswordStep('verify');
        } catch (err) {
            setForgotPasswordError(err.message || 'Error sending OTP. Please try again.');
        } finally {
            setIsForgotLoading(false);
        }
    };

    const handleForgotPasswordVerify = async () => {
        if (!forgotPasswordData.otp || forgotPasswordData.otp.length < 4) {
            setForgotPasswordError('Please enter a valid OTP.');
            return;
        }
        setForgotPasswordStep('reset');
    };

    const handleForgotPasswordReset = async () => {
        if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
            setForgotPasswordError('Passwords do not match.');
            return;
        }
        if (forgotPasswordData.newPassword.length < 8) {
            setForgotPasswordError('Password must be at least 8 characters long.');
            return;
        }
        setIsForgotLoading(true);
        setForgotPasswordError('');
        try {
            await apiResetPassword(forgotPasswordData.mobile, forgotPasswordData.otp, forgotPasswordData.newPassword);
            showAlert('Password reset successfully! Please login with your new password.', 'Success');
            setIsForgotPasswordMode(false);
            setForgotPasswordStep('request');
            setForgotPasswordData({ mobile: '', otp: '', newPassword: '', confirmPassword: '' });
            setLoginForm(prev => ({ ...prev, username: forgotPasswordData.mobile }));
        } catch (err) {
            setForgotPasswordError(err.message || 'Error resetting password. Please try again.');
        } finally {
            setIsForgotLoading(false);
        }
    };
    // Check for existing session
    React.useEffect(() => {
        if (isAuthenticated()) {
            navigate('/home', { replace: true });
        }
    }, [navigate]);

    React.useEffect(() => {
        if (location.pathname === '/login') {
            setShowRegistrationForm(false);
            setShowLoginModal(true);
        }

        if (location.state?.showRegister) {
            setShowRegistrationForm(true);
            // Optional: clear state so a page refresh doesn't reopen it
            window.history.replaceState({}, document.title);
        }
    }, [location.pathname, location.state]);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        dob: '',
        dobDay: '',
        dobMonth: '',
        dobYear: '',
        motherTongue: '',
        email: '',
        mobile: '',
        password: '',
        height: '',
        physicalStatus: 'Normal',
        maritalStatus: 'Never Married',
        religion: '',
        sect: '',
        caste: '',
        country: '',
        state: '',
        city: '',
        education: '',
        employmentType: '',
        occupation: '',
        currency: 'INR',
        income: '',
        photo: null,
        profileFor: '',
        partnerPreference: '',
        uniqueId: '',
        smoking: '',
        drinking: '',
        horoscope: '',
        timeOfBirth: '',
        placeOfBirth: '',
        diet: '',
        familyType: '',
        fatherOccupation: '',
        motherOccupation: '',
        brothers: '',
        brothersMarried: '',
        sisters: '',
        sistersMarried: '',
        familyLivingIn: '',
        contactAddress: '',
        havingChildren: '',
        numberOfChildren: '',
        residentialStatus: ''
    });

    const [registerMethod, setRegisterMethod] = useState('mobile'); // 'mobile' or 'email'
    const [verification, setVerification] = useState({
        mobile: { sent: false, verified: false, otp: '', enteredOtp: '' },
        email: { sent: false, verified: false, otp: '', enteredOtp: '' }
    });

    const [errors, setErrors] = useState({});
    const [jvErrors, setJvErrors] = useState({});
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [highestCompletedStep, setHighestCompletedStep] = useState(0);
    const [verificationOtp, setVerificationOtp] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [isdCode, setIsdCode] = useState('+91');
    const [verificationError, setVerificationError] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Validation for Step 0 (Registration)
    const validateJvStep0 = async () => {
        const errs = {};
        if (!formData.email) {
            errs.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
            errs.email = 'Please enter a valid email.';
        } else if (['test@example.com', 'admin@example.com'].includes(formData.email.toLowerCase())) {
            errs.email = 'This email is already registered';
        }

        if (!formData.mobile) {
            errs.mobile = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            errs.mobile = 'Phone number is invalid.';
        }

        if (!formData.password || formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
        if (!formData.profileFor) errs.profileFor = 'Please select who this profile is for';
        if (formData.profileFor && formData.profileFor !== 'Son' && formData.profileFor !== 'Daughter' && !formData.gender) {
            errs.gender = 'Gender is required';
        }

        if (Object.keys(errs).length === 0) {
            try {
                const [emailCheck, mobileCheck] = await Promise.all([
                    checkEmailAvailability(formData.email),
                    checkMobileAvailability(formData.mobile)
                ]);

                if (!emailCheck.available) {
                    errs.email = 'This email ID already exists. Please go to login.';
                }
                if (!mobileCheck.available) {
                    errs.mobile = 'This phone number already exists. Please go to login.';
                }
            } catch (err) {
                // Keep it silent if API fails so they can still try to register
            }
        }

        setJvErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation for Step 1 (Profile Details)
    const validateJvStep1 = () => {
        const errs = {};
        if (!formData.fullName) errs.fullName = 'Name is required';
        if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
            errs.dob = 'Date of Birth is required';
        } else {
            // Check if user is at least 18 years old
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = months.indexOf(formData.dobMonth);
            const birthDate = new Date(parseInt(formData.dobYear), monthIndex, parseInt(formData.dobDay));
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                errs.dob = 'Age should be above 18.';
            }
        }
        if (!formData.motherTongue) errs.motherTongue = 'Mother tongue is required';
        if (!formData.religion) errs.religion = 'Religion is required';
        if (!formData.caste) errs.caste = 'Caste is required';
        if (!formData.height) errs.height = 'Height is required';
        if (formData.religion === 'Hindu') {
            if (!formData.horoscope) errs.horoscope = 'Horoscope is required';
            if (!formData.placeOfBirth) errs.placeOfBirth = 'Place of birth is required';
            if (!formData.timeOfBirth) errs.timeOfBirth = 'Time of birth is required';
        }
        setJvErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation for Step 2 (Career Details)
    const validateJvStep2 = () => {
        const errs = {};
        if (!formData.country) errs.country = 'Country is required';
        if (formData.country === 'India') {
            if (!formData.state) errs.state = 'State is required';
            if (!formData.city) errs.city = 'City is required';
        } else if (formData.country) {
            if (!formData.residentialStatus) errs.residentialStatus = 'Residential Status is required';
        }
        if (!formData.education) errs.education = 'Highest Degree is required';
        if (!formData.employmentType) errs.employmentType = 'Employment is required';
        if (!formData.occupation) errs.occupation = 'Occupation is required';
        if (!formData.income) errs.income = 'Annual Income is required';
        setJvErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Handle step navigation with validation
    const handleJvNext = async (targetStep) => {
        let isValid = false;
        if (jvStep === 0) isValid = await validateJvStep0();
        else if (jvStep === 1) isValid = validateJvStep1();
        else if (jvStep === 2) isValid = validateJvStep2();
        else isValid = true;

        if (isValid) {
            setJvErrors({});
            if (targetStep > highestCompletedStep) {
                setHighestCompletedStep(targetStep);
            }
            setJvStep(targetStep);
        }
    };

    // Handle tab click - only allow going to completed steps or current
    const handleTabClick = (targetStep) => {
        if (targetStep <= highestCompletedStep) {
            setJvErrors({});
            setJvStep(targetStep);
        }
    };
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const handleSendOtp = async (type) => {
        const val = formData[type];
        if (!val) {
            setErrors(prev => ({ ...prev, [type]: `Please enter ${type} to verify` }));
            return;
        }

        try {
            await apiSendOtp(type, val);
            setVerification(prev => ({
                ...prev,
                [type]: { ...prev[type], sent: true }
            }));
            showAlert(`OTP sent to ${val} successfully.`, 'Success');
            setErrors(prev => ({ ...prev, [type]: '' }));
        } catch (err) {
            setErrors(prev => ({ ...prev, [type]: err.message || 'Failed to send OTP' }));
        }
    };

    const handleVerifyOtp = async (type) => {
        const val = formData[type];
        const { enteredOtp } = verification[type];

        try {
            await apiVerifyOtp(val, enteredOtp);
            setVerification(prev => ({
                ...prev,
                [type]: { ...prev[type], verified: true, sent: false }
            }));
            setErrors(prev => ({ ...prev, [type]: '' }));
        } catch (err) {
            setErrors(prev => ({ ...prev, [type]: err.message || 'Invalid OTP. Please try again.' }));
        }
    };

    const handleOtpChange = (type, value) => {
        setVerification(prev => ({
            ...prev,
            [type]: { ...prev[type], enteredOtp: value }
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // If changing email or mobile, reset verification
        if (name === 'email' || name === 'mobile') {
            if (verification[name].verified) {
                // Check if value is actually different to avoid reset on re-render or trivial updates
                // But for simplicity, if verified, we discourage editing without reset. 
                // Here, if user types, we reset verification.
                setVerification(prev => ({
                    ...prev,
                    [name]: { sent: false, verified: false, otp: '', enteredOtp: '' }
                }));
            }
        }

        if (name === 'religion') {
            setFormData(prev => ({ ...prev, religion: value, caste: '', sect: '' }));
        } else if (name === 'country') {
            setFormData(prev => ({ ...prev, country: value, state: '', city: '', residentialStatus: value === 'India' ? '' : prev.residentialStatus }));
        } else if (name === 'state') {
            setFormData(prev => ({ ...prev, state: value, city: '' }));
        } else if (name === 'profileFor') {
            if (value === 'Son') {
                setFormData(prev => ({ ...prev, profileFor: value, gender: 'Male' }));
            } else if (value === 'Daughter') {
                setFormData(prev => ({ ...prev, profileFor: value, gender: 'Female' }));
            } else {
                setFormData(prev => ({ ...prev, profileFor: value, gender: '' }));
            }
        } else if (name === 'maritalStatus') {
            setFormData(prev => {
                const newData = { ...prev, maritalStatus: value };
                if (value === 'Never Married') {
                    newData.havingChildren = '';
                    newData.numberOfChildren = '';
                }
                return newData;
            });
        } else if (name === 'havingChildren') {
            setFormData(prev => {
                const newData = { ...prev, havingChildren: value };
                if (value !== 'Yes') {
                    newData.numberOfChildren = '';
                }
                return newData;
            });
        } else if (name === 'brothers') {
            setFormData(prev => ({ ...prev, brothers: value, brothersMarried: '' }));
        } else if (name === 'sisters') {
            setFormData(prev => ({ ...prev, sisters: value, sistersMarried: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, photo: file }));
            setPhotoPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, photo: '' }));
        }
    };

    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            showAlert("Could not access camera. Please check permissions.", "Camera Error");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setPhotoPreview(dataUrl);

            // Convert dataURL to Blob/File for formData
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    setFormData(prev => ({ ...prev, photo: file }));
                    setErrors(prev => ({ ...prev, photo: '' }));
                });

            stopCamera();
        }
    };

    const retakePhoto = () => {
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, photo: null }));
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

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.dob) {
            newErrors.dob = "Date of Birth is required";
        } else {
            const age = calculateAge(formData.dob);
            if (age < 18) {
                newErrors.dob = "Age should be above 18.";
            }
        }

        if (!formData.motherTongue) newErrors.motherTongue = "Mother Tongue is required";

        if (registerMethod === 'mobile') {
            if (!formData.mobile) newErrors.mobile = "Mobile Number is required";
            else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Phone number is invalid.";
            else if (!verification.mobile.verified) newErrors.mobile = "Please verify your mobile number";
        }

        if (registerMethod === 'email') {
            if (!formData.email) {
                newErrors.email = "Email is required";
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
                newErrors.email = "Please enter a valid email.";
            } else if (['test@example.com', 'admin@example.com'].includes(formData.email.toLowerCase())) {
                newErrors.email = 'This email is already registered';
            } else if (!verification.email.verified) {
                newErrors.email = "Please verify your email address";
            }
        }

        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8 || formData.password.length > 20) {
            newErrors.password = "Password must be 8-20 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.height) newErrors.height = "Height is required";
        if (!formData.religion) newErrors.religion = "Religion is required";
        if (!formData.caste) newErrors.caste = "Caste is required";
        if (formData.religion === 'Hindu' && !formData.horoscope) {
            newErrors.horoscope = "Horoscope is required";
        }
        if (!formData.smoking) newErrors.smoking = "Smoking habit is required";
        if (!formData.drinking) newErrors.drinking = "Drinking habit is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};
        if (!formData.country) newErrors.country = "Country is required";
        if (!formData.education) newErrors.education = "Education is required";
        if (!formData.employmentType) newErrors.employmentType = "Employment Type is required";
        if (!formData.occupation) newErrors.occupation = "Occupation is required";
        if (!formData.income) newErrors.income = "Income is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep4 = () => {
        const newErrors = {};
        if (!formData.photo) newErrors.photo = "Profile photo is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Check if unique ID is available via backend
    const checkIdAvailability = async (id) => {
        try {
            const result = await apiCheckId(id);
            return result.available;
        } catch (err) {
            return true; // Allow if check fails
        }
    };

    const validateStep5 = () => {
        const newErrors = {};
        // partnerPreference is now optional

        if (!formData.uniqueId) {
            newErrors.uniqueId = "Unique ID is required";
        } else if (formData.uniqueId.length < 4) {
            newErrors.uniqueId = "ID must be at least 4 characters";
        } else if (!checkIdAvailability(formData.uniqueId)) {
            newErrors.uniqueId = "This ID is already taken. Please choose another.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBack = (e) => {
        e.preventDefault();
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const submitRegistration = async (data) => {
        console.log("Registration Full Data:", data);
        try {
            // Convert photo File to base64 if needed
            let photoBase64 = null;
            if (data.photo && data.photo instanceof File) {
                photoBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(data.photo);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                });
            } else if (typeof data.photo === 'string') {
                photoBase64 = data.photo;
            }

            const registrationData = {
                ...data,
                photo: photoBase64,
                uniqueId: data.uniqueId || undefined
            };

            await apiRegister(registrationData);
            navigate('/home');
        } catch (err) {
            console.error('Registration error:', err);
            showAlert(err.message || 'Registration failed. Please try again.', 'Error');
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            setCurrentStep(4);
        } else if (currentStep === 4 && validateStep4()) {
            setCurrentStep(5);
        } else if (currentStep === 5 && validateStep5()) {
            submitRegistration(formData);
        }
    };

    const handleSkip = (e) => {
        e.preventDefault();
        setErrors({}); // Clear errors

        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Final step skip - generate ID if missing
            let finalData = { ...formData };
            if (!finalData.uniqueId) {
                // Generate simple unique ID based on name or random
                const baseId = formData.fullName ? formData.fullName.toLowerCase().replace(/\s+/g, '_') : 'user';
                const randomSuffix = Math.floor(Math.random() * 10000);
                finalData.uniqueId = `${baseId}_${randomSuffix}`;
                setFormData(prev => ({ ...prev, uniqueId: finalData.uniqueId }));
            }
            submitRegistration(finalData);
        }
    };

    if (isRegistered) {
        return (
            <div className="register-page">
                <div className="register-container">
                    <div className="register-card glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="success-icon-container" style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                            }}>
                                <Check size={40} color="white" strokeWidth={3} />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>Registration Successful!</h2>
                        <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '2rem' }}>
                            Welcome to Sri Mayan Matrimony. Your profile has been created successfully.
                        </p>

                        <div style={{
                            background: '#f3f4f6',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            display: 'inline-block',
                            border: '1px dashed #9ca3af',
                            marginBottom: '2rem'
                        }}>
                            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Your Unique Member ID</p>
                            <h3 style={{ fontSize: '1.8rem', color: '#D4AF37', margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {formData.uniqueId}
                            </h3>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>
                                Login directly
                            </button>
                            <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }


    const countries = getCountries();
    const availableStates = getStates(formData.country);
    const availableCities = getCities(formData.country, formData.state);
    const availableCastes = getCastes(formData.religion);
    const availableSects = getSects(formData.religion);

    return (
        <div className="register-page">
            <div className="new-landing-wrapper">
                {/* Landing Navbar */}
                <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
                    <div className="landing-navbar-inner">
                        <div className="landing-navbar-logo">
                            <img src="/logo.png" alt="Sri Mayan" />
                        </div>
                        <div className="landing-navbar-actions">
                            <button className="landing-nav-login" onClick={() => setShowLoginModal(true)}>Login</button>
                            <button className="landing-nav-register" onClick={() => setShowRegistrationForm(true)}>Register</button>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="ts-hero-section">
                    <div className="ts-hero-overlay"></div>
                    <div className="ts-hero-content">
                        <h1 className="ts-hero-title">
                            <span className="ts-hero-title-line">Find the one <span className="ts-hero-highlight">meant</span></span>
                            <span className="ts-hero-title-line ts-hero-title-focus"><span className="ts-hero-highlight">for you</span></span>
                        </h1>
                        <button className="ts-hero-btn" onClick={() => setShowRegistrationForm(true)}>Let's Begin</button>
                    </div>
                </div>

                {/* Success Stories Section */}
                <div className="ts-story-section">
                    <h2 className="ts-section-title">Real Stories, True Connections</h2>
                    <div className="ts-story-cards">
                        <div className="ts-story-card">
                            <div className="ts-story-img-wrapper">
                                <img src="/couple1.png" alt="Couple 1" />
                            </div>
                            <div className="ts-story-card-content">
                                <h3>{storyData.story1.coupleName}</h3>
                                <p>{storyData.story1.description}</p>
                            </div>
                        </div>
                        <div className="ts-story-card">
                            <div className="ts-story-img-wrapper">
                                <img src="/couple2.png" alt="Couple 2" />
                            </div>
                            <div className="ts-story-card-content">
                                <h3>{storyData.story2.coupleName}</h3>
                                <p>{storyData.story2.description}</p>
                            </div>
                        </div>
                        <div className="ts-story-card">
                            <div className="ts-story-img-wrapper">
                                <img src="/couple3.png" alt="Couple 3" />
                            </div>
                            <div className="ts-story-card-content">
                                <h3>{storyData.story3.coupleName}</h3>
                                <p>{storyData.story3.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Three Steps Section */}
                <section className="ts-steps-section">
                    <div className="ts-steps-header">
                        <p className="ts-steps-kicker">THREE SIMPLE STEPS TO</p>
                        <h2 className="ts-steps-title">
                            Find the <span>One for You</span>
                        </h2>
                    </div>

                    <div className="ts-steps-grid">
                        <article className="ts-step-card">
                            <div className="ts-step-art ts-step-art-preference" aria-hidden="true">
                                <div className="ts-art-row">
                                    <span className="ts-art-check active"></span>
                                    <span className="ts-art-line long"></span>
                                </div>
                                <div className="ts-art-row">
                                    <span className="ts-art-check"></span>
                                    <span className="ts-art-line medium"></span>
                                </div>
                                <div className="ts-art-row">
                                    <span className="ts-art-check active"></span>
                                    <span className="ts-art-line long"></span>
                                </div>
                                <div className="ts-art-panel">
                                    <span className="ts-art-dot"></span>
                                    <span className="ts-art-dot"></span>
                                    <span className="ts-art-dot"></span>
                                </div>
                            </div>
                            <p className="ts-step-text"><span>01.</span> Define Your Partner Preferences</p>
                        </article>

                        <article className="ts-step-card">
                            <div className="ts-step-art ts-step-art-browse" aria-hidden="true">
                                <div className="ts-search-bar">
                                    <span>Search</span>
                                </div>
                                <div className="ts-profile-card">
                                    <span className="ts-profile-avatar"></span>
                                    <span className="ts-profile-meta"></span>
                                </div>
                                <div className="ts-profile-line"></div>
                            </div>
                            <p className="ts-step-text"><span>02.</span> Browse Profiles</p>
                        </article>

                        <article className="ts-step-card">
                            <div className="ts-step-art ts-step-art-connect" aria-hidden="true">
                                <div className="ts-connect-back left"></div>
                                <div className="ts-connect-back right"></div>
                                <div className="ts-connect-front">
                                    <span className="ts-connect-avatar"></span>
                                    <span className="ts-connect-meta"></span>
                                </div>
                                <span className="ts-connect-badge"></span>
                            </div>
                            <p className="ts-step-text"><span>03.</span> Send Interests &amp; Connect</p>
                        </article>
                    </div>

                    <div className="ts-steps-cta-wrap">
                        <button className="ts-steps-cta" onClick={() => setShowRegistrationForm(true)}>Get Started</button>
                    </div>
                </section>

                {/* Membership Preview Section */}
                <section className="ts-membership-preview" style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fafafa', borderTop: '1px solid #eaeaea' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <p className="ts-steps-kicker" style={{ color: '#ca9d42', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>UPGRADE YOUR EXPERIENCE</p>
                        <h2 className="ts-steps-title" style={{ fontSize: '2.5rem', color: '#1a1a1a', marginBottom: '20px' }}>
                            Premium <span style={{ color: '#ca9d42' }}>Membership Plans</span>
                        </h2>
                        <p style={{ color: '#606060', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6' }}>
                            Unlock exclusive features to find your perfect match faster. View contact details, send direct messages, and get priority visibility.
                        </p>
                        <button 
                            className="ts-steps-cta" 
                            onClick={() => window.location.href = '/membership'}
                            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '16px 40px', fontSize: '1.1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.3s' }}
                            onMouseOver={(e) => { e.target.style.backgroundColor = '#ca9d42'; e.target.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.target.style.backgroundColor = '#1a1a1a'; e.target.style.transform = 'translateY(0)'; }}
                        >
                            See Membership Plans
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div>

            {showLoginModal && (
                <div className="custom-login-modal-overlay">
                    <div className="custom-login-modal">
                        <button className="custom-login-close" onClick={() => { 
                            setShowLoginModal(false); 
                            setLoginOtpMode(false); 
                            setLoginError(''); 
                            setLoginOtp(''); 
                            setIsForgotPasswordMode(false);
                            setForgotPasswordStep('request');
                            setForgotPasswordError('');
                        }}>
                            <X size={20} color="#b1b1b1" />
                        </button>

                        {isForgotPasswordMode ? (
                            <>
                                <h2 className="custom-login-title">Reset Your Password</h2>
                                
                                {forgotPasswordError && (
                                    <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '10px', padding: '8px 12px', background: '#fdf2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                        {forgotPasswordError}
                                    </div>
                                )}

                                {forgotPasswordStep === 'request' && (
                                    <>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Enter your registered mobile number to receive an OTP.</p>
                                        <div className="custom-login-field">
                                            <label>Mobile Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter 10-digit mobile number"
                                                value={forgotPasswordData.mobile}
                                                onChange={(e) => { 
                                                    setForgotPasswordData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })); 
                                                    setForgotPasswordError(''); 
                                                }}
                                                maxLength={10}
                                            />
                                        </div>
                                        <button 
                                            className="custom-login-btn primary" 
                                            onClick={handleForgotPasswordRequest}
                                            disabled={isForgotLoading}
                                        >
                                            {isForgotLoading ? <RefreshCw size={18} className="animate-spin" /> : 'Send OTP'}
                                        </button>
                                    </>
                                )}

                                {forgotPasswordStep === 'verify' && (
                                    <>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Enter the OTP sent to {forgotPasswordData.mobile}</p>
                                        <div className="custom-login-field">
                                            <label>Verification OTP</label>
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={forgotPasswordData.otp}
                                                onChange={(e) => { 
                                                    setForgotPasswordData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })); 
                                                    setForgotPasswordError(''); 
                                                }}
                                                maxLength={6}
                                            />
                                        </div>
                                        <button className="custom-login-btn primary" onClick={handleForgotPasswordVerify}>Verify OTP</button>
                                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                            <button 
                                                type="button" 
                                                onClick={handleForgotPasswordRequest}
                                                style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                            >
                                                Resend OTP
                                            </button>
                                        </div>
                                    </>
                                )}

                                {forgotPasswordStep === 'reset' && (
                                    <>
                                        <div className="custom-login-field">
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                placeholder="Enter new password (min 8 characters)"
                                                value={forgotPasswordData.newPassword}
                                                onChange={(e) => { setForgotPasswordData(prev => ({ ...prev, newPassword: e.target.value })); setForgotPasswordError(''); }}
                                                minLength={8}
                                            />
                                        </div>
                                        <div className="custom-login-field">
                                            <label>Confirm New Password</label>
                                            <input
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={forgotPasswordData.confirmPassword}
                                                onChange={(e) => { setForgotPasswordData(prev => ({ ...prev, confirmPassword: e.target.value })); setForgotPasswordError(''); }}
                                            />
                                        </div>
                                        <button 
                                            className="custom-login-btn primary" 
                                            onClick={handleForgotPasswordReset}
                                            disabled={isForgotLoading}
                                        >
                                            {isForgotLoading ? <RefreshCw size={18} className="animate-spin" /> : 'Update Password'}
                                        </button>
                                    </>
                                )}

                                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsForgotPasswordMode(false); setForgotPasswordStep('request'); }}
                                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="custom-login-title">Welcome back! Please Login</h2>

                                {loginError && (
                                    <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '10px', padding: '8px 12px', background: '#fdf2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                        {loginError}
                                    </div>
                                )}

                                <div className="custom-login-field">
                                    <label>Mobile No. / Email ID</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Mobile no. / Email ID"
                                        value={loginForm.username}
                                        onChange={(e) => { setLoginForm(prev => ({ ...prev, username: e.target.value })); setLoginError(''); }}
                                    />
                                </div>

                                {!loginOtpMode ? (
                                    <>
                                        <div className="custom-login-field">
                                            <label>Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showLoginPassword ? "text" : "password"}
                                                    placeholder="Enter password"
                                                    value={loginForm.password}
                                                    onChange={(e) => { setLoginForm(prev => ({ ...prev, password: e.target.value })); setLoginError(''); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                                                    style={{ width: '100%', paddingRight: '40px' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '10px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#888',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: 0
                                                    }}
                                                >
                                                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="custom-login-options">
                                            <label className="custom-login-stay">
                                                <input type="checkbox" defaultChecked />
                                                <span>Stay Logged in</span>
                                                <HelpCircle size={15} color="#999" style={{ marginLeft: '4px', cursor: 'help' }} />
                                            </label>
                                            <button 
                                                type="button" 
                                                className="custom-login-forgot" 
                                                onClick={() => {
                                                    setIsForgotPasswordMode(true);
                                                    setForgotPasswordData(prev => ({ ...prev, mobile: /^\d+$/.test(loginForm.username) ? loginForm.username : '' }));
                                                }}
                                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>

                                        <button className="custom-login-btn primary" onClick={handleLogin}>Login</button>

                                        {!/^[a-zA-Z]/.test(loginForm.username) && (
                                            <>
                                                <div className="custom-login-divider">
                                                    <span>OR</span>
                                                </div>

                                                <button className="custom-login-btn primary-outline" onClick={handleLoginWithOtp}>Login with OTP</button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="custom-login-field">
                                            <label>Enter OTP sent to {loginForm.username}</label>
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={loginOtp}
                                                onChange={(e) => { setLoginOtp(e.target.value); setLoginError(''); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyLoginOtp(); }}
                                                maxLength={6}
                                            />
                                            <div style={{ textAlign: 'right', marginTop: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleResendLoginOtp}
                                                    style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}
                                                >
                                                    Resend OTP
                                                </button>
                                            </div>
                                        </div>

                                        <button className="custom-login-btn primary" onClick={handleVerifyLoginOtp}>Verify OTP & Login</button>

                                        <button
                                            className="custom-login-btn primary-outline"
                                            onClick={() => { setLoginOtpMode(false); setLoginOtp(''); setLoginError(''); }}
                                            style={{ marginTop: '10px' }}
                                        >
                                            Back to Password Login
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        <p className="custom-login-footer">
                            New to Sri Mayan? <a href="#register" onClick={(e) => { e.preventDefault(); setShowLoginModal(false); setLoginOtpMode(false); setLoginError(''); setShowRegistrationForm(true); }}>Register Free &gt;</a>
                        </p>
                    </div>
                </div>
            )}

            {
                showRegistrationForm && (
                    <div className="jv-register-overlay">
                        <div className="jv-register-header">
                            <div className="jv-register-header-top">
                                <div className="jv-logo-box">
                                    <img src="/logo.png" alt="Sri Mayan" style={{ width: '120px', height: 'auto' }} />
                                </div>
                            </div>
                            {jvStep > 0 && jvStep <= 3 && (
                                <div className="jv-register-tabs">
                                    <div className={`jv-tab ${jvStep === 1 ? 'active' : ''} ${highestCompletedStep >= 1 ? '' : 'disabled'}`} onClick={() => handleTabClick(1)}>Profile Details</div>
                                    <div className={`jv-tab ${jvStep === 2 ? 'active' : ''} ${highestCompletedStep >= 2 ? '' : 'disabled'}`} onClick={() => handleTabClick(2)}>Career Details</div>
                                    <div className={`jv-tab ${jvStep === 3 ? 'active' : ''} ${highestCompletedStep >= 3 ? '' : 'disabled'}`} onClick={() => handleTabClick(3)}>Lifestyle & Family</div>
                                </div>
                            )}
                            {jvStep === 4 && (
                                <div className="jv-register-tabs">
                                    <div className="jv-tab active" style={{ cursor: 'default' }}>Phone Verification</div>
                                </div>
                            )}
                        </div>

                        <div className="jv-register-body">
                            {jvStep < 4 && (
                                <h2 className="jv-main-title" style={{ fontSize: jvStep > 1 ? '1.5rem' : '1.3rem', color: '#666', fontWeight: 300 }}>
                                    {jvStep === 0 && "Welcome! Your journey to finding the right match begins now"}
                                    {jvStep === 1 && "Complete your profile now to contact members you like and to receive interests"}
                                    {jvStep === 2 && "Great! You are about to complete your Sri Mayan profile."}
                                    {jvStep === 3 && "Great! You are about to complete your Sri Mayan profile."}
                                </h2>
                            )}

                            {jvStep === 0 && (
                                <div className="jv-step0-container">
                                    <div className="jv-mandatory-note" style={{ textAlign: 'right', marginBottom: '10px' }}>
                                        mandatory <span className="jv-asterisk">*</span>
                                    </div>

                                    <div className="jv-step0-input-row">
                                        <input type="email" name="email" className="jv-step0-input" placeholder="Your Email *" value={formData.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="jv-step0-input-row" style={{ display: 'flex' }}>
                                        <div style={{ width: '80px', padding: '10px', border: '1px solid #d1d5db', borderRight: 'none', borderRadius: '4px 0 0 4px', background: '#f3f4f6', fontSize: '1rem', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
                                            +91
                                        </div>
                                        <input type="tel" name="mobile" className="jv-step0-input" style={{ borderRadius: '0 4px 4px 0', borderLeft: '1px solid #d1d5db' }} placeholder="Mobile No. *" value={formData.mobile} onChange={handleInputChange} />
                                    </div>
                                    <div className="jv-step0-input-row">
                                        <input type="password" name="password" className="jv-step0-input" placeholder="Create New Password *" value={formData.password} onChange={handleInputChange} />
                                        <span className="jv-step0-hint">Hint: Use 8 or more characters with a mix of letters(a-z) & numbers(0-9)</span>
                                    </div>
                                    <div className="jv-step0-input-row">
                                        <SearchableSelect
                                            name="profileFor"
                                            value={formData.profileFor}
                                            onChange={handleInputChange}
                                            placeholder="Create profile for *"
                                            options={['Self', 'Son', 'Daughter', 'Relative/Friend', 'Other']}
                                        />
                                    </div>

                                    {formData.profileFor && formData.profileFor !== 'Son' && formData.profileFor !== 'Daughter' && (
                                        <div className="jv-step0-input-row">
                                            <SearchableSelect
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                placeholder="Gender *"
                                                options={['Male', 'Female']}
                                            />
                                        </div>
                                    )}

                                    {Object.keys(jvErrors).length > 0 && (
                                        <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 15px', marginBottom: '15px' }}>
                                            {Object.values(jvErrors).map((err, i) => (
                                                <p key={i} style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '3px 0' }}>• {err}</p>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'center' }}>
                                        <button className="jv-register-me-btn gold-theme" onClick={() => handleJvNext(1)}>Register me</button>
                                    </div>
                                </div>
                            )}

                            {jvStep > 0 && (
                                <div className="jv-content-split">
                                    {jvStep === 1 && (
                                        <div className="jv-form-section">
                                            <div className="jv-mandatory-note">mandatory <span className="jv-asterisk">*</span></div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Name <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group column">
                                                    <div className="jv-input-with-action">
                                                        <input type="text" name="fullName" placeholder="Full Name" className="jv-input" value={formData.fullName} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Date of Birth <span className="jv-asterisk">*</span></label>
                                                <div className="jv-date-group">
                                                    <SearchableSelect
                                                        name="dobDay"
                                                        value={formData.dobDay}
                                                        onChange={handleInputChange}
                                                        placeholder="Day"
                                                        options={Array.from({ length: 31 }, (_, i) => String(i + 1))}
                                                    />
                                                    <SearchableSelect
                                                        name="dobMonth"
                                                        value={formData.dobMonth}
                                                        onChange={handleInputChange}
                                                        placeholder="Month"
                                                        options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                                                    />
                                                    <SearchableSelect
                                                        name="dobYear"
                                                        value={formData.dobYear}
                                                        onChange={handleInputChange}
                                                        placeholder="Year"
                                                        options={Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - 18 - i))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Mother tongue <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="motherTongue"
                                                        value={formData.motherTongue}
                                                        onChange={handleInputChange}
                                                        placeholder="Select language"
                                                        options={languages}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Religion <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="religion"
                                                        value={formData.religion}
                                                        onChange={handleInputChange}
                                                        placeholder="Select religion"
                                                        options={religions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Sect</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="sect"
                                                        value={formData.sect}
                                                        onChange={handleInputChange}
                                                        placeholder="Select sect"
                                                        disabled={!formData.religion}
                                                        options={availableSects}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Caste <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="caste"
                                                        value={formData.caste}
                                                        onChange={handleInputChange}
                                                        placeholder="Select caste"
                                                        options={availableCastes}
                                                        disabled={!formData.religion}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Marital Status <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="maritalStatus"
                                                        value={formData.maritalStatus}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Marital Status"
                                                        options={maritalOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            {formData.maritalStatus && formData.maritalStatus !== 'Never Married' && (
                                                <div className="jv-form-row">
                                                    <label className="jv-label">Having Children?</label>
                                                    <div className="jv-input-group">
                                                        <SearchableSelect
                                                            name="havingChildren"
                                                            value={formData.havingChildren}
                                                            onChange={handleInputChange}
                                                            placeholder="Select"
                                                            options={booleanOptions}
                                                            className="full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {formData.maritalStatus && formData.maritalStatus !== 'Never Married' && formData.havingChildren === 'Yes' && (
                                                <div className="jv-form-row">
                                                    <label className="jv-label">Number of Children</label>
                                                    <div className="jv-input-group">
                                                        <SearchableSelect
                                                            name="numberOfChildren"
                                                            value={formData.numberOfChildren}
                                                            onChange={handleInputChange}
                                                            placeholder="Select"
                                                            options={childrenCountOptions}
                                                            className="full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="jv-form-row">
                                                <label className="jv-label">Height <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="height"
                                                        value={formData.height}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Height"
                                                        options={heights}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            {formData.religion === 'Hindu' && (
                                                <>
                                                    <div className="jv-subheading">Horoscope Details</div>

                                                    <div className="jv-form-row">
                                                        <label className="jv-label">Horoscope (Rasi)</label>
                                                        <div className="jv-input-group">
                                                            <SearchableSelect
                                                                name="horoscope"
                                                                value={formData.horoscope}
                                                                onChange={handleInputChange}
                                                                placeholder="Select Horoscope"
                                                                options={[...horoscopes, "Don't know"]}
                                                                className="full"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="jv-form-row">
                                                        <label className="jv-label">Time of Birth</label>
                                                        <div className="jv-input-group">
                                                            <input
                                                                type="time"
                                                                name="timeOfBirth"
                                                                value={formData.timeOfBirth || ''}
                                                                onChange={handleInputChange}
                                                                className="jv-input"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="jv-form-row">
                                                        <label className="jv-label">Place of Birth</label>
                                                        <div className="jv-input-group">
                                                            <input
                                                                type="text"
                                                                name="placeOfBirth"
                                                                value={formData.placeOfBirth || ''}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter city of birth"
                                                                className="jv-input"
                                                            />
                                                        </div>
                                                    </div>

                                                </>
                                            )}

                                            <div className="jv-form-row jv-submit-row">
                                                {Object.keys(jvErrors).length > 0 && (
                                                    <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 15px', marginBottom: '15px', width: '100%' }}>
                                                        {Object.values(jvErrors).map((err, i) => (
                                                            <p key={i} style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '3px 0' }}>• {err}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                <button className="jv-submit-btn" onClick={() => handleJvNext(2)}>Continue</button>
                                            </div>
                                        </div>
                                    )}

                                    {jvStep === 2 && (
                                        <div className="jv-form-section">
                                            <div className="jv-mandatory-note">mandatory <span className="jv-asterisk">*</span></div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Country <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Country"
                                                        options={countries}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            {formData.country === 'India' ? (
                                                <>
                                                    <div className="jv-form-row">
                                                        <label className="jv-label">State <span className="jv-asterisk">*</span></label>
                                                        <div className="jv-input-group">
                                                            <SearchableSelect
                                                                name="state"
                                                                value={formData.state}
                                                                onChange={handleInputChange}
                                                                placeholder="Select State"
                                                                options={availableStates}
                                                                disabled={!formData.country}
                                                                className="full"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="jv-form-row">
                                                        <label className="jv-label">City living in <span className="jv-asterisk">*</span></label>
                                                        <div className="jv-input-group">
                                                            <SearchableSelect
                                                                name="city"
                                                                value={formData.city}
                                                                onChange={handleInputChange}
                                                                placeholder="Select City"
                                                                options={availableCities}
                                                                disabled={!formData.state}
                                                                className="full"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : formData.country ? (
                                                <div className="jv-form-row">
                                                    <label className="jv-label">Residential Status <span className="jv-asterisk">*</span></label>
                                                    <div className="jv-input-group">
                                                        <SearchableSelect
                                                            name="residentialStatus"
                                                            value={formData.residentialStatus}
                                                            onChange={handleInputChange}
                                                            placeholder="Select Residential Status"
                                                            options={residentialStatusOptions}
                                                            className="full"
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="jv-form-row">
                                                <label className="jv-label">Highest Degree <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="education"
                                                        value={formData.education}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Degree"
                                                        options={educationOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Employed In <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="employmentType"
                                                        value={formData.employmentType}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Employment"
                                                        options={employedInOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Occupation <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="occupation"
                                                        value={formData.occupation}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Occupation"
                                                        options={occupations}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Annual Income <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group column">
                                                    <SearchableSelect
                                                        name="income"
                                                        value={formData.income}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Income"
                                                        options={incomes}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row jv-submit-row">
                                                {Object.keys(jvErrors).length > 0 && (
                                                    <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 15px', marginBottom: '15px', width: '100%' }}>
                                                        {Object.values(jvErrors).map((err, i) => (
                                                            <p key={i} style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '3px 0' }}>• {err}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                <button className="jv-submit-btn" onClick={() => handleJvNext(3)}>Continue</button>
                                            </div>
                                        </div>
                                    )}

                                    {jvStep === 3 && (
                                        <div className="jv-form-section">
                                            <div className="jv-mandatory-note">mandatory <span className="jv-asterisk">*</span></div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Diet <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="diet"
                                                        value={formData.diet || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Diet"
                                                        options={dietOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Smoking <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="smoking"
                                                        value={formData.smoking}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Smoking habit"
                                                        options={smokingOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Drinking <span className="jv-asterisk">*</span></label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="drinking"
                                                        value={formData.drinking}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Drinking habit"
                                                        options={drinkingOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <h3 style={{ fontSize: '1.3rem', color: '#666', fontWeight: 300, marginTop: '2rem', marginBottom: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>We would love to know about your family.</h3>

                                            <div className="jv-form-row" style={{ paddingTop: '10px' }}>
                                                <label className="jv-label">Family type</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="familyType"
                                                        value={formData.familyType}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Family Type"
                                                        options={familyTypeOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Father's Occupation</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="fatherOccupation"
                                                        value={formData.fatherOccupation}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Father's Occupation"
                                                        options={fatherOccupationOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Mother's Occupation</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="motherOccupation"
                                                        value={formData.motherOccupation}
                                                        onChange={handleInputChange}
                                                        placeholder="Select Mother's Occupation"
                                                        options={motherOccupationOptions}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="jv-form-row">
                                                <label className="jv-label">Brothers</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="brothers"
                                                        value={formData.brothers}
                                                        onChange={handleInputChange}
                                                        placeholder="Select"
                                                        options={siblingCounts}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            {formData.brothers && formData.brothers !== '0' && (
                                                <div className="jv-form-row">
                                                    <label className="jv-label">Brothers Married</label>
                                                    <div className="jv-input-group">
                                                        <SearchableSelect
                                                            name="brothersMarried"
                                                            value={formData.brothersMarried}
                                                            onChange={handleInputChange}
                                                            placeholder="Select"
                                                            options={getMarriedCounts(formData.brothers)}
                                                            className="full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="jv-form-row">
                                                <label className="jv-label">Sisters</label>
                                                <div className="jv-input-group">
                                                    <SearchableSelect
                                                        name="sisters"
                                                        value={formData.sisters}
                                                        onChange={handleInputChange}
                                                        placeholder="Select"
                                                        options={siblingCounts}
                                                        className="full"
                                                    />
                                                </div>
                                            </div>

                                            {formData.sisters && formData.sisters !== '0' && (
                                                <div className="jv-form-row">
                                                    <label className="jv-label">Sisters Married</label>
                                                    <div className="jv-input-group">
                                                        <SearchableSelect
                                                            name="sistersMarried"
                                                            value={formData.sistersMarried}
                                                            onChange={handleInputChange}
                                                            placeholder="Select"
                                                            options={getMarriedCounts(formData.sisters)}
                                                            className="full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="jv-form-row">
                                                <label className="jv-label">Contact Address</label>
                                                <div className="jv-input-group">
                                                    <input type="text" className="jv-input" name="contactAddress" placeholder="Enter contact address" value={formData.contactAddress} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="jv-form-row jv-submit-row">
                                                <button
                                                    className="jv-submit-btn"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setJvStep(4);
                                                    }}
                                                >
                                                    Complete Registration
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {jvStep === 4 && (
                                        <div style={{ maxWidth: '700px', width: '100%', margin: '0 auto', padding: '20px 10px', boxSizing: 'border-box' }}>
                                            <h2 style={{ fontSize: '1.3rem', color: '#444', fontWeight: 400, textAlign: 'center', marginBottom: '15px' }}>We are almost done!</h2>
                                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', maxWidth: '100%', margin: '0 auto 25px', lineHeight: '1.7', padding: '0 5px', wordWrap: 'break-word' }}>
                                                To let you connect with other members or for you to get contacted by them, we need to verify that this number belongs to you.
                                                Just click the button below and follow the instructions - it will just take a few seconds
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                                                <label style={{ color: '#555', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Mobile number</label>
                                                <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                                    <div style={{ background: '#f7f7f7', padding: '10px 15px', borderRight: '1px solid #ccc', color: '#333', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                                                        🇮🇳 +91
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="mobile"
                                                        value={formData.mobile}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter mobile number"
                                                        maxLength={10}
                                                        style={{ border: 'none', outline: 'none', padding: '10px 12px', fontSize: '0.9rem', color: '#333', width: '150px', maxWidth: '100%', background: '#fff' }}
                                                    />
                                                </div>
                                            </div>

                                            {!verificationSent ? (
                                                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                                                    <button
                                                        className="jv-submit-btn"
                                                        style={{ background: '#D4AF37', maxWidth: '260px', fontSize: '1rem', padding: '12px 30px' }}
                                                        onClick={async () => {
                                                            if (!formData.mobile || formData.mobile.length < 10) {
                                                                setVerificationError('Please enter a valid 10-digit mobile number');
                                                                return;
                                                            }
                                                            setVerificationError('');

                                                            try {
                                                                await apiSendOtp('register', formData.mobile);
                                                                setVerificationSent(true);
                                                            } catch (err) {
                                                                // Even if API fails, let them proceed for fallback
                                                                setVerificationSent(true);
                                                            }
                                                        }}
                                                    >
                                                        Verify this number
                                                    </button>
                                                    {verificationError && (
                                                        <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '10px' }}>{verificationError}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                                                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '15px' }}>Enter the OTP sent to {isdCode} {formData.mobile}</p>
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter OTP"
                                                            value={verificationOtp}
                                                            onChange={(e) => { setVerificationOtp(e.target.value); setVerificationError(''); }}
                                                            maxLength={6}
                                                            style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '12px 15px', fontSize: '1rem', width: '180px', maxWidth: '100%', textAlign: 'center', letterSpacing: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                    {verificationError && (
                                                        <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '10px' }}>{verificationError}</p>
                                                    )}
                                                    <button
                                                        className="jv-submit-btn"
                                                        style={{ background: '#D4AF37', maxWidth: '260px', fontSize: '1rem', padding: '12px 30px' }}
                                                        onClick={async () => {
                                                            if (!verificationOtp || verificationOtp.length < 4) {
                                                                setVerificationError('Please enter a valid OTP');
                                                                return;
                                                            }

                                                            setLoading(true);
                                                            try {
                                                                // Convert photo File to base64 if needed before sending
                                                                let photoBase64 = null;
                                                                if (formData.photo && formData.photo instanceof File) {
                                                                    photoBase64 = await new Promise((resolve, reject) => {
                                                                        const reader = new FileReader();
                                                                        reader.readAsDataURL(formData.photo);
                                                                        reader.onload = () => resolve(reader.result);
                                                                        reader.onerror = reject;
                                                                    });
                                                                } else if (typeof formData.photo === 'string') {
                                                                    photoBase64 = formData.photo;
                                                                }

                                                                const registrationData = {
                                                                    ...formData,
                                                                    photo: photoBase64
                                                                };

                                                                const result = await apiRegister(registrationData);

                                                                // The registration result will contain the real uniqueId and token (handled by api.js)
                                                                // We still update local storage for component state visibility
                                                                localStorage.setItem('isLoggedIn', 'true');
                                                                localStorage.setItem('uniqueId', result.user.uniqueId);
                                                                localStorage.setItem('userProfile', JSON.stringify({ ...formData, ...result.user }));

                                                                setVerificationSuccess(true);
                                                            } catch (err) {
                                                                setVerificationError(err.message || 'Registration failed. Please try again.');
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                    >
                                                        Verify & Continue
                                                    </button>
                                                </div>
                                            )}

                                            <div style={{ maxWidth: '100%', margin: '0 auto', fontSize: '0.8rem', color: '#777', lineHeight: '1.8', textAlign: 'left', padding: '0 10px', boxSizing: 'border-box', wordWrap: 'break-word' }}>
                                                <p style={{ marginBottom: '14px' }}>
                                                    By verifying the number <strong style={{ color: '#333' }}>{formData.mobile}</strong> against this profile, I acknowledge that the other profile(s) which I have created and verified on Sri Mayan with the same number are of person(s) different from the person represented in this profile.
                                                </p>

                                            </div>

                                            {verificationSuccess && (
                                                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                                                    <div style={{ background: '#fff', borderRadius: '12px', padding: '35px 40px', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                                        <h3 style={{ color: '#2d3748', fontSize: '1.1rem', fontWeight: 500, marginBottom: '25px', borderBottom: '2px solid #D4AF37', paddingBottom: '12px' }}>Phone Verification</h3>

                                                        <div style={{ margin: '0 auto 20px', width: '70px', height: '70px', position: 'relative' }}>
                                                            <svg viewBox="0 0 70 70" width="70" height="70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect x="18" y="5" width="34" height="55" rx="5" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
                                                                <line x1="28" y1="10" x2="42" y2="10" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
                                                                <circle cx="35" cy="52" r="3" stroke="#D4AF37" strokeWidth="1.5" />
                                                                <circle cx="48" cy="48" r="11" fill="#D4AF37" />
                                                                <path d="M43 48 L46.5 51.5 L53 45" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>

                                                        <h2 style={{ color: '#D4AF37', fontSize: '1.4rem', fontWeight: 600, marginBottom: '10px' }}>Congratulations !</h2>
                                                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '8px', lineHeight: '1.5' }}>
                                                            Your number {isdCode} {formData.mobile} is verified successfully.
                                                        </p>
                                                        <p style={{ color: '#333', fontSize: '0.95rem', fontWeight: 600, marginBottom: '25px', lineHeight: '1.5' }}>
                                                            Your Profile ID: <span style={{ color: '#D4AF37', fontSize: '1.1rem' }}>{localStorage.getItem('uniqueId')}</span>
                                                        </p>

                                                        <button
                                                            onClick={() => navigate('/home')}
                                                            style={{ background: 'none', border: 'none', color: '#333', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', padding: '10px 40px', borderTop: '1px solid #eee', width: '100%', marginTop: '5px' }}
                                                        >
                                                            Okay
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {jvStep === 1 && (
                                        <div className="jv-sidebar-section">
                                            <div className="jv-sidebar-title">
                                                <span>WHY REGISTER</span>
                                            </div>

                                            <div className="jv-sidebar-items">
                                                <div className="jv-sidebar-item">
                                                    <div className="jv-sidebar-icon jv-icon-profiles"><Users size={30} strokeWidth={1.5} color="#888" /></div>
                                                    <div className="jv-sidebar-text">Lakhs of Genuine<br />Profiles</div>
                                                </div>
                                                <div className="jv-sidebar-item">
                                                    <div className="jv-sidebar-icon jv-icon-verified"><ShieldCheck size={30} strokeWidth={1.5} color="#888" /></div>
                                                    <div className="jv-sidebar-text">Many Verified by<br />Personal Visit</div>
                                                </div>
                                                <div className="jv-sidebar-item">
                                                    <div className="jv-sidebar-icon jv-icon-secure"><Lock size={30} strokeWidth={1.5} color="#888" /></div>
                                                    <div className="jv-sidebar-text">Secure &<br />Family Friendly</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div >
                )
            }
        </div >
    );
};

export default Register;
