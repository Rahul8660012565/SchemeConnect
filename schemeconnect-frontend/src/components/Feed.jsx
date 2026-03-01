import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SchemeCard from './SchemeCard';
import { LanguageContext } from '../App'; 
import { Search, Filter, User, Database, Zap, Home, Bookmark, Settings, LogOut, ShieldCheck, Phone, MapPin, Briefcase, MessageSquare, X, Send } from 'lucide-react';

const extraStyles = `
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .sidebar-link { display: flex; alignItems: center; gap: 0.75rem; padding: 0.875rem 1rem; border-radius: 12px; color: #475569; font-weight: 600; font-size: 1rem; transition: all 0.2s ease; cursor: pointer; text-decoration: none; border: none; background: transparent; width: 100%; text-align: left; }
  .sidebar-link:hover { background-color: #eff6ff; color: #2563eb; transform: translateX(4px); }
  .sidebar-link.active { background-color: #2563eb; color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
  .settings-input { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; background-color: #f8fafc; color: #64748b; margin-top: 0.5rem; }
  @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  .toast-enter { animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .bot-window { animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: bottom right; }
`;

// TRANSLATION DICTIONARY
const translations = {
  en: { dash: "My Dashboard", saved: "Saved Schemes", settings: "Profile Settings", accuracy: "Profile Accuracy", verified: "Verified Citizen", search: "Search schemes...", matches: "Recommended Matches", empty: "No active schemes found", logout: "Secure Logout", botGreeting: "Hi! I'm powered by Gemini. Ask me anything about your eligibility!" },
  hi: { dash: "मेरा डैशबोर्ड", saved: "सहेजी गई योजनाएं", settings: "प्रोफ़ाइल सेटिंग्स", accuracy: "प्रोफ़ाइल सटीकता", verified: "सत्यापित नागरिक", search: "योजनाएं खोजें...", matches: "अनुशंसित योजनाएं", empty: "कोई सक्रिय योजना नहीं मिली", logout: "लॉग आउट", botGreeting: "नमस्ते! मैं जेमिनी द्वारा संचालित हूं। अपनी पात्रता के बारे में मुझसे कुछ भी पूछें!" },
  kn: { dash: "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", saved: "ಉಳಿಸಿದ ಯೋಜನೆಗಳು", settings: "ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", accuracy: "ಪ್ರೊಫೈಲ್ ನಿಖರತೆ", verified: "ಪರಿಶೀಲಿಸಿದ ನಾಗರಿಕ", search: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ...", matches: "ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆಗಳು", empty: "ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ", logout: "ಲಾಗ್ ಔಟ್", botGreeting: "ನಮಸ್ಕಾರ! ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ!" }
};

const SkeletonCard = () => (
  <div className="animate-pulse" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}><div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#e2e8f0' }}></div><div style={{ flex: 1 }}><div style={{ height: '1.2rem', backgroundColor: '#e2e8f0', borderRadius: '6px', width: '70%', marginBottom: '0.6rem' }}></div><div style={{ height: '0.9rem', backgroundColor: '#e2e8f0', borderRadius: '6px', width: '40%' }}></div></div></div>
    <div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '6px', width: '100%', marginBottom: '0.6rem' }}></div><div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '6px', width: '85%', marginBottom: '1.5rem' }}></div><div style={{ height: '3rem', backgroundColor: '#e2e8f0', borderRadius: '12px', width: '100%' }}></div>
  </div>
);

