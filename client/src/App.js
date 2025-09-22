import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/radix.css';
import ManagerDashboard from './components/ManagerDashboard';
import PropertyReviewDisplay from './components/PropertyReviewDisplay';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="/property/:propertyId" element={<PropertyReviewDisplay />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
