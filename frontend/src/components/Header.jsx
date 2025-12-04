import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="tce-header">
            <div className="top-header">
                <div className="header-container">
                    <div className="logos-section">
                        <div className="tce-logo">
                            <img src="/tce_logo.png" alt="TCE Logo" />
                            <div className="tce-text">
                                <h1>Thiagarajar</h1>
                                <p>College of Engineering</p>
                                <span>MADURAI</span>
                            </div>
                        </div>
                        <div className="accreditation-logos">
                            <img src="/naac_logo.png" alt="NAAC A++" className="cert-logo" />
                            <img src="/nba_logo.png" alt="NBA" className="cert-logo" />
                            <img src="/nirf_logo.png" alt="NIRF" className="cert-logo" />
                            <img src="/iic_logo.png" alt="IIC" className="cert-logo" />
                        </div>
                    </div>
                    <div className="top-nav">
                        <a href="#students">Students</a>
                        <a href="#faculty">Faculty</a>
                        <a href="#parents">Parents</a>
                        <a href="#alumni">Alumni</a>
                        <a href="#career">Career</a>
                        <a href="#iic">IIC</a>
                        <a href="#nirf">NIRF</a>
                        <a href="#naac">NAAC Q</a>
                    </div>
                </div>
            </div>
            <nav className="main-nav">
                <div className="nav-container">
                    <a href="#home">Home</a>
                    <a href="#about">About us</a>
                    <a href="#academics">Academics</a>
                    <a href="#admission">Admission</a>
                    <a href="#career-dev">Career Development Cell</a>
                    <a href="#research">Research</a>
                    <a href="#campus">Campus Life</a>
                    <a href="#industry">Industry</a>
                    <a href="#nodal">Nodal Centres</a>
                    <a href="#iqac">IQAC</a>
                </div>
            </nav>
        </header>
    );
};

export default Header;
