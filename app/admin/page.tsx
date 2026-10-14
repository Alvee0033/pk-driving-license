'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type TemplateId = '1' | '2';
type NavTab = 'templates' | 'list' | 'settings';

interface LicenseData {
  dl_no: string;
  name: string;
  relation: string;
  cnic: string;
  dob: string;
  gender: string;
  issue_date: string;
  validity_nt: string;
  vehicle_class: string;
  auth_office: string;
  blood_group: string;
  emergency_contact: string;
  address: string;
  qr_data: string;
  domain?: string;
  base_url?: string;
}

interface StoredLicenseRecord {
  cnic: string;
  name: string;
  father_name?: string;
  relation?: string;
  dl_no: string;
  license_type: string;
  issue_date: string;
  expiry_date: string;
  district: string;
  idp?: string;
  initial_type_date?: string;
  blood_group?: string;
  gender?: string;
  address?: string;
}

const SAMPLE_T1: LicenseData = {
  dl_no: '11000950348',
  name: 'AKHTAR HUSSAIN',
  relation: 'KHER MUHAMMAD',
  cnic: '2170423658681',
  dob: '05 May 1995',
  gender: 'Male',
  issue_date: '08.06.2015',
  validity_nt: '07.06.2025',
  vehicle_class: 'M/Cycle, LTV',
  auth_office: 'Abbottabad',
  blood_group: 'AB+Ve',
  emergency_contact: '0310-9901541',
  address: 'Po Sararogha Gargora Teh Sar Rarogha Distt S Waziristan',
  qr_data: '',
  domain: '',
  base_url: '',
};

const SAMPLE_T2: LicenseData = {
  dl_no: '101971029159',
  name: 'MUHAMMAD YASEEN KHAN',
  relation: 'EJAZ AHMAD',
  cnic: '1710125068937',
  dob: '06-01-1998',
  gender: 'MALE',
  issue_date: '23-01-2021',
  validity_nt: '22-01-2031',
  vehicle_class: 'M.CYCLE + M.CAR/JEEP ONLY',
  auth_office: 'PESHAWAR',
  blood_group: 'A(+ve)',
  emergency_contact: '03332283318',
  address: 'Mohallah Amir Khusro Khan, Utmanzai, Charsadda',
  qr_data: '',
  domain: '',
  base_url: '',
};

const EMPTY_DATA: LicenseData = {
  dl_no: '',
  name: '',
  relation: '',
  cnic: '',
  dob: '',
  gender: 'Male',
  issue_date: '',
  validity_nt: '',
  vehicle_class: '',
  auth_office: '',
  blood_group: '',
  emergency_contact: '',
  address: '',
  qr_data: '',
  domain: '',
  base_url: '',
};