const Feed = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext); 
  const t = translations[lang]; 

  const [feedData, setFeedData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Start with Mock Data true by default for safe testing
  const [useMockData, setUseMockData] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [toastMessage, setToastMessage] = useState(null);
  const toastTimer = useRef(null); 

  // --- AI CHATBOT STATE ---
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [savedSchemes, setSavedSchemes] = useState(() => {
    const localData = localStorage.getItem(`savedSchemes_${userId}`);
    return localData ? JSON.parse(localData) : [];
  });

  const filters = ['All', 'Age', 'Caste/Category', 'Occupation', 'Region'];

  const calculateProfileCompletion = () => {
    if (!userData) return 0;
    const fields = ['full_name', 'phone_number', 'occupation_category', 'occupation_detail', 'age', 'region', 'state', 'country', 'income_bracket', 'caste', 'religion', 'profile_picture'];
    let filledCount = 0;
    fields.forEach(key => { if (userData[key] && userData[key].toString().trim() !== '') filledCount++; });
    return Math.round((filledCount / fields.length) * 100);
  };
  
  const completionScore = calculateProfileCompletion();

  useEffect(() => { localStorage.setItem(`savedSchemes_${userId}`, JSON.stringify(savedSchemes)); }, [savedSchemes, userId]);
  
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isBotTyping]);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSaveScheme = (scheme) => {
    setSavedSchemes(prev => {
      const isAlreadySaved = prev.some(s => s.title === scheme.title);
      if (isAlreadySaved) {
        showToast("Removed from saved schemes");
        return prev.filter(s => s.title !== scheme.title);
      } else {
        showToast(`✅ ${scheme.title.substring(0, 20)}... saved!`);
        return [...prev, scheme];
      }
    });
  };

  const fetchSchemes = async (query = '', filter = 'All', isMock = useMockData) => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/feed/${userId}`, { searchQuery: query, activeFilter: filter, useMockData: isMock });
      setUserData(response.data.user);
      setFeedData(response.data.feed || []);
    } catch (error) { 
      console.error('Error fetching feed:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (activeTab === 'dashboard') fetchSchemes(searchInput, activeFilter, useMockData); 
  }, [userId, useMockData, activeTab]);

  const handleSearchSubmit = (e) => { 
    e.preventDefault(); 
    fetchSchemes(searchInput, activeFilter, useMockData); 
  };

  // --- AI CHAT LOGIC ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsBotTyping(true);

    try {
      const response = await axios.post(`http://localhost:5000/api/chat/${userId}`, { message: userMsg });
      setChatMessages(prev => [...prev, { role: 'bot', text: response.data.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Sorry, I am having trouble connecting to the network right now." }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', position: 'relative' }}>
      <style>{extraStyles}</style>

      {/* LEFT COLUMN: Sidebar */}
      <div style={{ width: '280px', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden', backgroundColor: '#e2e8f0', border: '3px solid white' }}>
            {userData?.profile_picture ? <img src={userData.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="#64748b" />}
          </div>
          <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '800' }}>{userData?.full_name || 'Citizen'}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '1.25rem' }}><ShieldCheck size={14} /> {t.verified}</div>
          
          <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}><span>{t.accuracy}</span><span style={{ color: completionScore === 100 ? '#10b981' : '#2563eb' }}>{completionScore}%</span></div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}><div style={{ width: `${completionScore}%`, height: '100%', backgroundColor: completionScore === 100 ? '#10b981' : '#2563eb', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div></div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={20} /> {t.dash}</button>
          <button className={`sidebar-link ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}><Bookmark size={20} /> {t.saved} {savedSchemes.length > 0 && <span style={{ marginLeft: 'auto', backgroundColor: activeTab === 'saved' ? 'rgba(255,255,255,0.2)' : '#e0e7ff', color: activeTab === 'saved' ? 'white' : '#4f46e5', padding: '0.1rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem' }}>{savedSchemes.length}</span>}</button>
          <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20} /> {t.settings}</button>
        </nav>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 🚀 BULLETPROOF TOGGLE BUTTON 🚀 */}
          <button 
            onClick={() => {
              const newState = !useMockData;
              setUseMockData(newState);
              // Force the app to immediately fetch the new data
              fetchSchemes(searchInput, activeFilter, newState);
            }} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              padding: '0.875rem', 
              backgroundColor: useMockData ? '#fef2f2' : '#ecfdf5', 
              color: useMockData ? '#dc2626' : '#059669', 
              border: `1px solid ${useMockData ? '#fca5a5' : '#a7f3d0'}`, 
              borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', transition: 'all 0.2s' 
            }}
          >
            {useMockData ? <Zap size={18} /> : <Database size={18} />} 
            {useMockData ? 'Click for LIVE AI' : 'Click for MOCK DATA'}
          </button>

          <button onClick={() => navigate('/')} className="sidebar-link" style={{ color: '#ef4444' }}><LogOut size={20} /> {t.logout}</button>
        </div>
      </div>

      {/* RIGHT COLUMN: Feed Content */}
      <div style={{ flex: 1, maxWidth: '750px', paddingBottom: '4rem' }}>
        
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={22} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
                  <input type="text" placeholder={t.search} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '1.05rem', outline: 'none', backgroundColor: '#f8fafc' }} />
                </div>
                <button type="submit" style={{ padding: '0 2rem', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)' }}>Search</button>
              </form>
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                <Filter size={20} style={{ color: '#64748b', alignSelf: 'center', marginRight: '0.25rem' }} />
                {filters.map(filter => (
                  <button key={filter} onClick={() => {setActiveFilter(filter); fetchSchemes(searchInput, filter, useMockData);}} style={{ whiteSpace: 'nowrap', padding: '0.5rem 1.25rem', borderRadius: '20px', border: activeFilter === filter ? 'none' : '1px solid #e2e8f0', backgroundColor: activeFilter === filter ? '#1e40af' : '#f8fafc', color: activeFilter === filter ? 'white' : '#475569', cursor: 'pointer', fontWeight: activeFilter === filter ? '700' : '600' }}>{filter}</button>
                ))}
              </div>
            </div>

            <h3 style={{ margin: '0 0 1.25rem 0', color: '#334155', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} color="#eab308" /> {t.matches}</h3>

            <div>
              {loading ? <><SkeletonCard /><SkeletonCard /></> : feedData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {feedData.map((scheme, index) => <SchemeCard key={index} scheme={scheme} isSaved={savedSchemes.some(s => s.title === scheme.title)} onToggleSave={toggleSaveScheme} />)}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' }}><Database size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} /><h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>{t.empty}</h3></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bookmark size={24} color="#2563eb" /> {t.saved}</h2>
              {savedSchemes.length > 0 ? <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>{savedSchemes.map((scheme, index) => <SchemeCard key={`saved-${index}`} scheme={scheme} isSaved={true} onToggleSave={toggleSaveScheme} />)}</div> : <p>No saved schemes yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
             <h2 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={24} color="#2563eb" /> {t.settings}</h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div><label style={{ fontWeight: '700', fontSize: '0.9rem' }}><User size={16} style={{marginRight: '0.4rem'}}/> Name</label><input className="settings-input" value={userData?.full_name || ''} readOnly /></div>
               <div><label style={{ fontWeight: '700', fontSize: '0.9rem' }}><Phone size={16} style={{marginRight: '0.4rem'}}/> Phone</label><input className="settings-input" value={userData?.phone_number || ''} readOnly /></div>
               <div><label style={{ fontWeight: '700', fontSize: '0.9rem' }}><Briefcase size={16} style={{marginRight: '0.4rem'}}/> Occupation</label><input className="settings-input" value={userData?.occupation_category || ''} readOnly /></div>
               <div><label style={{ fontWeight: '700', fontSize: '0.9rem' }}><MapPin size={16} style={{marginRight: '0.4rem'}}/> Location</label><input className="settings-input" value={`${userData?.region}, ${userData?.state}`} readOnly /></div>
             </div>
           </div>
        )}
      </div>

      {toastMessage && <div className="toast-enter" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, fontWeight: '600' }}>{toastMessage}</div>}

      {/* FULLY FUNCTIONAL AI BOT WIDGET */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
        {isBotOpen && (
          <div className="bot-window" style={{ width: '350px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', marginBottom: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} color="#fde047" /><span style={{ fontWeight: '700' }}>Gemini SchemeBot</span></div>
              <button onClick={() => setIsBotOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ height: '300px', padding: '1rem', backgroundColor: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#e2e8f0', padding: '0.75rem 1rem', borderRadius: '15px', borderBottomLeftRadius: '0', fontSize: '0.9rem', color: '#1e293b' }}>
                {t.botGreeting}
              </div>
              
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
                  backgroundColor: msg.role === 'user' ? '#2563eb' : '#e2e8f0', 
                  color: msg.role === 'user' ? 'white' : '#1e293b', 
                  padding: '0.75rem 1rem', borderRadius: '15px', 
                  borderBottomRightRadius: msg.role === 'user' ? '0' : '15px', 
                  borderBottomLeftRadius: msg.role === 'bot' ? '0' : '15px', 
                  fontSize: '0.9rem', maxWidth: '85%', lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
              ))}
              
              {isBotTyping && <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: '#64748b' }}>SchemeBot is typing...</div>}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
              <input 
                type="text" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about schemes..." 
                style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none' }} 
              />
              <button onClick={handleSendMessage} disabled={isBotTyping} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isBotTyping ? 0.5 : 1 }}><Send size={16} /></button>
            </div>
          </div>
        )}
        <button onClick={() => setIsBotOpen(!isBotOpen)} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1e40af', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30, 64, 175, 0.4)', transition: 'transform 0.2s', transform: isBotOpen ? 'scale(0.9)' : 'scale(1)' }}>
          {isBotOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>

    </div>
  );
};

export default Feed;