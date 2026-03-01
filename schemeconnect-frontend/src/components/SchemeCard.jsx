import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, FileText, Calendar, Compass, Bookmark, Landmark, Share2 ,Zap } from 'lucide-react';

const cardHoverStyle = `
  .scheme-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .scheme-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08); border-color: #bfdbfe; }
  
  @keyframes urgentPulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  .urgent-deadline { animation: urgentPulse 2s infinite; }
`;

const SchemeCard = ({ scheme, isSaved, onToggleSave }) => {
  const [expanded, setExpanded] = useState(false);

  // ALGORITHM: Real Date Parsing for the 7-Day Pulse Feature
  const checkUrgency = (deadlineStr) => {
    if (!deadlineStr || deadlineStr.toLowerCase() === 'ongoing') return false;
    
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate)) return false; // If the AI outputs a weird string, ignore it
    
    const today = new Date();
    // Calculate difference in milliseconds, then convert to days
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Trigger pulse ONLY if deadline is between 0 and 7 days from right now
    return diffDays >= 0 && diffDays <= 7;
  };

  const isUrgent = checkUrgency(scheme.deadline);

  return (
    <div className="scheme-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb' }}>
      <style>{cardHoverStyle}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}><Landmark size={24} strokeWidth={1.5} /></div>
          <div>
            {/* DYNAMIC MATCH BADGE */}
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.4rem',
              backgroundColor: scheme.match_level === 'Perfect Match' ? '#dcfce7' : '#fef3c7', 
              color: scheme.match_level === 'Perfect Match' ? '#166534' : '#92400e', 
              border: `1px solid ${scheme.match_level === 'Perfect Match' ? '#bbf7d0' : '#fde68a'}` 
            }}>
              <Zap size={12} fill="currentColor" /> {scheme.match_level || 'Recommended Match'}
            </div>
            
            <h3 style={{ margin: '0 0 0.2rem 0', color: '#111827', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{scheme.title}</h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}><CheckCircle size={14} color="#10b981" /> Verified Gov Portal</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', transition: 'color 0.2s' }}><Share2 size={20} /></button>
          <button onClick={() => onToggleSave(scheme)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#2563eb' : '#9ca3af', transition: 'all 0.2s transform' }}>
            <Bookmark size={22} fill={isSaved ? '#2563eb' : 'none'} style={{ transform: isSaved ? 'scale(1.1)' : 'scale(1)' }} />
          </button>
        </div>
      </div>

      <p style={{ margin: '0 0 1.25rem 0', color: '#4b5563', lineHeight: '1.6', fontSize: '1rem' }}>{scheme.short_description}</p>
      
      {/* Dynamic Urgent Pulse UI */}
      <div className={isUrgent ? "urgent-deadline" : ""} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: isUrgent ? '#fef2f2' : '#f8fafc', color: isUrgent ? '#dc2626' : '#475569', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', border: `1px solid ${isUrgent ? '#fee2e2' : '#e2e8f0'}` }}>
        <Calendar size={14} /> Deadline: {scheme.deadline} {isUrgent && "(Closing Soon!)"}
      </div>

      <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: expanded ? '#f3f4f6' : '#eff6ff', color: expanded ? '#4b5563' : '#2563eb', border: 'none', borderRadius: '12px', padding: '0.875rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s ease' }}>
        {expanded ? 'Hide Details' : 'View Benefits & Apply'} {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed #e5e7eb', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: '#059669', fontSize: '1rem' }}><CheckCircle size={18} /> Direct Benefits</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{(scheme.clear_benefits || []).map((benefit, i) => (<span key={i} style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500', border: '1px solid #a7f3d0' }}>{benefit}</span>))}</div>
          </div>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: '#d97706', fontSize: '1rem' }}><FileText size={18} /> Required Documents</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{(scheme.required_documents || []).map((doc, i) => (<span key={i} style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #fde68a' }}>{doc}</span>))}</div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: '#334155', fontSize: '1rem' }}><Compass size={18} color="#4f46e5" /> How to Apply</h4>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.7' }}>{(scheme.steps_to_apply || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
          </div>
          <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', transition: 'background-color 0.2s', marginTop: '0.5rem' }}>Open Official Portal <ExternalLink size={20} /></a>
        </div>
      )}
    </div>
  );
};

export default SchemeCard;