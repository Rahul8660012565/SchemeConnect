import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera } from 'lucide-react';

const inputStyle = {
  padding: '0.875rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '0.95rem', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%', boxSizing: 'border-box'
};

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Auth = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '', phone_number: '', password: '', occupation_category: 'student',
    occupation_detail: '', age: '', caste: '', religion: '', region: '', 
    state: 'Karnataka', country: 'India', income_bracket: '', profile_picture: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // THE HACKATHON MAGIC: Convert image to Base64 text
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // Limit to 2MB to prevent database crashing
        setErrorMsg('Image is too large. Please select a picture under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:5000/api/login', { phone_number: formData.phone_number, password: formData.password });
        navigate(`/feed/${response.data.userId}`);
      } else {
        const response = await axios.post('http://localhost:5000/api/register', formData);
        navigate(`/feed/${response.data.userId}`);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.8)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: '#1e293b', fontWeight: '800' }}>
          {isLogin ? 'Welcome Back' : 'Create Your Civic Profile'}
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          {isLogin ? 'Sign in to discover your personalized schemes.' : 'Join to unlock government benefits tailored to you.'}
        </p>
      </div>

      <div style={{ display: 'flex', marginBottom: '2rem', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '0.25rem' }}>
        <button onClick={() => { setIsLogin(true); setErrorMsg(''); }} style={{ flex: 1, padding: '0.75rem', background: isLogin ? 'white' : 'transparent', border: 'none', borderRadius: '10px', fontWeight: isLogin ? '700' : '500', color: isLogin ? '#2563eb' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isLogin ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Sign In</button>
        <button onClick={() => { setIsLogin(false); setErrorMsg(''); }} style={{ flex: 1, padding: '0.75rem', background: !isLogin ? 'white' : 'transparent', border: 'none', borderRadius: '10px', fontWeight: !isLogin ? '700' : '500', color: !isLogin ? '#2563eb' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', boxShadow: !isLogin ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Sign Up</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMsg && <div style={{ padding: '0.875rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', fontSize: '0.9rem', border: '1px solid #fee2e2', fontWeight: '500', textAlign: 'center' }}>{errorMsg}</div>}

        {/* PROFILE PICTURE UPLOAD UI */}
        {!isLogin && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed #94a3b8', position: 'relative' }}
            >
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={28} color="#64748b" />
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Tap to upload photo (Optional)</span>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
        )}

        <div><input type="tel" name="phone_number" placeholder="Phone Number (e.g., 9876543210)" value={formData.phone_number} onChange={handleChange} required style={inputStyle} /></div>
        <div><input type="password" name="password" placeholder="Secure Password" value={formData.password} onChange={handleChange} required style={inputStyle} /></div>

        {!isLogin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease-in-out' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ height: '1px', backgroundColor: '#e2e8f0', flex: 1 }}></div>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Demographics</span>
              <div style={{ height: '1px', backgroundColor: '#e2e8f0', flex: 1 }}></div>
            </div>
            
            <input type="text" name="full_name" placeholder="Full Legal Name" value={formData.full_name} onChange={handleChange} required style={inputStyle} />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select name="occupation_category" value={formData.occupation_category} onChange={handleChange} style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                <option value="student">Student</option>
                <option value="employee">Employee</option>
                <option value="daily_worker">Daily Worker</option>
                <option value="farmer">Farmer</option>
                <option value="other">Other</option>
              </select>
              <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required style={{ ...inputStyle, flex: 1 }} />
            </div>

            <input type="text" name="occupation_detail" placeholder="Occupation Specifics (e.g., 3rd-year B.Tech CSE)" value={formData.occupation_detail} onChange={handleChange} required style={inputStyle} />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" name="caste" placeholder="Category/Caste (Optional)" value={formData.caste} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
              <input type="text" name="religion" placeholder="Religion (Optional)" value={formData.religion} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
            </div>

            {/* NEW: Country and State Selectors */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select name="country" value={formData.country} onChange={handleChange} required style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
              <select name="state" value={formData.state} onChange={handleChange} required style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                <option value="" disabled>Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <input type="text" name="region" placeholder="District/City" value={formData.region} onChange={handleChange} required style={inputStyle} />
            <input type="text" name="income_bracket" placeholder="Annual Family Income (e.g., Below 2 LPA)" value={formData.income_bracket} onChange={handleChange} required style={inputStyle} />
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', marginTop: '0.5rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Authenticating...' : (isLogin ? 'Sign In to Dashboard' : 'Create Civic Profile')}
        </button>
      </form>
    </div>
  );
};

export default Auth;