import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Feed from './components/Feed';
import { Globe } from 'lucide-react';

// Create a Global Language Context
export const LanguageContext = createContext();

function App() {
  const [lang, setLang] = useState('en'); // Default to English

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <Router>
        <div style={{ 
          width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc',
          backgroundImage: `radial-gradient(at 0% 0%, #ffffff 0px, transparent 50%), radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), radial-gradient(at 100% 100%, #e2e8f0 0px, transparent 50%), radial-gradient(at 0% 100%, #dbeafe 0px, transparent 50%)`,
          backgroundAttachment: 'fixed', display: 'flex', flexDirection: 'column'
        }}>
          
          <header style={{ 
            width: '100%', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            padding: '1rem 0', color: 'white', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: '0 0 0.1rem 0', fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  SchemeConnect
                </h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500', letterSpacing: '0.02em' }}>
                  Connecting citizens to the benefits they deserve.
                </p>
              </div>

              {/* Functional Language Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Globe size={16} color="#93c5fd" />
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value)}
                  style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', appearance: 'none', paddingRight: '0.5rem' }}
                >
                  <option value="en" style={{color: 'black'}}>English</option>
                  <option value="hi" style={{color: 'black'}}>हिन्दी (Hindi)</option>
                  <option value="kn" style={{color: 'black'}}>ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>

            </div>
          </header>
          
          <main style={{ flex: 1, width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/feed/:userId" element={<Feed />} />
            </Routes>
          </main>
          
        </div>
      </Router>
    </LanguageContext.Provider>
  );
}

export default App;