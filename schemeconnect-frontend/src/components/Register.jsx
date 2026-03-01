import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'student',
    age: '',
    income_bracket: '',
    state: 'Karnataka',
    preferred_language: 'english'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/register', formData);
      // Navigate to the dynamic feed using the newly created user's ID
      navigate(`/feed/${response.data.userId}`);
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>Create Your Citizen Profile</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <input type="text" name="full_name" placeholder="Full Name" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        
        <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '0.5rem' }}>
          <option value="student">Student</option>
          <option value="employee">Employee</option>
          <option value="daily_worker">Daily Wage Worker</option>
          <option value="farmer">Farmer</option>
        </select>

        <input type="number" name="age" placeholder="Age" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        
        <input type="text" name="income_bracket" placeholder="Income (e.g., 'Below 2 LPA')" onChange={handleChange} required style={{ padding: '0.5rem' }} />
        
        <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required style={{ padding: '0.5rem' }} />

        <select name="preferred_language" value={formData.preferred_language} onChange={handleChange} style={{ padding: '0.5rem' }}>
          <option value="english">English</option>
          <option value="telugu">Telugu</option>
          <option value="kannada">Kannada</option>
        </select>

        <button type="submit" disabled={loading} style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Setting up Profile...' : 'Discover My Schemes'}
        </button>
      </form>
    </div>
  );
};

export default Register;