import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import { SocketProvider } from './context/SocketContext.jsx';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/student/dashboard" element={
                  <PrivateRoute role="student">
                    <StudentDashboard />
                  </PrivateRoute>
                } />

                <Route path="/coordinator/dashboard" element={
                  <PrivateRoute role="coordinator">
                    <CoordinatorDashboard />
                  </PrivateRoute>
                } />

                <Route path="/admin/dashboard" element={
                  <PrivateRoute role="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                } />
              </Routes>
            </main>
            <footer style={{ textAlign: 'center', padding: '20px', background: '#1a1a1a', color: '#fff', marginTop: 'auto' }}>
              <p>&copy; {new Date().getFullYear()} Thiagarajar College of Engineering. All rights reserved.</p>
            </footer>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
