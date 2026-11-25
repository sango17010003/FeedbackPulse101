import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, QrCode, Star, AlertTriangle, CheckCircle2, LogOut,
  Plus, Layers, CreditCard, Banknote, Smartphone, Clock, Sun, Moon,
  Lock, ExternalLink, Copy, Check, X, Building2, Sparkles
} from 'lucide-react';
import { supabase } from './supabaseClient';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const ADMIN_EMAIL = 'sangosignature@gmail.com';
const OWNER_UPI_ID = ''; // Add your UPI ID here (e.g. 'yourname@oksbi') when ready; defaults to Cash collection until added

/* ==================== CLOUDFLARE TURNSTILE WIDGET ==================== */
function TurnstileWidget({ onVerify }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      onVerify('bypass-no-key');
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile && containerRef.current && widgetIdRef.current === null) {
        clearInterval(interval);
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => onVerify(token),
          'expired-callback': () => onVerify(''),
        });
      }
    }, 250);
    return () => {
      clearInterval(interval);
      if (window.turnstile && widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} className="my-2 flex justify-center" />;
}

/* ==================== MAIN ROUTER & SHELL ==================== */
export default function App() {
  const [route, setRoute] = useState('home');
  const [standParam, setStandParam] = useState('');
  const [session, setSession] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [legalModal, setLegalModal] = useState(null);

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/r/')) {
        setRoute('rate');
        setStandParam(decodeURIComponent(path.replace('/r/', '').trim()));
      } else if (path.startsWith('/dashboard')) {
        setRoute('dashboard');
      } else {
        setRoute('home');
      }
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      window.removeEventListener('popstate', syncRoute);
      listener.subscription.unsubscribe();
    };
  }, []);

  const navigate = (target, slug = '') => {
    const nextUrl = target === 'rate' ? `/r/${encodeURIComponent(slug)}` : target === 'dashboard' ? '/dashboard' : '/';
    window.history.pushState({}, '', nextUrl);
    setStandParam(slug);
    setRoute(target);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('home');
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className={darkMode ? 'min-h-screen flex flex-col bg-slate-950 text-slate-100' : 'min-h-screen flex flex-col bg-slate-50 text-slate-900'}>
      {/* Top Navbar */}
      <header className={darkMode ? 'sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur' : 'sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur'}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('home')} className="flex items-center gap-2.5 text-left">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base block leading-none">FeedbackPulse101</span>
              <span className="text-[11px] text-slate-500 font-medium">Smart QR & NFC Reputation</span>
            </div>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className={darkMode ? 'p-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900' : 'p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {session ? (
              <>
                <button
                  onClick={() => navigate('dashboard')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className={darkMode ? 'p-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900' : 'p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('dashboard')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition"
              >
                Owner Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {route === 'home' && <HomePage onOpenSerial={(s) => navigate('rate', s)} onOpenDash={() => navigate('dashboard')} darkMode={darkMode} />}
        {route === 'rate' && <GuestRatingPage slug={standParam} darkMode={darkMode} />}
        {route === 'dashboard' && <DashboardRouter session={session} darkMode={darkMode} onOpenLegal={setLegalModal} />}
      </main>

      {/* Footer */}
      <footer className={darkMode ? 'border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-400 space-y-3' : 'border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 space-y-3 bg-white'}>
        <div className="flex flex-wrap justify-center gap-6 font-medium">
          <button onClick={() => setLegalModal('terms')} className="hover:text-indigo-600">Terms & Conditions</button>
          <button onClick={() => setLegalModal('privacy')} className="hover:text-indigo-600">Privacy Policy (DPDP 2023)</button>
          <button onClick={() => setLegalModal('refund')} className="hover:text-indigo-600">Refund & Cancellation</button>
          <button onClick={() => setLegalModal('contact')} className="hover:text-indigo-600">Contact & Grievance</button>
        </div>
        <p>FeedbackPulse101 • MSME Registered Enterprise • Secure SSL & RLS Protected Platform</p>
      </footer>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} darkMode={darkMode} />}
    </div>
  );
}

