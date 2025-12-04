import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './Auth.css';

import { motion } from 'framer-motion';

const Signup = () => {
    const [role, setRole] = useState('student');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        registerNo: '',
        department: '',
        year: '1st'
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            if (role === 'student') endpoint = '/auth/student/register';
            else if (role === 'coordinator') endpoint = '/auth/coordinator/register';
            else endpoint = '/auth/admin/register';
            await API.post(endpoint, formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed. Please check your details.');
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>{role.charAt(0).toUpperCase() + role.slice(1)} Signup</h2>
                {error && (
                    <motion.div
                        className="error-msg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {error}
                    </motion.div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="student">Student</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" name="name" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" onChange={handleChange} required />
                    </div>
                    {role === 'student' && (
                        <>
                            <div className="form-group">
                                <label>Register Number</label>
                                <input type="text" name="registerNo" onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Year</label>
                                <select name="year" value={formData.year} onChange={handleChange}>
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                </select>
                            </div>
                        </>
                    )}
                    {role !== 'admin' && (
                        <div className="form-group">
                            <label>Department</label>
                            <input type="text" name="department" onChange={handleChange} required />
                        </div>
                    )}
                    <button type="submit" className="auth-btn">Sign Up</button>
                </form>
                <p className="auth-link">Already have an account? <a href="/login">Login</a></p>
            </motion.div>
        </div>
    );
};

export default Signup;
