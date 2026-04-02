import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './utils/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Output from './pages/Output';
import CoverLetter from './pages/CoverLetter';
import ATSAnalyzer from './pages/ATSAnalyzer';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              background: '#2a2825',
              color: '#f5f5f0',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/output/:id" element={<Output />} />
            <Route path="/cover-letter" element={<CoverLetter />} />
            <Route path="/ats-analyzer" element={<ATSAnalyzer />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