/* ==================== 1. HOME PAGE ==================== */
function HomePage({ onOpenSerial, onOpenDash, darkMode }) {
  const [serial, setSerial] = useState('');

  const handleOpen = (e) => {
    e.preventDefault();
    if (serial.trim()) onOpenSerial(serial.trim().toUpperCase());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5" /> Tap NFC or Scan QR • Instant Reputation Routing
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Turn Happy Walk-Ins Into <span className="text-indigo-600">5-Star Google Reviews</span>
        </h1>
        <p className={darkMode ? 'text-slate-400 text-base sm:text-lg' : 'text-slate-600 text-base sm:text-lg'}>
          Delighted customers go straight to your Google Business review page. Unhappy guests share private feedback directly with the owner before posting publicly.
        </p>

        <form onSubmit={handleOpen} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Enter Stand Serial (e.g. TR-8421-MPK)"
            className={darkMode ? 'flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm' : 'flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm shadow-xs'}
          />
          <button type="submit" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs">
            Open Stand
          </button>
        </form>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { icon: Star, title: 'Smart Score Routing', desc: 'Scores 8–10 route directly to Google Reviews; scores 1–7 open a private resolution box.' },
          { icon: Layers, title: 'Multi-Floor QR Bundles', desc: 'Place stands at Reception, Billing & Tables—manage all locations in one unified owner dashboard.' },
          { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Row-Level Security, 8-digit OTP login & cancellation protection, and bot rate limiting built in.' },
        ].map((item, idx) => (
          <div key={idx} className={darkMode ? 'p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2' : 'p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2'}>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">{item.title}</h3>
            <p className={darkMode ? 'text-xs text-slate-400 leading-relaxed' : 'text-xs text-slate-600 leading-relaxed'}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 2. GUEST RATING PAGE (WITH TURNSTILE) ==================== */
function GuestRatingPage({ slug, darkMode }) {
  const [stand, setStand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(null);
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadStand = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('qr_stands')
        .select('id, business_name, stand_slug, location_label, google_review_url, is_active')
        .eq('stand_slug', slug.toUpperCase())
        .maybeSingle();
      setStand(data);
      setLoading(false);
    };
    if (slug) loadStand();
  }, [slug]);

  const submitFeedback = async (selectedScore, isHigh) => {
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setErrorMsg('Please complete the human verification check below first.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.from('feedback_logs').insert({
      stand_id: stand.id,
      rating_score: selectedScore,
      feedback_text: note.trim().slice(0, 1000) || null,
      customer_contact: contact.trim().slice(0, 120) || null,
      routed_to_google: isHigh,
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message.includes('Rate limit') ? 'Too many submissions. Please wait a few minutes.' : 'Unable to submit feedback right now.');
      return;
    }

    if (isHigh && stand.google_review_url) {
      window.location.href = stand.google_review_url;
    } else {
      setSubmitted(true);
    }
  };

  const handleScoreSelect = (num) => {
    setScore(num);
    if (num >= 8) {
      submitFeedback(num, true);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm text-slate-500">Loading stand...</div>;
  if (!stand || !stand.is_active) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="font-bold text-lg">Stand Inactive or Not Found</h2>
        <p className="text-xs text-slate-500">Please verify the QR serial code ({slug}) or contact the business.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className={darkMode ? 'p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-5' : 'p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5'}>
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            {stand.stand_slug} {stand.location_label ? `• ${stand.location_label}` : ''}
          </span>
          <h1 className="text-xl font-extrabold pt-1">{stand.business_name}</h1>
          <p className="text-xs text-slate-500">How was your experience with us today? (1 = Poor, 10 = Outstanding)</p>
        </div>

        <TurnstileWidget onVerify={setCaptchaToken} />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium text-center">{errorMsg}</div>
        )}

        {submitted ? (
          <div className="p-5 rounded-xl bg-emerald-50 text-emerald-800 text-center space-y-1">
            <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-600" />
            <p className="font-bold text-sm">Thank you for your feedback!</p>
            <p className="text-xs">Your note has been sent directly to the management team.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleScoreSelect(num)}
                  className={`py-3 rounded-xl font-bold text-sm border transition ${
                    score === num
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : num >= 8
                      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100'
                      : 'border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {score !== null && score < 8 && (
              <form
                onSubmit={(e) => { e.preventDefault(); submitFeedback(score, false); }}
                className="space-y-3 pt-2 border-t border-slate-100"
              >
                <p className="text-xs font-semibold text-slate-700">We want to make this right. Tell the owner what happened:</p>
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Share details so we can improve..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
                />
                <input
                  type="text"
                  maxLength={120}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone or Email (optional, for follow-up)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Send Private Feedback'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ==================== 3. DASHBOARD ROUTER (AUTH + LEGAL GATE + ROLE SPLIT) ==================== */
function DashboardRouter({ session, darkMode, onOpenLegal }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false); // Unchecked by default
  const [ownerFullName, setOwnerFullName] = useState('');

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from('owner_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!data) {
        const isSuper = session.user.email?.toLowerCase() === ADMIN_EMAIL;
        const { data: created } = await supabase
          .from('owner_profiles')
          .upsert({ id: session.user.id, email: session.user.email, is_super_admin: isSuper })
          .select()
          .single();
        setProfile(created);
      } else {
        setProfile(data);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [session]);

  const sendOtp = async (e) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setAuthError('Please complete the human verification widget first.');
      return;
    }
    setAuthError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setAuthError(error.message);
    else setOtpSent(true);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpCode.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) setAuthError(error.message);
  };

  const acceptLegalTerms = async (e) => {
    e.preventDefault();
    if (!consentChecked) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('owner_profiles')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: ownerFullName.trim() || null,
        is_super_admin: session.user.email?.toLowerCase() === ADMIN_EMAIL,
        terms_accepted_at: new Date().toISOString(),
        age_confirmed: true,
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) setProfile(data);
  };

  // 1. Not Signed In -> Secure OTP + Turnstile Login
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className={darkMode ? 'p-8 bg-slate-900 rounded-2xl border border-slate-800 space-y-4' : 'p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4'}>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" /> Server-Verified OTP Sign In
          </div>
          <h2 className="text-xl font-extrabold">Owner & Admin Portal</h2>
          <p className="text-xs text-slate-500">
            {otpSent
              ? `Enter the 8-digit verification code sent to ${email}`
              : 'Enter your registered email to receive a one-time security code.'}
          </p>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">{authError}</div>
          )}

          {otpSent ? (
            <form onSubmit={verifyOtp} className="space-y-3">
              <input
                type="text"
                required
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="8-digit security code"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest text-slate-900"
              />
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Open Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpCode(''); setAuthError(''); }}
                className="w-full text-xs text-slate-500 hover:underline"
              >
                Use a different email address
              </button>
            </form>
          ) : (
            <form onSubmit={sendOtp} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourbusiness.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
              />
              <TurnstileWidget onVerify={setCaptchaToken} />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Sending Security Code...' : 'Send 8-Digit Login Code'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return <div className="py-20 text-center text-sm text-slate-500">Verifying security profile...</div>;
  }

  // 2. Mandatory Legal, 18+ Age Consent & Privacy Acceptance Gate (Before accessing dashboard)
  if (!profile.terms_accepted_at || !profile.age_confirmed) {
    return (
      <div className="max-w-xl mx-auto my-10 px-4">
        <form onSubmit={acceptLegalTerms} className={darkMode ? 'p-8 bg-slate-900 rounded-2xl border border-slate-800 space-y-5' : 'p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5'}>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Mandatory Compliance & Age Verification
          </div>
          <h2 className="text-xl font-extrabold">Welcome to FeedbackPulse101</h2>
          <div className={darkMode ? 'p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed' : 'p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed'}>
            <p><strong>How FeedbackPulse101 Works:</strong> Our web platform connects physical QR/NFC stands to smart customer routing. Satisfied guests (score 8–10) are directed to your public Google review link, while dissatisfied guests (score 1–7) submit private service feedback exclusively to your owner dashboard.</p>
            <p><strong>Regulatory & Ethical Policy:</strong> In accordance with the Consumer Protection Act, 2019 (CCPA Guidelines), merchants must never fabricate reviews, offer cash/discounts for 5-star ratings, or coerce customers. Data is encrypted and stored in compliance with India's Digital Personal Data Protection (DPDP) Act, 2023.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Business Owner / Authorized Representative Name</label>
            <input
              type="text"
              required
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs leading-relaxed">
              I confirm that I am <strong>18 years of age or older</strong>, authorized to represent my business, and I have read and agree to the{' '}
              <button type="button" onClick={() => onOpenLegal('terms')} className="text-indigo-600 underline font-semibold">Terms & Conditions</button> and{' '}
              <button type="button" onClick={() => onOpenLegal('privacy')} className="text-indigo-600 underline font-semibold">Privacy Policy (DPDP Act, 2023)</button>.
            </span>
          </label>

          <button
            type="submit"
            disabled={!consentChecked || loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Saving Consent...' : 'Accept & Enter Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  // 3. Separate Super Admin Console vs Shop Owner Dashboard
  if (profile.is_super_admin) {
    return <SuperAdminDashboard session={session} darkMode={darkMode} />;
  }

  return <ShopOwnerDashboard session={session} profile={profile} darkMode={darkMode} />;
}

/* ==================== 4. SUPER ADMIN DASHBOARD (ASSIGN STANDS, BUNDLES & APPROVE CASH/UPI) ==================== */
function SuperAdminDashboard({ session, darkMode }) {
  const [stands, setStands] = useState([]);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [bizName, setBizName] = useState('');
  const [slug, setSlug] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [bundleName, setBundleName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [selectedForBundle, setSelectedForBundle] = useState([]);
  const [newBundleTitle, setNewBundleTitle] = useState('');
  const [msg, setMsg] = useState('');

  const loadAllStands = async () => {
    const { data } = await supabase.from('qr_stands').select('*').order('created_at', { ascending: false });
    setStands(data || []);
  };

  useEffect(() => { loadAllStands(); }, []);

  const assignNewStand = async (e) => {
    e.preventDefault();
    setMsg('');
    const reviewUrl = placeId.startsWith('http')
      ? placeId.trim()
      : `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;

    const { error } = await supabase.from('qr_stands').insert({
      owner_id: session.user.id,
      owner_email: ownerEmail.trim().toLowerCase(),
      business_name: bizName.trim(),
      stand_slug: slug.trim().toUpperCase(),
      location_label: locationLabel.trim() || 'Main Counter',
      bundle_name: bundleName.trim() || null,
      google_review_url: reviewUrl,
      payment_method: payMethod,
      payment_status: 'ACTIVE',
      subscription_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) setMsg(`Error: ${error.message}`);
    else {
      setMsg(`Stand ${slug.toUpperCase()} assigned to ${ownerEmail}!`);
      setSlug(''); setLocationLabel('');
      loadAllStands();
    }
  };

  const createBundleFromSelected = async () => {
    if (!newBundleTitle.trim() || selectedForBundle.length === 0) return;
    await supabase
      .from('qr_stands')
      .update({ bundle_name: newBundleTitle.trim() })
      .in('id', selectedForBundle);
    setSelectedForBundle([]);
    setNewBundleTitle('');
    setMsg('Multi-QR Bundle created and linked to owner dashboard!');
    loadAllStands();
  };

  const approveAndExtendPayment = async (standId) => {
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('qr_stands')
      .update({ payment_status: 'ACTIVE', is_active: true, subscription_expires_at: next30Days })
      .eq('id', standId);
    setMsg('Payment confirmed & subscription extended by 30 days.');
    loadAllStands();
  };

  const toggleSelectStand = (id) => {
    setSelectedForBundle((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            Super Admin Console
          </span>
          <h1 className="text-2xl font-extrabold mt-1">Stand Assignment, Bundles & Payment Approvals</h1>
        </div>
      </div>

      {msg && <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">{msg}</div>}

      {/* Assign Stand to Shop Owner */}
      <form onSubmit={assignNewStand} className={darkMode ? 'p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4' : 'p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4'}>
        <h2 className="font-bold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" /> Assign New QR / NFC Stand to Shop Owner</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Shop Owner Email" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Business Name" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Stand Serial (e.g. FP-101)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Placement (e.g. Ground Floor / Reception)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="Bundle Name (optional, e.g. Hotel Main Wing)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Google Place ID or Review Link" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">Initial Payment Mode:</span>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900">
              <option value="CASH">Cash Collected</option>
              <option value="UPI">UPI Payment</option>
            </select>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
            Assign Stand to Owner
          </button>
        </div>
      </form>

      {/* Bundle Multiple QR Stands for One Owner */}
      <div className={darkMode ? 'p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3' : 'p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-3'}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Bundle Selected Stands ({selectedForBundle.length} selected):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newBundleTitle}
            onChange={(e) => setNewBundleTitle(e.target.value)}
            placeholder="Bundle Name (e.g. All 4 Floors Bundle)"
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
          />
          <button
            type="button"
            onClick={createBundleFromSelected}
            disabled={selectedForBundle.length === 0 || !newBundleTitle.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            Create Owner Bundle
          </button>
        </div>
      </div>

      {/* All Assigned Stands & Payment Approvals */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">All Deployed Stands ({stands.length})</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {stands.map((s) => (
            <div key={s.id} className={darkMode ? 'p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5' : 'p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5'}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedForBundle.includes(s.id)} onChange={() => toggleSelectStand(s.id)} className="rounded text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-sm">{s.business_name} <span className="text-xs font-normal text-slate-500">({s.location_label || 'Main'})</span></h3>
                    <p className="text-xs text-slate-500">Owner: {s.owner_email || 'Unassigned'}</p>
                  </div>
                </label>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">{s.stand_slug}</span>
              </div>

              {s.bundle_name && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  <Layers className="w-3 h-3" /> Bundle: {s.bundle_name}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span>
                  Status: <strong>{s.payment_status}</strong> ({s.payment_method || 'CASH'}) • Exp: {new Date(s.subscription_expires_at).toLocaleDateString('en-IN')}
                </span>
                <button
                  onClick={() => approveAndExtendPayment(s.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Approve Cash/UPI (+30d)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== 5. SHOP OWNER DASHBOARD (MULTI-STAND BUNDLES, CASH/UPI, 7-DAY ALERT & OTP CANCEL) ==================== */
function ShopOwnerDashboard({ session, profile, darkMode }) {
  const [stands, setStands] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeBundleFilter, setActiveBundleFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState('');

  // Individual Stand Payment Modal (Cash or UPI)
  const [payStand, setPayStand] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('CASH');
  const [payNotice, setPayNotice] = useState('');

  // OTP-Verified Subscription Cancellation Modal
  const [cancelStand, setCancelStand] = useState(null);
  const [cancelOtpSent, setCancelOtpSent] = useState(false);
  const [cancelOtpCode, setCancelOtpCode] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadOwnerData = async () => {
    const { data: sData } = await supabase.from('qr_stands').select('*').order('created_at', { ascending: false });
    setStands(sData || []);
    const { data: lData } = await supabase.from('feedback_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs(lData || []);
  };

  useEffect(() => { loadOwnerData(); }, []);

  const getDaysLeft = (isoDate) => {
    const diff = new Date(isoDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const expiringSoonStands = stands.filter((s) => s.is_active && getDaysLeft(s.subscription_expires_at) <= 7);
  const bundleNames = Array.from(new Set(stands.map((s) => s.bundle_name).filter(Boolean)));
  const visibleStands = activeBundleFilter === 'ALL'
    ? stands
    : stands.filter((s) => s.bundle_name === activeBundleFilter);

  const submitIndividualPayment = async () => {
    if (!payStand) return;
    await supabase
      .from('qr_stands')
      .update({
        payment_method: selectedPayMethod,
        payment_status: selectedPayMethod === 'CASH' ? 'CASH_PENDING_COLLECTION' : 'UPI_PENDING_VERIFY',
      })
      .eq('id', payStand.id);
    setPayNotice(
      selectedPayMethod === 'CASH'
        ? `Cash payment request recorded for ${payStand.stand_slug}. Our representative will collect cash and extend validity.`
        : `UPI payment marked for ${payStand.stand_slug}. Admin will confirm receipt shortly.`
    );
    setPayStand(null);
    loadOwnerData();
  };

  const initiateCancelOtp = async () => {
    setCancelError('');
    setCancelBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: session.user.email,
      options: { shouldCreateUser: false },
    });
    setCancelBusy(false);
    if (error) setCancelError(error.message);
    else setCancelOtpSent(true);
  };

  const confirmCancelWithOtp = async (e) => {
    e.preventDefault();
    setCancelError('');
    setCancelBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: session.user.email,
      token: cancelOtpCode.trim(),
      type: 'email',
    });
    if (error) {
      setCancelBusy(false);
      setCancelError('Invalid or expired 8-digit OTP code.');
      return;
    }

    await supabase
      .from('qr_stands')
      .update({ is_active: false, payment_status: 'CANCELLED' })
      .eq('id', cancelStand.id);

    setCancelBusy(false);
    setCancelStand(null);
    setCancelOtpSent(false);
    setCancelOtpCode('');
    setPayNotice(`Subscription for stand ${cancelStand.stand_slug} has been cancelled after OTP verification.`);
    loadOwnerData();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Shop Owner Dashboard</h1>
          <p className="text-xs text-slate-500">
            {profile.full_name ? `${profile.full_name} • ` : ''}{session.user.email} • {stands.length} Active QR/NFC Stand(s)
          </p>
        </div>
      </div>

      {/* 1-Week (7-Day) Renewal Reminder Banner */}
      {expiringSoonStands.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong>Subscription Renewal Reminder (Within 7 Days):</strong>{' '}
              {expiringSoonStands.map((s) => `${s.stand_slug} (${getDaysLeft(s.subscription_expires_at)}d left)`).join(', ')}.
            </div>
          </div>
          <button
            onClick={() => setPayStand(expiringSoonStands[0])}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            Renew Now (Cash / UPI)
          </button>
        </div>
      )}

      {payNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex justify-between items-center">
          <span>{payNotice}</span>
          <button onClick={() => setPayNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Multi-Stand Bundle Filter Bar (Shown when owner has bundled stands) */}
      {bundleNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> QR Bundles:</span>
          <button
            onClick={() => setActiveBundleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${activeBundleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            All Stands ({stands.length})
          </button>
          {bundleNames.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBundleFilter(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${activeBundleFilter === b ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              {b} ({stands.filter((s) => s.bundle_name === b).length})
            </button>
          ))}
        </div>
      )}

      {/* All Owner Stands Grid with Individual Pay, Time Left & OTP Cancel */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Your QR & NFC Stands ({visibleStands.length})</h2>
        {visibleStands.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
            No stands assigned to <strong>{session.user.email}</strong> yet. Contact support@feedbackpulse101.in to activate your stand.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {visibleStands.map((s) => {
              const daysLeft = getDaysLeft(s.subscription_expires_at);
              const shareUrl = `${window.location.origin}/r/${s.stand_slug}`;
              return (
                <div key={s.id} className={darkMode ? 'p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4' : 'p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4'}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-extrabold text-base">{s.business_name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Placement: <strong>{s.location_label || 'Main Counter'}</strong> • Serial: <span className="font-mono font-bold text-indigo-600">{s.stand_slug}</span>
                      </p>
                      {s.bundle_name && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          <Layers className="w-3 h-3" /> Bundle: {s.bundle_name}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      !s.is_active ? 'bg-rose-50 text-rose-700' : daysLeft <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {!s.is_active ? 'Cancelled' : `${daysLeft} days left`}
                    </span>
                  </div>

                  {/* Quick Copy / Preview URL */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                    <span className="truncate font-mono">{shareUrl}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedId(s.id); setTimeout(() => setCopiedId(''), 1500); }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                        title="Copy Link"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={shareUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700" title="Open Stand">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Individual Stand Subscription Button (Shows Time Left + Cash/UPI Pay) & OTP Cancel */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => { setPayStand(s); setSelectedPayMethod('CASH'); }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay / Renew ({daysLeft}d left)
                    </button>

                    {s.is_active && (
                      <button
                        onClick={() => { setCancelStand(s); setCancelOtpSent(false); setCancelOtpCode(''); setCancelError(''); }}
                        className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Private Feedback Ledger */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Customer Feedback Inbox ({logs.length})</h2>
        <div className={darkMode ? 'rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800' : 'rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-xs'}>
          {logs.length === 0 && <p className="p-6 text-xs text-slate-500">No guest ratings recorded yet.</p>}
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${l.rating_score >= 8 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    Score: {l.rating_score}/10
                  </span>
                  <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm mt-1">{l.feedback_text || 'Rated without written note'}</p>
                {l.customer_contact && <p className="text-xs text-indigo-600 font-medium mt-0.5">Guest Contact: {l.customer_contact}</p>}
              </div>
              <span className="text-xs font-semibold text-slate-500">{l.routed_to_google ? 'Routed to Google' : 'Private Resolution'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Individual Stand Cash / UPI Payment */}
      {payStand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Renew Stand: {payStand.stand_slug}</h3>
              <button onClick={() => setPayStand(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600">
              Location: <strong>{payStand.location_label || 'Main'}</strong> • Time Left: <strong>{getDaysLeft(payStand.subscription_expires_at)} days</strong>. Select your preferred payment mode (₹149/month):
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPayMethod('CASH')}
                className={`p-4 rounded-xl border text-left space-y-1 ${selectedPayMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-xs">Pay in Cash</div>
                <div className="text-[11px] text-slate-500">In-person cash collection</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayMethod('UPI')}
                className={`p-4 rounded-xl border text-left space-y-1 ${selectedPayMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}
              >
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <div className="font-bold text-xs">Pay via UPI</div>
                <div className="text-[11px] text-slate-500">{OWNER_UPI_ID || 'Direct UPI transfer'}</div>
              </button>
            </div>

            {selectedPayMethod === 'UPI' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                {OWNER_UPI_ID
                  ? <>Send ₹149 to UPI ID: <strong className="font-mono">{OWNER_UPI_ID}</strong> (Ref: {payStand.stand_slug}) and click Confirm below.</>
                  : <>UPI handle will be updated shortly—you can select <strong>Pay in Cash</strong> right now for immediate collection.</>}
              </div>
            )}

            <button
              onClick={submitIndividualPayment}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
            >
              Confirm {selectedPayMethod === 'CASH' ? 'Cash Payment' : 'UPI Payment'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: OTP-Verified Subscription Cancellation */}
      {cancelStand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-rose-600">Cancel Subscription — {cancelStand.stand_slug}</h3>
              <button onClick={() => setCancelStand(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600">
              For your account security, cancelling a QR/NFC stand requires verifying an <strong>8-digit OTP code</strong> sent to <strong>{session.user.email}</strong>.
            </p>

            {cancelError && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">{cancelError}</div>}

            {!cancelOtpSent ? (
              <button
                onClick={initiateCancelOtp}
                disabled={cancelBusy}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {cancelBusy ? 'Sending OTP...' : 'Send Cancellation OTP to My Email'}
              </button>
            ) : (
              <form onSubmit={confirmCancelWithOtp} className="space-y-3">
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={cancelOtpCode}
                  onChange={(e) => setCancelOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 8-digit OTP code"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-base tracking-widest"
                />
                <button
                  type="submit"
                  disabled={cancelBusy || cancelOtpCode.length < 6}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {cancelBusy ? 'Verifying...' : 'Verify OTP & Cancel Stand'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 6. LEGAL MODAL ==================== */
function LegalModal({ type, onClose }) {
  const content = {
    terms: {
      title: 'Terms & Conditions — FeedbackPulse101',
      body: 'FeedbackPulse101 provides smart QR & NFC feedback routing software and stands for businesses in India. Users must be 18+ years of age. Merchants agree to comply with the Consumer Protection Act, 2019 and CCPA guidelines by never fabricating reviews or incentivizing positive ratings.',
    },
    privacy: {
      title: 'Privacy Policy (DPDP Act, 2023 Compliant)',
      body: 'FeedbackPulse101 collects business owner details and voluntary guest feedback. All data is encrypted in transit (HTTPS/SSL) and at rest, protected by Row-Level Security (RLS) on Supabase and Cloudflare infrastructure (which may process data in compliant global jurisdictions under Section 16 of the DPDP Act, 2023). Users may request access or erasure anytime.',
    },
    refund: {
      title: 'Refund & Cancellation Policy',
      body: 'Physical NFC/QR stands include a 90-day software trial and free replacement for transit damage. Ongoing subscriptions (₹149/mo per stand) can be cancelled anytime via OTP verification in the Owner Dashboard prior to the next billing cycle.',
    },
    contact: {
      title: 'Contact & Grievance Officer',
      body: 'Enterprise: FeedbackPulse101 (MSME Registered Enterprise, Bhopal / Raisen, Madhya Pradesh, India). Email: support@feedbackpulse101.in',
    },
  }[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-slate-900 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-base">{content.title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{content.body}</p>
      </div>
    </div>
  );
}
