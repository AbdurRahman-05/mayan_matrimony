import React from 'react';
import { Heart, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, path) => {
    e.preventDefault();
    
    // Membership and Legal pages are accessible without login
    if (path === '/membership' || path === '/terms' || path === '/privacy' || path === '/refund' || path === '/security') {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isAuthenticated()) {
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Find existing button to open the form if needed
        const registerBtn = document.querySelector('.ts-hero-btn, .landing-nav-register');
        if (registerBtn) {
          registerBtn.click();
        }
      } else {
        navigate('/', { state: { showRegister: true } });
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-content">
          {/* Brand */}
          <div className="footer-brand">
            <img src="/logo.png" alt="Sri Mayan" style={{ width: '120px', height: 'auto', marginBottom: '8px', filter: 'brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            <p className="brand-subtitle">
              Building bonds of love and trust. <br /> Since 2024.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon"><Facebook size={20} /></a>
              <a href="#" className="social-icon"><Twitter size={20} /></a>
              <a href="#" className="social-icon"><Instagram size={20} /></a>
              <a href="#" className="social-icon"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h3>Explore</h3>
            <ul>
              <li><a href="/home" onClick={(e) => handleNavClick(e, '/home')}>Home</a></li>
              <li><a href="/search" onClick={(e) => handleNavClick(e, '/search')}>Search</a></li>
              <li><a href="/matches" onClick={(e) => handleNavClick(e, '/matches')}>Matches</a></li>
              <li><a href="/interests" onClick={(e) => handleNavClick(e, '/interests')}>Interest</a></li>
              <li><a href="/chat" onClick={(e) => handleNavClick(e, '/chat')}>Chat</a></li>
              {/* <li><a href="/membership" onClick={(e) => handleNavClick(e, '/membership')}>Membership</a></li> */}
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-links">
            <h3>Legal</h3>
            <ul>
              <li><a href="/terms" onClick={(e) => handleNavClick(e, '/terms')}>Terms of Service</a></li>
              <li><a href="/privacy" onClick={(e) => handleNavClick(e, '/privacy')}>Privacy Policy</a></li>
              <li><a href="/refund" onClick={(e) => handleNavClick(e, '/refund')}>Refund Policy</a></li>
              <li><a href="/security" onClick={(e) => handleNavClick(e, '/security')}>Security Tips</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <div className="contact-center-info">
              <h4 className="center-name">Sri Mayan Jothida Nilayam</h4>
              <p className="consultant-name">
                A.S.Sivadasan - Ragothaman <span className="qualification">BE(EEE), D.Astro</span>
              </p>
            </div>
            <div className="contact-item">
              <MapPin size={18} className="contact-icon" />
              <span>Govindappa Naicken 1st Cross St, Alappakam, Porur, Chennai, Tamil Nadu 600116</span>
            </div>
            <div className="contact-item">
              <Phone size={18} className="contact-icon" />
              <div className="contact-phone-block">
                <span className="consultation-note">For online or direct consultations please contact us:</span>
                <a href="tel:+919884014363" className="contact-link contact-phone">+91 98840 14363</a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Sri Mayan Matrimony. All rights reserved.</p>
          <div className="heart-msg">
            Made with <Heart size={14} fill="#e74c3c" color="#e74c3c" /> in India
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