export default function AdminPage() {
  // Auth state
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Nav: default to Licences List as main page
  const [activeTab, setActiveTab] = useState<NavTab>('list');

  // Studio Template & Form
  const [template, setTemplate] = useState<TemplateId>('2');
  const [formData, setFormData] = useState<Record<TemplateId, LicenseData>>({
    '1': { ...EMPTY_DATA },
    '2': { ...EMPTY_DATA },
  });

  const [photos, setPhotos] = useState<Record<TemplateId, string | null>>({ '1': null, '2': null });
  const [signatures, setSignatures] = useState<Record<TemplateId, string | null>>({ '1': null, '2': null });
  const [authSigs, setAuthSigs] = useState<Record<TemplateId, string | null>>({ '1': null, '2': null });

  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // List (Database)
  const [recordsList, setRecordsList] = useState<StoredLicenseRecord[]>([]);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Settings
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Init Auth, Settings & Live Domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem('dl_studio_auth');
      setIsAuth(storedAuth === 'true');

      const savedUser = localStorage.getItem('dl_admin_user') || 'admin';
      const savedPass = localStorage.getItem('dl_admin_pass') || 'admin';
      setAdminEmail(savedUser);
      setAdminPass(savedPass);
      setNewEmail(savedUser);

      const host = window.location.host;
      const origin = window.location.origin;
      setFormData((prev) => ({
        '1': { ...prev['1'], domain: prev['1'].domain || host, base_url: prev['1'].base_url || origin },
        '2': { ...prev['2'], domain: prev['2'].domain || host, base_url: prev['2'].base_url || origin },
      }));
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      const savedUser = (localStorage.getItem('dl_admin_user') || 'admin').trim().toLowerCase();
      const savedPass = (localStorage.getItem('dl_admin_pass') || 'admin').trim();
      const u = loginUser.trim().toLowerCase();
      const p = loginPass.trim();

      if ((u === savedUser && p === savedPass) || (u === 'admin' && p === 'admin')) {
        localStorage.setItem('dl_studio_auth', 'true');
        setIsAuth(true);
        setLoginLoading(false);
      } else {
        setLoginError('Invalid Username or Password');
        setLoginLoading(false);
      }
    }, 250);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dl_studio_auth');
    }
    setIsAuth(false);
  };

  // Update Settings
  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);

    const emailTrim = newEmail.trim();
    if (!emailTrim) {
      setSettingsMsg({ text: 'Username / Email cannot be empty', error: true });
      return;
    }

    localStorage.setItem('dl_admin_user', emailTrim);
    setAdminEmail(emailTrim);

    if (newPass.trim()) {
      if (newPass.trim().length < 4) {
        setSettingsMsg({ text: 'Password must be at least 4 characters', error: true });
        return;
      }
      localStorage.setItem('dl_admin_pass', newPass.trim());
      setAdminPass(newPass.trim());
      setNewPass('');
    }

    setSettingsMsg({ text: 'Credentials updated successfully' });
    setTimeout(() => setSettingsMsg(null), 3000);
  };

  // Fetch Database Records
  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await fetch('/api/licenses');
      const data = await res.json();
      if (data && data.licenses) {
        setRecordsList(data.licenses);
      }
    } catch {
      // Ignore
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchRecords();
    }
  }, [isAuth, fetchRecords]);

  // Sync to database
  const syncToDatabase = useCallback(
    async (data: LicenseData, manual = false, returnToList = false) => {
      if (!data.dl_no && !data.cnic) {
        if (manual) alert('Please provide at least a CNIC or Licence Number.');
        return;
      }
      try {
        await fetch('/api/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cnic: data.cnic,
            name: data.name,
            father_name: data.relation,
            dl_no: data.dl_no,
            license_type: data.vehicle_class,
            issue_date: data.issue_date,
            expiry_date: data.validity_nt,
            district: data.auth_office,
            idp: 'Not Issued',
            initial_type_date: `${data.vehicle_class} / ${data.issue_date}`,
            blood_group: data.blood_group,
            gender: data.gender,
            address: data.address,
          }),
        });
        await fetchRecords();
        if (manual) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
          if (returnToList) {
            setActiveTab('list');
          }
        }
      } catch (err) {
        if (manual) alert('Failed to save licence to database. Please check connection.');
      }
    },
    [fetchRecords]
  );

  // Card generation
  const triggerGeneration = useCallback(
    async (
      activeT = template,
      activeData = formData[template],
      activePhoto = photos[template],
      activeSig = signatures[template],
      activeAuth = authSigs[template]
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setGenerating(true);
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            template: activeT,
            data: activeData,
            photo: activePhoto,
            signature: activeSig,
            auth: activeAuth,
            preview: true,
            download: false,
            format: 'png',
          }),
        });

        if (!res.ok) throw new Error('Generation failed');
        const json = await res.json();
        if (json.imageBase64) {
          setCardPreview(json.imageBase64);
        }
        syncToDatabase(activeData);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Render error:', err);
      } finally {
        setGenerating(false);
      }
    },
    [template, formData, photos, signatures, authSigs, syncToDatabase]
  );

  // Field updates
  const updateField = (field: keyof LicenseData, val: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [template]: { ...prev[template], [field]: val },
      };

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        triggerGeneration(template, updated[template], photos[template], signatures[template], authSigs[template]);
      }, 450);

      return updated;
    });
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 'photo' | 'signature' | 'auth') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (slot === 'photo') setPhotos((p) => ({ ...p, [template]: url }));
      if (slot === 'signature') setSignatures((s) => ({ ...s, [template]: url }));
      if (slot === 'auth') setAuthSigs((a) => ({ ...a, [template]: url }));

      triggerGeneration(
        template,
        formData[template],
        slot === 'photo' ? url : photos[template],
        slot === 'signature' ? url : signatures[template],
        slot === 'auth' ? url : authSigs[template]
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // High-Res Download (PDF or PNG)
  const handleDownload = async (format: 'png' | 'pdf') => {
    if (format === 'pdf') setDownloadingPdf(true);
    else setDownloading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          data: formData[template],
          photo: photos[template],
          signature: signatures[template],
          auth: authSigs[template],
          download: true,
          preview: false,
          format,
        }),
      });

      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `DL_T${template}_${(formData[template].dl_no || 'card').replace(/\s+/g, '_')}.${format}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download error. Please try again.');
    } finally {
      if (format === 'pdf') setDownloadingPdf(false);
      else setDownloading(false);
    }
  };

  // Load record from database into studio
  const loadRecordToStudio = (rec: StoredLicenseRecord) => {
    const targetT: TemplateId = (rec.district || '').toLowerCase().includes('abbott') ? '1' : '2';
    setTemplate(targetT);

    const loadedData: LicenseData = {
      dl_no: rec.dl_no || '',
      name: rec.name || '',
      relation: rec.father_name || rec.relation || '',
      cnic: rec.cnic || '',
      dob: '05 May 1995',
      gender: rec.gender || 'Male',
      issue_date: rec.issue_date || '',
      validity_nt: rec.expiry_date || '',
      vehicle_class: rec.license_type || 'M.CYCLE + M.CAR/JEEP ONLY',
      auth_office: rec.district || 'PESHAWAR',
      blood_group: rec.blood_group || 'A(+ve)',
      emergency_contact: '03332283318',
      address: rec.address || 'KPK, Pakistan',
      qr_data: '',
    };

    setFormData((prev) => ({ ...prev, [targetT]: loadedData }));
    setActiveTab('templates');
    triggerGeneration(targetT, loadedData, null, null, null);
  };

  // Delete record
  const deleteRecord = async (dlNo: string) => {
    if (!confirm(`Delete licence #${dlNo}?`)) return;
    try {
      await fetch(`/api/licenses?dl_no=${encodeURIComponent(dlNo)}`, { method: 'DELETE' });
      fetchRecords();
    } catch {
      alert('Delete failed');
    }
  };

  // Initial render
  useEffect(() => {
    if (isAuth && !cardPreview) {
      triggerGeneration();
    }
  }, [isAuth, cardPreview, triggerGeneration]);

  const cur = formData[template];

  // Loading
  if (isAuth === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#059669' }}></i>
      </div>
    );
  }

  // Login
  if (!isAuth) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/images/logo.png" alt="Logo" style={{ height: 28, width: 'auto' }} />
          <a href="/" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textDecoration: 'none' }}>
            Portal &rarr;
          </a>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#0f172a' }}>Login</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>Enter credentials to access card studio.</p>

            {loginError && (
              <div style={{ padding: '0.5rem', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>USERNAME / EMAIL</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {loginLoading ? 'Checking...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginUser('admin');
                  setLoginPass('admin');
                }}
                style={{ display: 'block', width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Fill demo (admin / admin)
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard Workspace
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', paddingBottom: '75px' }}>
      <style jsx global>{`
        * {
          box-sizing: border-box !important;
        }
        body {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          margin: 0;
          padding: 0;
          font-size: 14px;
        }
        .clean-input {
          width: 100% !important;
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 6px !important;
          padding: 0.45rem 0.65rem !important;
          font-size: 0.82rem !important;
          outline: none !important;
        }
        .clean-input:focus {
          border-color: #059669 !important;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15) !important;
        }
        .clean-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.2rem;
          letter-spacing: 0.02em;
        }
        .btn-pdf {
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          padding: 0.6rem 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          cursor: pointer;
        }
        .btn-pdf:hover {
          background: #b91c1c;
        }
        .btn-green {
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          padding: 0.6rem 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          cursor: pointer;
        }
        .btn-green:hover {
          background: #047857;
        }
        .btn-clean {
          background: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          cursor: pointer;
        }
        .btn-clean:hover {
          background: #f1f5f9;
        }
        .studio-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 1rem;
          align-items: start;
        }
        .mobile-dock {
          display: none !important;
        }
        @media (max-width: 860px) {
          .studio-layout {
            grid-template-columns: 1fr !important;
          }
          .mobile-dock {
            display: flex !important;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>

      {/* Clean Compact Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.5rem 1rem',
        }}
      >
        <div style={{ maxWidth: 1250, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          {/* Logo & Small Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/images/logo.png" alt="Logo" style={{ height: 30, width: 'auto' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.1 }}>
                KP Card Studio
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                300 DPI Generator
              </div>
            </div>
          </div>

          {/* Desktop 3-Tab Nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: 8 }}>
            <button
              onClick={() => setActiveTab('list')}
              style={{
                border: 'none',
                background: activeTab === 'list' ? '#ffffff' : 'transparent',
                color: activeTab === 'list' ? '#059669' : '#64748b',
                fontWeight: activeTab === 'list' ? 800 : 600,
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="fas fa-list"></i>
              <span>Licences List ({recordsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                border: 'none',
                background: activeTab === 'templates' ? '#ffffff' : 'transparent',
                color: activeTab === 'templates' ? '#059669' : '#64748b',
                fontWeight: activeTab === 'templates' ? 800 : 600,
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="fas fa-id-card"></i>
              <span>Card Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                border: 'none',
                background: activeTab === 'settings' ? '#ffffff' : 'transparent',
                color: activeTab === 'settings' ? '#059669' : '#64748b',
                fontWeight: activeTab === 'settings' ? 800 : 600,
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="fas fa-gear"></i>
              <span>Settings</span>
            </button>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <a
              href={`/?search=${encodeURIComponent(cur.dl_no || '110200123565')}&sub=`}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '0.35rem 0.65rem',
                borderRadius: 6,
                border: '1px solid #bfdbfe',
              }}
            >
              Portal &rarr;
            </a>
            <button
              onClick={handleLogout}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.35rem 0.55rem',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
              title="Logout"
            >
              <i className="fas fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1250, margin: '0 auto', padding: '0.85rem' }}>
        {/* ================= TAB 1: TEMPLATES & FORM ================= */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Top Navigation Bar: Back to List and Quick Save */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="btn-clean"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                }}
              >
                <i className="fas fa-arrow-left"></i>
                <span>← Back to Licences List</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => syncToDatabase(cur, true, true)}
                  className="btn-green"
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <i className="fas fa-floppy-disk"></i>
                  <span>{saveSuccess ? '✓ Saved!' : 'Save & Return to List'}</span>
                </button>
              </div>
            </div>

            {/* Top Selector: Templates Buttons */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>TEMPLATE:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTemplate('1');
                    triggerGeneration('1', formData['1'], photos['1'], signatures['1'], authSigs['1']);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 6,
                    border: `1.5px solid ${template === '1' ? '#059669' : '#cbd5e1'}`,
                    background: template === '1' ? '#ecfdf5' : '#fff',
                    color: template === '1' ? '#065f46' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Template 1 (Abbottabad)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplate('2');
                    triggerGeneration('2', formData['2'], photos['2'], signatures['2'], authSigs['2']);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 6,
                    border: `1.5px solid ${template === '2' ? '#059669' : '#cbd5e1'}`,
                    background: template === '2' ? '#ecfdf5' : '#fff',
                    color: template === '2' ? '#065f46' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Template 2 (Peshawar Police)
                </button>
              </div>

              {/* Data presets */}
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const sample = template === '1' ? SAMPLE_T1 : SAMPLE_T2;
                    setFormData((prev) => ({ ...prev, [template]: { ...sample } }));
                    setPhotos((p) => ({ ...p, [template]: null }));
                    setSignatures((s) => ({ ...s, [template]: null }));
                    setAuthSigs((a) => ({ ...a, [template]: null }));
                    triggerGeneration(template, sample, null, null, null);
                  }}
                  className="btn-clean"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, [template]: { ...EMPTY_DATA } }));
                    setPhotos((p) => ({ ...p, [template]: 'none' }));
                    setSignatures((s) => ({ ...s, [template]: 'none' }));
                    setAuthSigs((a) => ({ ...a, [template]: 'none' }));
                    setCardPreview(null);
                  }}
                  className="btn-clean"
                  style={{ color: '#dc2626' }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Studio Layout: 1 Form + 1 Canvas */}
            <div className="studio-layout">
              {/* The Compact Single Form */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* Form Title & Auto-render indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {template === '1' ? 'Template 1 Form (Abbottabad)' : 'Template 2 Form (Peshawar)'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: generating ? '#d97706' : '#059669', fontWeight: 700 }}>
                    {generating ? 'Rendering...' : '● Synced'}
                  </span>
                </div>

                {/* Section 1: Driver Profile */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label className="clean-label">Licence No</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="101971029159"
                        value={cur.dl_no}
                        onChange={(e) => updateField('dl_no', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="clean-label">CNIC (13 digits)</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="1710125068937"
                        value={cur.cnic}
                        onChange={(e) => updateField('cnic', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label className="clean-label">Name</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="Driver Name"
                        value={cur.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="clean-label">Father / Husband</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="Father Name"
                        value={cur.relation}
                        onChange={(e) => updateField('relation', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem' }}>
                    <div>
                      <label className="clean-label">DOB</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="06-01-1998"
                        value={cur.dob}
                        onChange={(e) => updateField('dob', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="clean-label">Gender</label>
                      <select
                        className="clean-input"
                        value={cur.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                      >
                        <option value={template === '1' ? 'Male' : 'MALE'}>Male</option>
                        <option value={template === '1' ? 'Female' : 'FEMALE'}>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="clean-label">Blood Group</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="A(+ve)"
                        value={cur.blood_group}
                        onChange={(e) => updateField('blood_group', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Validity & Category */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label className="clean-label">Issue Date</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="23-01-2021"
                        value={cur.issue_date}
                        onChange={(e) => updateField('issue_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="clean-label">Expiry Date</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="22-01-2031"
                        value={cur.validity_nt}
                        onChange={(e) => updateField('validity_nt', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="clean-label">Authority</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder={template === '1' ? 'Abbottabad' : 'PESHAWAR'}
                        value={cur.auth_office}
                        onChange={(e) => updateField('auth_office', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="clean-label">Vehicle Category</label>
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="M.CYCLE + M.CAR/JEEP ONLY"
                      value={cur.vehicle_class}
                      onChange={(e) => updateField('vehicle_class', e.target.value)}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                      {[
                        template === '1' ? 'M/Cycle, LTV' : 'M.CYCLE + M.CAR/JEEP ONLY',
                        'M/Cycle Only',
                        'LTV (Car / Jeep)',
                        'HTV',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => updateField('vehicle_class', tag)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.68rem',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Address & Phone */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label className="clean-label">Address</label>
                    <textarea
                      rows={2}
                      className="clean-input"
                      placeholder="Residential address"
                      value={cur.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="clean-label">Emergency Phone</label>
                    {template === '1' ? (
                      <input
                        type="text"
                        className="clean-input"
                        disabled
                        value="0310-9901541 (Pre-printed on template)"
                        style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      />
                    ) : (
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="03332283318"
                        value={cur.emergency_contact}
                        onChange={(e) => updateField('emergency_contact', e.target.value)}
                      />
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="clean-label">Website Domain (Back Card & QR)</label>
                    <input
                      type="text"
                      className="clean-input"
                      placeholder={typeof window !== 'undefined' ? window.location.host : 'e.g. ptpkp-gov.net'}
                      value={cur.domain || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const proto = typeof window !== 'undefined' ? window.location.protocol : 'http:';
                        updateField('domain', val);
                        updateField('base_url', val ? (val.startsWith('http') ? val : `${proto}//${val}`) : '');
                      }}
                    />
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Auto-detected as <strong>{typeof window !== 'undefined' ? window.location.host : 'current domain'}</strong>. Back website & verification QR will auto update to this domain.
                    </div>
                  </div>
                </div>

                {/* Section 4: Compact Uploads */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  <label className="clean-label" style={{ marginBottom: '0.4rem' }}>
                    {template === '1' ? 'Media Uploads (Photo, Issuing Auth & Holder Sig)' : 'Media Uploads (Photo & Issuing Auth Sig)'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: template === '1' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {/* Photo */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.35rem', textAlign: 'center', background: '#f8fafc' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>PHOTO</div>
                      {photos[template] && photos[template] !== 'none' ? (
                        <img
                          src={photos[template]!}
                          alt="Photo"
                          style={{ width: 48, height: 58, objectFit: 'cover', borderRadius: 4, margin: '0 auto 0.35rem', border: '1px solid #cbd5e1', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 58, borderRadius: 4, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.35rem', color: '#94a3b8', background: '#fff' }}>
                          <i className="fas fa-camera" style={{ fontSize: '1rem' }}></i>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <label className="btn-clean" style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', margin: 0 }}>
                          Upload
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'photo')} />
                        </label>
                        {photos[template] && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotos((p) => ({ ...p, [template]: null }));
                              triggerGeneration(template, cur, null, signatures[template], authSigs[template]);
                            }}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.2rem 0.35rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Issuing Authority Signature (Front) */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.35rem', textAlign: 'center', background: '#f8fafc' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ISSUING AUTH
                      </div>
                      {authSigs[template] && authSigs[template] !== 'none' ? (
                        <img
                          src={authSigs[template]!}
                          alt="Issuing Auth"
                          style={{ width: 60, height: 38, objectFit: 'contain', margin: '0 auto 0.35rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 38, borderRadius: 4, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.35rem', color: '#94a3b8', background: '#fff' }}>
                          <i className="fas fa-stamp" style={{ fontSize: '0.9rem' }}></i>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <label className="btn-clean" style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', margin: 0 }}>
                          Upload
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'auth')} />
                        </label>
                        {authSigs[template] && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthSigs((a) => ({ ...a, [template]: null }));
                              triggerGeneration(template, cur, photos[template], signatures[template], null);
                            }}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.2rem 0.35rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Holder Signature (Back) - Only for Template 1 */}
                    {template === '1' && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.35rem', textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          HOLDER SIG
                        </div>
                        {signatures[template] && signatures[template] !== 'none' ? (
                          <img
                            src={signatures[template]!}
                            alt="Holder Signature"
                            style={{ width: 60, height: 38, objectFit: 'contain', margin: '0 auto 0.35rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, display: 'block' }}
                          />
                        ) : (
                          <div style={{ width: 60, height: 38, borderRadius: 4, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.35rem', color: '#94a3b8', background: '#fff' }}>
                            <i className="fas fa-signature" style={{ fontSize: '0.9rem' }}></i>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <label className="btn-clean" style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', margin: 0 }}>
                            Upload
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'signature')} />
                          </label>
                          {signatures[template] && (
                            <button
                              type="button"
                              onClick={() => {
                                setSignatures((s) => ({ ...s, [template]: null }));
                                triggerGeneration(template, cur, photos[template], null, authSigs[template]);
                              }}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.2rem 0.35rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Direct Download Actions */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleDownload('pdf')}
                      disabled={downloadingPdf || generating}
                      className="btn-pdf"
                    >
                      <i className={`fas ${downloadingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                      <span>{downloadingPdf ? 'Rendering...' : 'Download PDF (300 DPI)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload('png')}
                      disabled={downloading || generating}
                      className="btn-green"
                    >
                      <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                      <span>{downloading ? 'Saving...' : 'Download PNG'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => syncToDatabase(cur, true, true)}
                      className="btn-green"
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                      }}
                    >
                      <i className="fas fa-floppy-disk"></i>
                      <span>{saveSuccess ? '✓ Saved to List!' : 'Save Licence & Return to List'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => syncToDatabase(cur, true, false)}
                      className="btn-clean"
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <i className="fas fa-check"></i>
                      <span>{saveSuccess ? '✓ Saved!' : 'Save & Keep Editing'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* The Live Canvas Box */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>Live Preview</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {template === '1' ? '1098 × 1433 px' : '1792 × 2400 px'}
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    minHeight: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cardPreview ? (
                    <img
                      src={cardPreview}
                      alt="Preview"
                      style={{ width: '100%', height: 'auto', display: 'block', opacity: generating ? 0.7 : 1 }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: '#059669', marginBottom: '0.4rem', fontSize: '1.2rem' }}></i>
                      <div>Rendering...</div>
                    </div>
                  )}

                  {generating && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.95)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 12,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#059669',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      Syncing...
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleDownload('pdf')}
                    disabled={downloadingPdf || generating}
                    className="btn-pdf"
                    style={{ padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload('png')}
                    disabled={downloading || generating}
                    className="btn-green"
                    style={{ padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <i className="fas fa-download"></i>
                    <span>Export PNG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIST (DATABASE) ================= */}
        {activeTab === 'list' && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Driving Licences Database</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0' }}>Manage verified records, create new licences, or open any licence in Card Studio.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button type="button" onClick={fetchRecords} className="btn-clean" style={{ padding: '0.5rem 0.85rem' }}>
                  <i className={`fas fa-rotate ${recordsLoading ? 'fa-spin' : ''}`}></i>
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, [template]: { ...EMPTY_DATA } }));
                    setPhotos((p) => ({ ...p, [template]: null }));
                    setSignatures((s) => ({ ...s, [template]: null }));
                    setAuthSigs((a) => ({ ...a, [template]: null }));
                    setCardPreview(null);
                    setActiveTab('templates');
                  }}
                  className="btn-green"
                  style={{
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-plus"></i>
                  <span>+ Add New Licence</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by driver name, licence number, CNIC, district..."
                value={recordsSearch}
                onChange={(e) => setRecordsSearch(e.target.value)}
                className="clean-input"
                style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
              />
            </div>

            {/* List */}
            {recordsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                <i className="fas fa-id-card" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
                <div style={{ fontWeight: 700, color: '#334155' }}>No licence records found</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Click the button below to create your first driving licence.</div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, [template]: { ...EMPTY_DATA } }));
                    setCardPreview(null);
                    setActiveTab('templates');
                  }}
                  className="btn-green"
                  style={{ marginTop: '0.85rem', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                >
                  <i className="fas fa-plus"></i> + Add New Licence
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {recordsList
                  .filter((r) => {
                    const q = recordsSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (r.name || '').toLowerCase().includes(q) ||
                      (r.dl_no || '').toLowerCase().includes(q) ||
                      (r.cnic || '').toLowerCase().includes(q) ||
                      (r.district || '').toLowerCase().includes(q)
                    );
                  })
                  .map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{rec.name || 'UNNAMED RECORD'}</span>
                          <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 700, border: '1px solid #a7f3d0' }}>
                            {rec.district || 'KPK'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                          CNIC: <b style={{ color: '#1e293b' }}>{rec.cnic}</b> &bull; DL: <b style={{ color: '#1e293b' }}>{rec.dl_no}</b> &bull; Category: {rec.license_type}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <a
                          href={`/?search=${encodeURIComponent(rec.dl_no)}&sub=`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-clean"
                          style={{
                            textDecoration: 'none',
                            color: '#2563eb',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <i className="fas fa-shield-alt"></i>
                          <span>Verify ↗</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => loadRecordToStudio(rec)}
                          className="btn-green"
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <i className="fas fa-pen-to-square"></i>
                          <span>Edit in Studio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecord(rec.dl_no)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                          title="Delete Record"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SETTINGS (CHANGE EMAIL & PASS) ================= */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#0f172a' }}>
              Account Settings
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem' }}>
              Update admin username / email and login password.
            </p>

            {settingsMsg && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  background: settingsMsg.error ? '#fef2f2' : '#ecfdf5',
                  border: `1px solid ${settingsMsg.error ? '#fecaca' : '#a7f3d0'}`,
                  color: settingsMsg.error ? '#dc2626' : '#059669',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {settingsMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateSettings}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="clean-label">Username / Email</label>
                <input
                  type="text"
                  required
                  className="clean-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label className="clean-label">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="New password..."
                  className="clean-input"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-green"
                style={{ width: '100%', padding: '0.65rem' }}
              >
                Save Settings
              </button>
            </form>

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Session</span>
              <button
                type="button"
                onClick={handleLogout}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation on Mobile (<860px) */}
      <nav
        className="mobile-dock"
        style={{
          position: 'fixed',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 20px)',
          maxWidth: 380,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: '1px solid #cbd5e1',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          padding: '0.25rem 0.5rem',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setActiveTab('list')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'list' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'list' ? '#059669' : '#64748b',
            padding: '0.4rem 0.2rem',
            borderRadius: 12,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <i className="fas fa-list" style={{ fontSize: '1rem' }}></i>
          <span style={{ fontSize: '0.62rem', fontWeight: activeTab === 'list' ? 800 : 600 }}>Licences ({recordsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'templates' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'templates' ? '#059669' : '#64748b',
            padding: '0.4rem 0.2rem',
            borderRadius: 12,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <i className="fas fa-id-card" style={{ fontSize: '1rem' }}></i>
          <span style={{ fontSize: '0.62rem', fontWeight: activeTab === 'templates' ? 800 : 600 }}>Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            border: 'none',
            background: activeTab === 'settings' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'settings' ? '#059669' : '#64748b',
            padding: '0.4rem 0.2rem',
            borderRadius: 12,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <i className="fas fa-gear" style={{ fontSize: '1rem' }}></i>
          <span style={{ fontSize: '0.62rem', fontWeight: activeTab === 'settings' ? 800 : 600 }}>Settings</span>
        </button>

        <a
          href={`/?search=${encodeURIComponent(cur.dl_no || '110200123565')}&sub=`}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            padding: '0.4rem 0.2rem',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            textDecoration: 'none',
          }}
        >
          <i className="fas fa-globe" style={{ fontSize: '1rem' }}></i>
          <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>Portal</span>
        </a>
      </nav>
    </div>
  );
}
