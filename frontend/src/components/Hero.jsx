import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-bg-carousel">
        <div className="hero-bg-image active"></div>
      </div>
      <div className="hero-overlay"></div>
      <div className="container hero-content">
        <h1 className="hero-title animate-fade-in-up">
          Discover a Love <br />
          <span className="text-gradient script-font">Written in the Stars</span>
        </h1>
        <p className="hero-subtitle animate-fade-in-up delay-100">
          The most trusted platform for happy marriages. <br />
          Find your perfect match with Sri Mayan Matrimony.
        </p>

        <div className="cta-container animate-fade-in-up delay-200">
          <button
            onClick={() => navigate('/search')}
            className="btn btn-primary btn-lg search-btn"
          >
            <Search size={24} />
            Find the one meant for you
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
