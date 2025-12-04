import React, { useEffect, useState, useContext } from 'react';
// Removed duplicate import; useLocation will be imported with other router hooks
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenu();
    };

    // Scroll to section based on URL hash
    const location = useLocation();
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return (
        <header className="tce-header">
            {/* Top Header - White Background */}
            <div className="top-header">
                <div className="header-container">
                    <Link to="/" className="navbar-logo">
                        <img src="/tce_header.png" alt="TCE Banner" className="logo-banner" />
                    </Link>
                    <div className="top-nav">
                        {user ? (
                            <>
                                <span className="user-greeting">Hi, {user.role === 'coordinator' ? 'Coordinator' : user.name || user.email?.split('@')[0]}</span>
                                <button onClick={handleLogout} className="logout-btn-top">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="top-nav-link">Login</Link>
                                <Link to="/signup" className="top-nav-link">Signup</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation - Maroon Background */}
            <nav className="main-nav">
                <div className="nav-container">
                    <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
                        <span className={isMenuOpen ? 'active' : ''}></span>
                        <span className={isMenuOpen ? 'active' : ''}></span>
                        <span className={isMenuOpen ? 'active' : ''}></span>
                    </button>

                    <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                        <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
                        {user && (
                            <>
                                {user.role === 'student' && <Link to="/student/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>}
                                {user.role === 'coordinator' && <Link to="/coordinator/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>}
                                {user.role === 'admin' && <Link to="/admin/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>}
                            </>
                        )}

                        <Link to="/#contact" className="nav-link" onClick={closeMenu}>Contact</Link>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
