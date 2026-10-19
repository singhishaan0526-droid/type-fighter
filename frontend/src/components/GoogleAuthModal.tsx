import React, { useState } from 'react';
import { X, Check, ShieldCheck, Mail, User } from 'lucide-react';

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  loginType: 'google';
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: GoogleUserProfile) => void;
}

const PRESET_ACCOUNTS = [
  {
    name: 'Alex Johnson',
    email: 'alex.johnson.dev@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Cyber Ninja',
    email: 'cyber.shadow.fighter@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80'
  }
];

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    const acc = PRESET_ACCOUNTS[index];
    setCustomName(acc.name);
    setCustomEmail(acc.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || 'Google Warrior';
    const finalEmail = customEmail.trim() || 'fighter@gmail.com';
    const avatar =
      selectedPreset !== null
        ? PRESET_ACCOUNTS[selectedPreset].avatar
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalName)}`;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({
        id: `google-${Date.now()}`,
        name: finalName,
        email: finalEmail,
        avatar,
        loginType: 'google'
      });
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="google-auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="google-auth-header">
          {/* Google SVG Logo */}
          <div className="google-icon-wrapper">
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <h3 className="google-auth-title">Sign in with Google</h3>
          <p className="google-auth-subtitle">to continue to Type Fighter Battle Arena</p>
        </div>

        {/* Quick Account Selector */}
        <div className="google-preset-section">
          <span className="google-section-label">Select Account</span>
          <div className="google-accounts-list">
            {PRESET_ACCOUNTS.map((acc, index) => (
              <button
                key={acc.email}
                type="button"
                className={`google-account-item ${selectedPreset === index ? 'active' : ''}`}
                onClick={() => handleSelectPreset(index)}
              >
                <img src={acc.avatar} alt={acc.name} className="google-avatar" />
                <div className="google-account-details">
                  <span className="google-acc-name">{acc.name}</span>
                  <span className="google-acc-email">{acc.email}</span>
                </div>
                {selectedPreset === index && (
                  <div className="google-check-icon">
                    <Check size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="google-divider">
          <span>or enter custom details</span>
        </div>

        <form onSubmit={handleSubmit} className="google-auth-form">
          <div className="google-input-group">
            <label className="google-input-label">
              <User size={14} /> Full Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="e.g. Master Typist"
              className="google-text-input"
              required
            />
          </div>

          <div className="google-input-group">
            <label className="google-input-label">
              <Mail size={14} /> Google Email
            </label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => {
                setCustomEmail(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="e.g. player@gmail.com"
              className="google-text-input"
              required
            />
          </div>

          <div className="google-security-badge">
            <ShieldCheck size={14} color="#00f59b" />
            <span>Secure simulated OAuth 2.0 authentication</span>
          </div>

          <button
            type="submit"
            className="google-submit-btn"
            disabled={isSubmitting || (!customName && selectedPreset === null)}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <span>CONTINUE TO ARENA &rarr;</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
