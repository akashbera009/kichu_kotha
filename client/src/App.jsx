import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Loading from './components/Common/Loading';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Chat from './components/Chat/Chat';
import './App.css';
// import { FCMProvider } from './context/FCMContext';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <SocketProvider>
                  <Chat />
                </SocketProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/chat" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;