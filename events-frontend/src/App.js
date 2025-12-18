import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap is ready

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default Route: Redirects to the Login Page */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Interface 1: Login Page */}
          <Route path="/login" element={<Login />} />
          
          {/* Interface 2: Event List Page (Displays MongoDB Data) */}
          <Route path="/events" element={<EventList />} />
          
          {/* Interface 3: Event Details Page (Placeholder for participant list) */}
          <Route path="/details/:id" element={<EventDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;