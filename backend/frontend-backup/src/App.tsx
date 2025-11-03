import React from 'react';
import AuthForm from './components/AuthForm';
import TenantDashboard from './components/TenantDashboard';
import StoryboardForm from './components/StoryboardForm';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/tenants" element={<TenantDashboard />} />
        <Route path="/storyboard" element={<StoryboardForm />} />
      </Routes>
    </Router>
  );
}

export default App;
