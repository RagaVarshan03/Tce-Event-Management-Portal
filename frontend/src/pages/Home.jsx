import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import StudentHome from '../components/StudentHome';
import CoordinatorHome from '../components/CoordinatorHome';
import AdminHome from '../components/AdminHome';
import tceLogo from '../assets/tce_logo_contact.png';

import { motion } from 'framer-motion';

const Home = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();


    if (loading) {
        return <div>Loading...</div>;
    }

    if (user) {
        if (user.role === 'student') return <StudentHome />;
        if (user.role === 'coordinator') return <CoordinatorHome />;
        if (user.role === 'admin') return <AdminHome />;
    }

    return (
        <div className="home-container">
            <motion.header
                className="hero-section"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800' }}>Department of Computer Science and Business Systems</h1>
                <p style={{ fontSize: '1.4rem', fontWeight: '500', opacity: '0.95' }}>Thiagarajar College of Engineering, Madurai - 625015</p>

            </motion.header>



            {/* Contact Information */}
            <motion.section
                id="contact"
                className="contact-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{
                    background: 'white',
                    padding: '40px 20px',
                    borderRadius: '12px',
                    marginTop: '40px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
            >
                <h2 style={{ color: '#830000', marginBottom: '20px' }}>Contact Information</h2>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <img src={tceLogo} alt="TCE Logo" style={{ width: '120px', marginBottom: '15px' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>Thiagarajar College of Engineering</p>
                    <p>Madurai - 625 015</p>
                    <p>Tamil Nadu, India</p>
                    <p style={{ marginTop: '15px' }}>📞 <strong>+91 452 2482240</strong></p>
                    <p>🌐 <a href="http://www.tce.edu" target="_blank" rel="noopener noreferrer" style={{ color: '#830000', textDecoration: 'none' }}>www.tce.edu</a></p>
                </div>
            </motion.section>
        </div>
    );
};

export default Home;
