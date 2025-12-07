import React, { useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import UserDashboard from './components/UserDashboard';
import { User, UserRole } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleRegistrationComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentUser.role === UserRole.ADMIN) {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // Regular User Flow
  if (currentUser.isFirstAccess || !currentUser.personalData) {
    return <UserRegistration user={currentUser} onComplete={handleRegistrationComplete} />;
  }

  return <UserDashboard user={currentUser} onLogout={handleLogout} />;
}

export default App;