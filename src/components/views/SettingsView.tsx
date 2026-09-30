import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  User,
  Bell,
  Globe,
  Shield,
  CheckCircle,
  Save,
  DollarSign,
  MapPin,
  Tag,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ChatStorageService, WorkspaceMemory } from '../../services/chatStorageService.ts';

interface SettingsViewProps {
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuthModal }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'business' | 'account' | 'notifications' | 'language' | 'security'>('business');

  // Business Profile Form
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail Shop');
  const [productsServices, setProductsServices] = useState('');
  const [targetCustomers, setTargetCustomers] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [mainCompetitors, setMainCompetitors] = useState('');
  const [currency, setCurrency] = useState('₹ INR');
  const [language, setLanguage] = useState('English');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    priceDropAlerts: true,
    offerAlerts: true,
    weeklyDigest: true,
    whatsappAlerts: false,
  });

  const workspaceId = user?.company || 'Primary Workspace';

  // Load existing profile from workspace memory
  useEffect(() => {
    const mem = ChatStorageService.getWorkspaceMemory(workspaceId);
    if (mem.userCompany) setBusinessName(mem.userCompany);
    if (mem.userProduct) setProductsServices(mem.userProduct);
    if (mem.targetCustomer) setTargetCustomers(mem.targetCustomer);
    if (mem.notes?.location) setLocationCity(mem.notes.location);
    if (mem.notes?.businessType) setBusinessType(mem.notes.businessType);
    if (mem.activeCompetitors) setMainCompetitors(mem.activeCompetitors.join(', '));
  }, [workspaceId]);

  const handleSaveBusinessProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const competitorList = mainCompetitors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    ChatStorageService.saveWorkspaceMemory(workspaceId, {
      userCompany: businessName,
      userProduct: productsServices,
      targetCustomer: targetCustomers,
      activeCompetitors: competitorList,
      notes: {
        location: locationCity,
        businessType: businessType,
        currency: currency,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const BUSINESS_TYPES = [
    'Retail Shop',
    'Electronics & Appliances',
    'Clothing & Fashion Store',
    'Grocery & Kirana Store',
    'Restaurant & Food Business',
    'Software & SaaS Tech',
    'Salon & Wellness',
    'Furniture & Home Decor',
    'Hardware & Sanitary',
    'Online Store / E-commerce',
    'Local Service Business',
    'Other Business',
  ];

  return (
    <div className="nexora-view-page">
      <div className="nexora-view-container">
        {/* Header */}
        <div className="nexora-view-header">
          <div>
            <h1 className="nexora-view-title">Settings</h1>
            <p className="nexora-view-subtitle">
              Manage your business profile so Nexora writes personalized battlecards and sales counter-pitches for your business.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '12px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <CheckCircle size={16} color="#059669" />
              <span>Business profile saved. Nexora will personalize all upcoming answers for your business!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Layout: Left Nav + Right Content */}
        <div className="nexora-settings-container">
          {/* Navigation */}
          <div className="nexora-settings-nav" role="tablist">
            <button
              onClick={() => setActiveTab('business')}
              className={`nexora-settings-nav-btn ${activeTab === 'business' ? 'active' : ''}`}
              type="button"
            >
              <Building2 size={16} />
              <span>Business Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`nexora-settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
              type="button"
            >
              <User size={16} />
              <span>Account</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`nexora-settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              type="button"
            >
              <Bell size={16} />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`nexora-settings-nav-btn ${activeTab === 'language' ? 'active' : ''}`}
              type="button"
            >
              <Globe size={16} />
              <span>Currency &amp; Language</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`nexora-settings-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              type="button"
            >
              <Shield size={16} />
              <span>Security</span>
            </button>
          </div>

          {/* Right Content Panel */}
          <div>
            {/* 1. BUSINESS PROFILE TAB */}
            {activeTab === 'business' && (
              <div className="nexora-settings-card">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Your Business Profile
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Nexora uses these details to generate tailor-made sales pitches, counter competitor prices, and write battlecards.
                  </p>
                </div>

                <form onSubmit={handleSaveBusinessProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Business Name & Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Electronics, Sharma Retail, CloudScale Solutions"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                        Business Type
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          fontSize: '13px',
                          background: 'var(--radar-white)',
                          cursor: 'pointer',
                        }}
                      >
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Products / Services */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      What do you sell? (Products or Services)
                    </label>
                    <input
                      type="text"
                      value={productsServices}
                      onChange={(e) => setProductsServices(e.target.value)}
                      placeholder="e.g. Laptops, smartphones, home appliances with free doorstep warranty"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Target Customers & Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                        Who are your customers?
                      </label>
                      <input
                        type="text"
                        value={targetCustomers}
                        onChange={(e) => setTargetCustomers(e.target.value)}
                        placeholder="e.g. Local families, college students, small office owners"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                        City / Location
                      </label>
                      <input
                        type="text"
                        value={locationCity}
                        onChange={(e) => setLocationCity(e.target.value)}
                        placeholder="e.g. Mumbai, Bengaluru, Delhi, Pune, Jaipur"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Main Competitors */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      Main Competitors (Separated by commas)
                    </label>
                    <input
                      type="text"
                      value={mainCompetitors}
                      onChange={(e) => setMainCompetitors(e.target.value)}
                      placeholder="e.g. Reliance Digital, Croma, Vijay Sales, Local shops"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--radar-gray-500)', marginTop: '4px', display: 'block' }}>
                      Nexora will automatically track these names and provide instant counter-pitches when customers mention them.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '8px' }}>
                    <button type="submit" className="nexora-primary-btn">
                      <Save size={14} />
                      <span>Save Business Profile</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="nexora-settings-card">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Account Details
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Manage your login account and access mode.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', background: 'var(--radar-gray-50)', borderRadius: '10px', fontSize: '13px' }}>
                    <div>
                      <strong>Signed in as:</strong> {user ? user.email : 'Demo Account (Local Store Owner)'}
                    </div>
                    <div style={{ color: 'var(--radar-gray-500)', fontSize: '12px', marginTop: '2px' }}>
                      Plan: Professional Competitive Monitoring
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {user ? (
                      <button
                        onClick={signOut}
                        className="nexora-secondary-btn"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        type="button"
                      >
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        onClick={onOpenAuthModal}
                        className="nexora-primary-btn"
                        type="button"
                      >
                        <span>Sign In or Create Account</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="nexora-settings-card">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Alert Notifications
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Choose when Nexora should alert you about competitor changes.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--radar-gray-50)', borderRadius: '10px', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--radar-black)' }}>Competitor Price Drops</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                        Notify me immediately when a competitor cuts their prices.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.priceDropAlerts}
                      onChange={(e) => setNotifications((p) => ({ ...p, priceDropAlerts: e.target.checked }))}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--radar-gray-50)', borderRadius: '10px', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--radar-black)' }}>New Offers &amp; Festive Discounts</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                        Alert me when a competitor launches festival or seasonal deals.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.offerAlerts}
                      onChange={(e) => setNotifications((p) => ({ ...p, offerAlerts: e.target.checked }))}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--radar-gray-50)', borderRadius: '10px', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--radar-black)' }}>Weekly Sales Summary</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--radar-gray-500)' }}>
                        Receive a 1-minute weekly digest of all competitor movements.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => setNotifications((p) => ({ ...p, weeklyDigest: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. CURRENCY & LANGUAGE TAB */}
            {activeTab === 'language' && (
              <div className="nexora-settings-card">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Currency &amp; Language Preference
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Comfortable defaults for Indian shop owners and international business.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      Display Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '320px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        background: 'var(--radar-white)',
                      }}
                    >
                      <option value="₹ INR">₹ INR (Indian Rupee - Default)</option>
                      <option value="$ USD">$ USD (US Dollar)</option>
                      <option value="€ EUR">€ EUR (Euro)</option>
                      <option value="£ GBP">£ GBP (British Pound)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--radar-gray-800)', marginBottom: '6px' }}>
                      App Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '320px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '13px',
                        background: 'var(--radar-white)',
                      }}
                    >
                      <option value="English">English (Simple business English)</option>
                      <option value="Hindi">हिंदी (Hindi - Coming Soon)</option>
                      <option value="Hinglish">Hinglish (Everyday business speech - Coming Soon)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="nexora-settings-card">
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--radar-black)', margin: '0 0 4px 0' }}>
                    Privacy &amp; Data Security
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--radar-gray-600)', margin: 0 }}>
                    Nexora values your business privacy.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--radar-gray-700)' }}>
                  <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
                    ✓ <strong>Zero data sharing:</strong> Your internal business notes, pricing targets, and customer questions are never shared with competitors.
                  </div>
                  <div style={{ padding: '12px', background: 'var(--radar-gray-50)', borderRadius: '8px' }}>
                    ✓ <strong>Public web data only:</strong> Nexora only monitors publicly visible competitor websites, store pages, and pricing cards.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
