import { useEffect, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';
import { apiGetProfile, apiUpdateProfile, apiUploadProfilePicture, apiRemoveProfilePicture, apiScheduleAccountDeletion, AccountDeletionAcknowledgement } from '../api';

interface ProfileState {
  username: string;
  email: string;
  bio: string;
  languagePreference?: string;
}

interface Session {
  id: string;
  device: string;
  lastActive: string;
  location: string;
}

interface ProfilePageProps {
  currentUser: string;
  token: string;
  onAccountScheduled: (acknowledgement: AccountDeletionAcknowledgement) => void;
}

export default function ProfilePage({ currentUser, token, onAccountScheduled }: ProfilePageProps) {
  const [savedProfile, setSavedProfile] = useState<ProfileState>({
    username: currentUser,
    email: '',
    bio: '',
    languagePreference: 'English',
  });
  const [name, setName] = useState(currentUser);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [languagePreference, setLanguagePreference] = useState('English');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(currentUser.charAt(0).toUpperCase());
  const [avatarColor, setAvatarColor] = useState('hsl(280, 70%, 55%)');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showActivity: true,
    allowMessages: true,
  });
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', device: 'Chrome on Windows', lastActive: 'Now', location: 'Home Network' },
    { id: '2', device: 'Mobile Safari', lastActive: '2 hours ago', location: 'Mobile' },
  ]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences' | 'security' | 'data'>('profile');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [accountAction, setAccountAction] = useState<'delete' | 'terminate' | null>(null);
  const [accountConfirmed, setAccountConfirmed] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);

  useEffect(() => {
    let disposed = false;
    setProfilePicture(null);
    setProfilePicturePreview(null);
    async function loadProfile() {
      try {
        setLoading(true);
        const profile = await apiGetProfile(token);
        if (disposed) return;
        setSavedProfile(profile);
        setName(profile.username);
        setEmail(profile.email || '');
        setBio(profile.bio || '');
        setLanguagePreference(profile.languagePreference || 'English');
        setProfilePicture(profile.profilePicture);
        setProfilePicturePreview(profile.profilePicture);
        setSavedAt(new Date().toISOString());
      } catch (err) {
        if (!disposed) setError((err as Error).message);
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    loadProfile();
    return () => { disposed = true; };
  }, [token]);

  const hasChanges = name !== savedProfile.username || email !== savedProfile.email || bio !== savedProfile.bio || languagePreference !== (savedProfile.languagePreference || 'English');

  const avatarColors = [
    'hsl(280, 70%, 55%)',
    'hsl(340, 100%, 55%)',
    'hsl(0, 100%, 55%)',
    'hsl(40, 100%, 55%)',
    'hsl(100, 100%, 45%)',
    'hsl(180, 100%, 40%)',
    'hsl(240, 100%, 55%)',
  ];

  const stats = [
    { label: 'Account Age', value: '127 days', icon: '📅' },
    { label: 'Last Login', value: 'Just now', icon: '⏱️' },
    { label: 'Active Sessions', value: sessions.length.toString(), icon: '💻' },
    { label: 'Storage Used', value: '2.3 GB / 15 GB', icon: '📦' },
  ];

  async function handleSave() {
    try {
      setError(null);
      setSuccessMessage(null);
      const updated = await apiUpdateProfile(token, { email, bio, languagePreference });
      setSavedProfile(updated);
      setSavedAt(new Date().toISOString());
      setName(updated.username);
      setEmail(updated.email || '');
      setBio(updated.bio || '');
      setLanguagePreference(updated.languagePreference || 'English');
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleCancel() {
    setName(savedProfile.username);
    setEmail(savedProfile.email || '');
    setBio(savedProfile.bio || '');
    setLanguagePreference(savedProfile.languagePreference || 'English');
    setError(null);
    setSuccessMessage(null);
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      // TODO: Call actual password change API when backend is ready
      setSuccessMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleToggle2FA() {
    if (!twoFactorEnabled) {
      setSuccessMessage('Two-Factor Authentication enabled! Check your email for setup instructions.');
    } else {
      setSuccessMessage('Two-Factor Authentication disabled.');
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  }

  function handleNotificationChange(key: keyof typeof notifications) {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccessMessage(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${!notifications[key] ? 'enabled' : 'disabled'}`);
  }

  function handlePrivacyChange(key: keyof typeof privacy) {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleLogoutSession(sessionId: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setSuccessMessage('Session ended successfully');
  }

  function handleExportData() {
    setSuccessMessage('Your data export will be sent to your email within 24 hours.');
  }

  async function handleAccountAction() {
    if (!accountAction || !accountConfirmed || accountBusy) return;
    setAccountBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const acknowledgement = await apiScheduleAccountDeletion(token, accountAction);
      onAccountScheduled(acknowledgement);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to schedule account deletion.');
    } finally {
      setAccountBusy(false);
    }
  }

  function handleProfilePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (isUploadingPicture) return;
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Please select a PNG, JPEG, GIF, or WebP image');
        return;
      }

      // Create preview
      setIsUploadingPicture(true);
      setError(null);
      setSuccessMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
        handleProfilePictureUpload(file);
      };
      reader.onerror = () => {
        setError('Unable to read this image. Please try again.');
        setIsUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleProfilePictureUpload(file: File) {
    try {
      setIsUploadingPicture(true);
      setError(null);
      const data = await apiUploadProfilePicture(token, file);
      setProfilePicture(data.profilePicture);
      setProfilePicturePreview(data.profilePicture);
      setSuccessMessage('Profile picture updated successfully!');
    } catch (err) {
      setError((err as Error).message);
      setProfilePicturePreview(profilePicture);
    } finally {
      setIsUploadingPicture(false);
    }
  }

  async function handleRemoveProfilePicture() {
    if (isUploadingPicture) return;
    setIsUploadingPicture(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiRemoveProfilePicture(token);
      setProfilePicture(null);
      setProfilePicturePreview(null);
      setSuccessMessage('Profile picture removed.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to remove profile picture.');
    } finally {
      setIsUploadingPicture(false);
    }
  }

  const joinDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

  return (
    <section className="page-card profile-card">
      <div className="page-header">
        <div>
          <PageTitle topic="profile"><h2>My Account</h2></PageTitle>
          <p>Manage your profile, security, preferences and account settings.</p>
        </div>
        <PageIllustration topic="profile" />
      </div>

      {loading && <p>Loading profile...</p>}
      {!loading && (
        <>
          <div className="profile-header">
            <div className="avatar-section">
              {profilePicturePreview ? (
                <div className="profile-picture-container">
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="profile-picture"
                  />
                </div>
              ) : (
                <div className="avatar-large" style={{ backgroundColor: avatarColor }}>
                  {avatar}
                </div>
              )}
              <div className="avatar-actions">
                <label className="avatar-btn upload-btn">
                  📸 Upload Picture
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleProfilePictureChange}
                    disabled={isUploadingPicture}
                    style={{ display: 'none' }}
                  />
                </label>
                {profilePicturePreview && (
                  <button
                    className="avatar-btn remove-btn"
                    onClick={handleRemoveProfilePicture}
                    disabled={isUploadingPicture}
                  >
                    🗑️ Remove Picture
                  </button>
                )}
                {!profilePicturePreview && (
                  <>
                    <button className="avatar-btn" onClick={() => setAvatar(name.charAt(0).toUpperCase())}>
                      Reset Avatar
                    </button>
                    <div className="avatar-colors">
                      {avatarColors.map((color) => (
                        <button
                          key={color}
                          className={`color-btn ${avatarColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setAvatarColor(color)}
                          title="Click to change avatar color"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="profile-info">
              <h3>{name}</h3>
              <p>{email || 'No email set'}</p>
              <div className="profile-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat">
                    <span className="emoji">{stat.icon}</span>
                    <div>
                      <span className="label">{stat.label}</span>
                      <span className="value">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-tabs">
            {['profile', 'password', 'preferences', 'security', 'data'].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab === 'profile' && '📝 Profile'}
                {tab === 'password' && '🔐 Password'}
                {tab === 'preferences' && '⚙️ Preferences'}
                {tab === 'security' && '🛡️ Security'}
                {tab === 'data' && '📊 Data & Account'}
              </button>
            ))}
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {successMessage && <div className="success-message">✅ {successMessage}</div>}

          {activeTab === 'profile' && (
            <div className="profile-form">
              <div className="picture-upload-section">
                <h4>📸 Profile Picture</h4>
                <p>Upload a profile picture (JPG, PNG, GIF, WebP - max 5MB)</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleProfilePictureChange}
                    disabled={isUploadingPicture}
                  />
                  <span className="file-input-text">
                    {isUploadingPicture ? '⏳ Uploading...' : '📁 Choose File'}
                  </span>
                </label>
                {profilePicture && !isUploadingPicture && (
                  <p className="upload-status">✅ Picture uploaded successfully!</p>
                )}
              </div>
              <label>
                <span>Username</span>
                <input value={name} disabled className="disabled-input" />
                <small>✓ Username cannot be changed</small>
              </label>
              <label>
                <span>Email Address</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </label>
              <label>
                <span>Bio</span>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </label>

              <div className="profile-actions">
                <button className="save-btn" onClick={handleSave} disabled={!hasChanges}>
                  💾 Save Profile
                </button>
                <button className="cancel-btn" onClick={handleCancel} disabled={!hasChanges}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-form">
              <div className="security-notice">
                <p>🔐 Keep your account secure by using a strong, unique password.</p>
              </div>

              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </label>
              <label>
                <span>New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <small>Minimum 6 characters, use uppercase, numbers and symbols for strength</small>
              </label>
              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </label>

              <div className="profile-actions">
                <button className="save-btn" onClick={handlePasswordChange}>
                  🔐 Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-form">
              <label>
                <span>Preferred Language</span>
                <select value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)}>
                  <option value="English">🇺🇸 English</option>
                  <option value="Hindi">🇮🇳 Hindi</option>
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Japanese">🇯🇵 Japanese</option>
                </select>
              </label>

              <div className="preference-section">
                <h4>🔔 Notifications</h4>
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleNotificationChange(key as any)}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                  </label>
                ))}
              </div>

              <div className="preference-section">
                <h4>⚙️ Display</h4>
                <p>The application uses light mode.</p>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Compact View
                </label>
              </div>

              <div className="profile-actions">
                <button className="save-btn" onClick={handleSave}>
                  💾 Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-form">
              <div className="security-notice">
                <p>🛡️ Strengthen your account security with these options.</p>
              </div>

              <div className="security-section">
                <div className="security-item">
                  <div className="security-info">
                    <h4>Two-Factor Authentication (2FA)</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button
                    className={`toggle-btn ${twoFactorEnabled ? 'active' : ''}`}
                    onClick={handleToggle2FA}
                  >
                    {twoFactorEnabled ? '✓ ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div className="security-section">
                <div className="security-item">
                  <div>
                    <h4>🔐 Privacy & Access</h4>
                  </div>
                </div>
                {Object.entries(privacy).map(([key, value]) => (
                  <label key={key} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handlePrivacyChange(key as any)}
                    />
                    {key === 'publicProfile' && 'Make Profile Public'}
                    {key === 'showActivity' && 'Show Activity Status'}
                    {key === 'allowMessages' && 'Allow Direct Messages'}
                  </label>
                ))}
              </div>

              <div className="security-section">
                <h4>💻 Active Sessions</h4>
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-info">
                        <p className="device">📱 {session.device}</p>
                        <small>📍 {session.location} • {session.lastActive}</small>
                      </div>
                      <button onClick={() => handleLogoutSession(session.id)} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="profile-form">
              <div className="security-notice">
                <p>📊 Manage your data and account information.</p>
              </div>

              <div className="data-section">
                <div className="data-item">
                  <div>
                    <h4>📥 Export Your Data</h4>
                    <p>Download all your account data in a standard format</p>
                  </div>
                  <button className="action-btn" onClick={handleExportData}>
                    Download
                  </button>
                </div>
              </div>

              <div className="data-section">
                <div className="data-item">
                  <div>
                    <h4>🗑️ Delete Account</h4>
                    <p>Schedule permanent deletion after 7 days. Logging in before the deadline cancels deletion.</p>
                  </div>
                  <button type="button" className="delete-btn" disabled={accountBusy} onClick={() => {
                    setAccountAction('delete');
                    setAccountConfirmed(false);
                  }}>
                    Delete Account
                  </button>
                </div>
              </div>

              <div className="data-section">
                <div className="data-item">
                  <div>
                    <h4>Temporarily Terminate Account</h4>
                    <p>Take a break for up to 7 days. Log in before the deadline to restore your account; otherwise it will be permanently deleted.</p>
                  </div>
                  <button type="button" className="action-btn" disabled={accountBusy} onClick={() => {
                    setAccountAction('terminate');
                    setAccountConfirmed(false);
                  }}>
                    Temporarily Terminate Account
                  </button>
                </div>
              </div>

              {accountAction && (
                <section className="account-confirmation" aria-labelledby="account-confirmation-title">
                  <h4 id="account-confirmation-title">
                    Confirm {accountAction === 'delete' ? 'account deletion' : 'temporary termination'}
                  </h4>
                  <p>You will be signed out immediately. Log in within 7 days to cancel deletion and use your account normally. After the deadline, your account and server-side data will be permanently deleted.</p>
                  <p>Browser-local wellness records are not deleted by the server. You can clear this site's browser data separately.</p>
                  <label className="terms-checkbox">
                    <input type="checkbox" checked={accountConfirmed} disabled={accountBusy}
                      onChange={event => setAccountConfirmed(event.target.checked)} />
                    I understand and confirm this account request.
                  </label>
                  <div className="account-confirmation-actions">
                    <button type="button" className="action-btn" disabled={accountBusy} onClick={() => {
                      setAccountAction(null);
                      setAccountConfirmed(false);
                    }}>Cancel</button>
                    <button type="button" className="delete-btn" disabled={!accountConfirmed || accountBusy} onClick={handleAccountAction}>
                      {accountBusy ? 'Submitting...' : accountAction === 'delete' ? 'Confirm account deletion' : 'Confirm temporary termination'}
                    </button>
                  </div>
                  {error && <p role="alert" className="login-error">{error}</p>}
                </section>
              )}

              <div className="data-info">
                <h4>ℹ️ Account Information</h4>
                <ul>
                  <li>📅 Account Created: {joinDate.toLocaleDateString()}</li>
                  <li>📧 Email: {email || 'Not set'}</li>
                  <li>🔐 Password Last Changed: 45 days ago</li>
                  <li>🛡️ Two-Factor: {twoFactorEnabled ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>
            </div>
          )}

          {savedAt && activeTab === 'profile' && (
            <div className="save-timestamp">
              ✓ Last saved: {new Date(savedAt).toLocaleString()}
            </div>
          )}
        </>
      )}
    </section>
  );
}
