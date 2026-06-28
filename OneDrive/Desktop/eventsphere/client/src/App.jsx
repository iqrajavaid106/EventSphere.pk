import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import Organizer from './pages/Organizer';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />

          <Route
            path="/my-tickets"
            element={<ProtectedRoute><MyTickets /></ProtectedRoute>}
          />
          <Route
            path="/organizer"
            element={<ProtectedRoute roles={['organizer', 'admin']}><Organizer /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <h1>404</h1>
      <p style={{ color: 'var(--text-secondary)' }}>This page doesn't exist.</p>
    </div>
  );
}
