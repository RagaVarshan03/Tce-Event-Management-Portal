import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import './Auth.css';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [department, setDepartment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { email, password };
            if (role === 'coordinator') {
                payload.department = department;
            }
            const res = await API.post(`/auth/${role}/login`, payload);
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await API.post('/auth/google', {
                    accessToken: tokenResponse.access_token,
                    role: role
                });

                if (res.data.isNewUser) {
                    navigate('/signup', { state: { googleUser: res.data.user } });
                } else {
                    login(res.data.user, res.data.token);
                    navigate('/');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Google login failed.');
            }
        },
        onError: () => setError('Google Login Failed')
    });

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <h2>Login</h2>
                {error && (
                    <motion.div
                        className="error-msg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
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

                    {(role === 'student' || role === 'coordinator') && (
                        <>
                            <button
                                type="button"
                                className="google-auth-btn"
                                onClick={() => handleGoogleLogin()}
                            >
                                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="google-auth-icon" />
                                Continue with Google
                            </button>
                            <div className="auth-divider">or login with credentials</div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    {role === 'coordinator' && (
                        <div className="form-group">
                            <label>Department</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="CSE">Computer Science and Engineering (CSE)</option>
                                <option value="CSBS">Computer Science and Business Systems (CSBS)</option>
                                <option value="IT">Information Technology (IT)</option>
                                <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                                <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                                <option value="MECH">Mechanical Engineering (MECH)</option>
                                <option value="CIVIL">Civil Engineering (CIVIL)</option>
                            </select>
                        </div>
                    )}
                    <button type="submit" className="auth-btn">Login</button>
                </form>
                <p className="auth-link">Don't have an account? <a href="/signup">Sign up</a></p>
            </motion.div>
        </div>
    );
};

export default Login;
