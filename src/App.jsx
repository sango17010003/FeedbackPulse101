import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, QrCode, Star, AlertTriangle, CheckCircle2, LogOut,
  Plus, Layers, CreditCard, Banknote, Smartphone, Clock, Sun, Moon,
  Lock, ExternalLink, Copy, Check, X, Building2, Sparkles, Edit3, Trash2
} from 'lucide-react';
import { supabase } from './supabaseClient';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const ADMIN_EMAIL = 'sangosignature@gmail.com';
const OWNER_UPI_ID = ''; // Add your UPI ID here (e.g. 'yourname@oksbi') when ready; defaults to Cash collection until added

const SUBSCRIPTION_PLANS = [
  { id: 'PLAN_3M', label: '3 Months', months: 3, days: 90, price: 399, badge: 'Starter' },
  { id: 'PLAN_6M', label: '6 Months', months: 6, days: 180, price: 699, badge: 'Save ₹99' },
  { id: 'PLAN_12M', label: '12 Months', months: 12, days: 365, price: 1199, badge: 'Best Value' },
];

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

      <main className="flex-1">
        {route === 'home' && <HomePage onOpenSerial={(s) => navigate('rate', s)} darkMode={darkMode} />}
        {route === 'rate' && <GuestRatingPage slug={standParam} darkMode={darkMode} />}
        {route === 'dashboard' && <DashboardRouter session={session} darkMode={darkMode} onOpenLegal={setLegalModal} />}
      </main>

      <footer className={darkMode ? 'border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-400 space-y-3' : 'border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 space-y-3 bg-white'}>
        <div className="flex flex-wrap justify-center gap-6 font-medium">
          <button onClick={() => setLegalModal('terms')} className="hover:text-indigo-600">Terms & Conditions</button>
          <button onClick={() => setLegalModal('privacy')} className="hover:text-indigo-600">Privacy Policy (DPDP 2023)</button>
          <button onClick={() => setLegalModal('refund')} className="hover:text-indigo-600">Refund & Cancellation</button>
          <button onClick={() => setLegalModal('contact')} className="hover:text-indigo-600">Contact & Grievance</button>
        </div>
        <p>FeedbackPulse101 • MSME Registered Enterprise • Secure SSL & RLS Protected Platform</p>
      </footer>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  );
}

/* ==================== 1. HOME PAGE ==================== */
function HomePage({ onOpenSerial, darkMode }) {
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
            placeholder="Enter Stand Serial (e.g. STAND3)"
            className={darkMode ? 'flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm' : 'flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm shadow-xs'}
          />
          <button type="submit" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs">
            Open Stand
          </button>
        </form>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { icon: Star, title: 'Smart Score Routing', desc: '3-question 5-star survey routes happy guests to Google Reviews and private feedback to the owner.' },
          { icon: Layers, title: 'Multi-Floor QR Bundles', desc: 'Place stands at Reception, Billing & Tables—manage all locations in one unified owner dashboard.' },
          { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Email-isolated Row-Level Security, 8-digit OTP login & cancellation protection, and bot rate limiting.' },
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

/* ==================== 2. GUEST RATING PAGE ==================== */
function GuestRatingPage({ slug, darkMode }) {
  const [stand, setStand] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);

  const [reviewText, setReviewText] = useState('');
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const [contact, setContact] = useState('');
  const [lowScorePage, setLowScorePage] = useState(false);
  const [privateSaved, setPrivateSaved] = useState(false);

  const [captchaToken, setCaptchaToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadStand = async () => {
      setLoading(true);
      const { data } = await supabase.rpc('get_public_stand_by_slug', { p_slug: slug });
      setStand(Array.isArray(data) ? data[0] || null : data);
      setLoading(false);
    };
    if (slug) loadStand();
  }, [slug]);

  const totalStars = q1 + q2 + q3;
  const allAnswered = q1 > 0 && q2 > 0 && q3 > 0;

  const getAiPresets = (bizName, loc) => [
    `Had a wonderful experience at ${bizName}${loc ? ` (${loc})` : ''}! Top-notch quality, polite staff, and great hygiene. Highly recommended!`,
    `Really impressed by the service and friendliness of the team at ${bizName}. Everything was smooth, clean, and worth every rupee!`,
    `One of the best places to visit! ${bizName} delivers consistently great quality and warm hospitality. Will definitely come back again.`,
    `Quick service, welcoming atmosphere, and genuine care for customers at ${bizName}. Five stars all the way!`,
  ];

  const handleSelectPreset = async (text, idx) => {
    setSelectedPresetIdx(idx);
    setReviewText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {}
  };

  const copyReviewToClipboard = async (text) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopiedToast(true);
    } catch {}
  };

  const closePageSafely = () => {
    try {
      window.open('', '_self');
      window.close();
    } catch {}
    setPrivateSaved(true);
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) {
      setErrorMsg('Please rate all 3 questions before continuing.');
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setErrorMsg('Please complete the human verification check first.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const isLowScore = totalStars < 7;
    const breakdownSummary = `[Q1:${q1}/5, Q2:${q2}/5, Q3:${q3}/5 | Total:${totalStars}/15] ${reviewText.trim()}`;

    const { error } = await supabase.from('feedback_logs').insert({
      stand_id: stand.id,
      rating_score: totalStars,
      feedback_text: breakdownSummary.slice(0, 1000),
      customer_contact: contact.trim().slice(0, 120) || null,
      routed_to_google: !isLowScore,
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message.includes('Rate limit') ? 'Too many submissions. Please try again shortly.' : 'Unable to submit feedback right now.');
      return;
    }

    if (isLowScore) {
      setLowScorePage(true);
    } else {
      await copyReviewToClipboard(reviewText);
      if (stand.google_review_url) {
        setTimeout(() => {
          window.location.href = stand.google_review_url;
        }, 700);
      }
    }
  };

  const saveFollowUpContact = async (e) => {
    e.preventDefault();
    if (!contact.trim()) {
      closePageSafely();
      return;
    }
    await supabase.from('feedback_logs').insert({
      stand_id: stand.id,
      rating_score: totalStars || 1,
      feedback_text: `[Follow-up Request | Total:${totalStars}/15] ${reviewText.trim()}`.slice(0, 1000),
      customer_contact: contact.trim().slice(0, 120),
      routed_to_google: false,
    });
    setPrivateSaved(true);
    setTimeout(() => {
      closePageSafely();
    }, 1500);
  };

  if (loading) return <div className="py-20 text-center text-sm text-slate-500">Loading survey...</div>;
  if (!stand || !stand.is_active) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="font-bold text-lg">Stand Inactive or Not Found</h2>
        <p className="text-xs text-slate-500">Please verify the QR serial code ({slug}) or contact the business.</p>
      </div>
    );
  }

  const questions = [
    { label: '1. Quality of Product / Service', value: q1, setter: setQ1 },
    { label: '2. Staff Behavior & Speed', value: q2, setter: setQ2 },
    { label: '3. Cleanliness & Overall Value', value: q3, setter: setQ3 },
  ];

  const presets = getAiPresets(stand.business_name, stand.location_label);

  if (lowScorePage) {
    return (
      <div className="max-w-md mx-auto my-10 px-4">
        <div className={darkMode ? 'p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-5' : 'p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-5'}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold">Thank You for Your Visit!</h1>
            <p className={darkMode ? 'text-xs sm:text-sm text-slate-300 leading-relaxed' : 'text-xs sm:text-sm text-slate-600 leading-relaxed'}>
              We truly appreciate your honest review for <strong>{stand.business_name}</strong> ({totalStars}/15 stars). Your feedback has been shared directly with the owner so we can improve your next experience.
            </p>
          </div>

          {!privateSaved ? (
            <form onSubmit={saveFollowUpContact} className="space-y-2.5 text-left pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-500">Want the manager to reach out to resolve this? (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={120}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone or Email"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                  Send
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              Feedback saved! You may now safely close this page.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            {stand.google_review_url && (
              <>
                <p className="text-[11px] text-slate-400">Prefer to post publicly as well?</p>
                <a
                  href={stand.google_review_url}
                  onClick={() => copyReviewToClipboard(reviewText)}
                  className={darkMode ? 'w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-2' : 'w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2'}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Write on Google Maps
                </a>
              </>
            )}

            <button
              type="button"
              onClick={closePageSafely}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Done & Close Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 px-4">
      <form onSubmit={handleSurveySubmit} className={darkMode ? 'p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-5' : 'p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5'}>
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            {stand.stand_slug} {stand.location_label ? `• ${stand.location_label}` : ''}
          </span>
          <h1 className="text-xl font-extrabold pt-1">{stand.business_name}</h1>
          <p className="text-xs text-slate-500">Rate 3 quick questions below ({totalStars}/15 Stars)</p>
        </div>

        {/* Stars Below Each Question */}
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className={darkMode ? 'p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-start gap-2.5' : 'p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-start gap-2.5'}>
              <div className="w-full flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold">{q.label}</span>
                <span className="text-[11px] font-semibold text-slate-400">{q.value}/5</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => q.setter(starNum)}
                    className="p-0.5 transition transform hover:scale-110"
                    aria-label={`${starNum} stars`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        starNum <= q.value
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold flex items-center gap-1.5 text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" /> AI Quick-Write Suggestions (Tap to Auto-Fill & Copy)
            </label>
            {copiedToast && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Copied!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset, idx)}
                className={`text-left p-2.5 rounded-xl border text-xs transition ${
                  selectedPresetIdx === idx
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-medium'
                    : darkMode
                    ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
                }`}
              >
                “{preset}”
              </button>
            ))}
          </div>

          <div className="relative pt-1">
            <textarea
              rows={3}
              maxLength={1000}
              value={reviewText}
              onChange={(e) => { setReviewText(e.target.value); setSelectedPresetIdx(null); }}
              placeholder="Tap any AI suggestion above or write your review here (auto-copied for Google Reviews)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
            />
            {reviewText.trim() && (
              <button
                type="button"
                onClick={() => copyReviewToClipboard(reviewText)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy text again
              </button>
            )}
          </div>
        </div>

        <TurnstileWidget onVerify={setCaptchaToken} />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium text-center">{errorMsg}</div>
        )}

        <button
          type="submit"
          disabled={submitting || !allAnswered}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs disabled:opacity-50"
        >
          {submitting
            ? 'Submitting...'
            : !allAnswered
            ? 'Rate All 3 Questions to Continue'
            : totalStars < 7
            ? 'Submit Feedback'
            : 'Copy Review & Continue to Google Maps'}
        </button>

        {allAnswered && totalStars >= 7 && (
          <p className="text-[11px] text-center text-slate-400">
            Your message is automatically copied—just long-press and tap <strong>Paste</strong> inside Google Reviews!
          </p>
        )}
      </form>
    </div>
  );
}

/* ==================== 3. DASHBOARD ROUTER ==================== */
function DashboardRouter({ session, darkMode, onOpenLegal }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
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
              ? `Enter the 8-digit verification PIN sent to ${email}`
              : 'Enter your registered email to receive an 8-digit security PIN.'}
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
                placeholder="8-digit security PIN"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest text-slate-900"
              />
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify PIN & Open Dashboard'}
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
                {loading ? 'Sending 8-Digit PIN...' : 'Send 8-Digit Login PIN'}
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

  if (!profile.terms_accepted_at || !profile.age_confirmed) {
    return (
      <div className="max-w-xl mx-auto my-10 px-4">
        <form onSubmit={acceptLegalTerms} className={darkMode ? 'p-8 bg-slate-900 rounded-2xl border border-slate-800 space-y-5' : 'p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5'}>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Mandatory Compliance & Age Verification
          </div>
          <h2 className="text-xl font-extrabold">Welcome to FeedbackPulse101</h2>
          <div className={darkMode ? 'p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed' : 'p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed'}>
            <p><strong>How FeedbackPulse101 Works:</strong> Our web platform connects physical QR/NFC stands to smart customer routing. Satisfied guests (7–15 stars) are directed to your public Google review link, while dissatisfied guests (under 7 stars) submit private service feedback exclusively to your owner dashboard.</p>
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

  if (profile.is_super_admin) {
    return <SuperAdminDashboard session={session} darkMode={darkMode} />;
  }

  return <ShopOwnerDashboard session={session} profile={profile} darkMode={darkMode} />;
}

/* ==================== 4. SUPER ADMIN DASHBOARD (ASSIGN, REASSIGN/EDIT, BUNDLE & DELETE) ==================== */
function SuperAdminDashboard({ session, darkMode }) {
  const [stands, setStands] = useState([]);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [bizName, setBizName] = useState('');
  const [slug, setSlug] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [bundleName, setBundleName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [selectedPlanId, setSelectedPlanId] = useState('PLAN_3M');
  const [selectedForBundle, setSelectedForBundle] = useState([]);
  const [newBundleTitle, setNewBundleTitle] = useState('');
  const [msg, setMsg] = useState('');

  // Reassign / Edit Stand Modal state
  const [editStand, setEditStand] = useState(null);
  const [editForm, setEditForm] = useState({
    owner_email: '',
    business_name: '',
    stand_slug: '',
    location_label: '',
    bundle_name: '',
    google_review_url: '',
    plan_type: 'PLAN_3M',
    is_active: true,
  });

  const loadAllStands = async () => {
    const { data } = await supabase.from('qr_stands').select('*').order('created_at', { ascending: false });
    setStands(data || []);
  };

  useEffect(() => { loadAllStands(); }, []);

  const assignNewStand = async (e) => {
    e.preventDefault();
    setMsg('');
    const planObj = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];
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
      plan_type: planObj.id,
      plan_amount: planObj.price,
      payment_method: payMethod,
      payment_status: 'ACTIVE',
      subscription_expires_at: new Date(Date.now() + planObj.days * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) setMsg(`Error: ${error.message}`);
    else {
      setMsg(`Stand ${slug.toUpperCase()} (${planObj.label} — ₹${planObj.price}) assigned to ${ownerEmail}!`);
      setSlug(''); setLocationLabel('');
      loadAllStands();
    }
  };

  const openReassignModal = (s) => {
    setEditStand(s);
    setEditForm({
      owner_email: s.owner_email || '',
      business_name: s.business_name || '',
      stand_slug: s.stand_slug || '',
      location_label: s.location_label || '',
      bundle_name: s.bundle_name || '',
      google_review_url: s.google_review_url || '',
      plan_type: s.plan_type || 'PLAN_3M',
      is_active: s.is_active !== false,
    });
  };

  const saveReassignedStand = async (e) => {
    e.preventDefault();
    if (!editStand) return;
    const planObj = SUBSCRIPTION_PLANS.find((p) => p.id === editForm.plan_type) || SUBSCRIPTION_PLANS[0];
    const normalizedReviewUrl = editForm.google_review_url.startsWith('http')
      ? editForm.google_review_url.trim()
      : `https://search.google.com/local/writereview?placeid=${editForm.google_review_url.trim()}`;

    const { error } = await supabase
      .from('qr_stands')
      .update({
        owner_email: editForm.owner_email.trim().toLowerCase(),
        business_name: editForm.business_name.trim(),
        stand_slug: editForm.stand_slug.trim().toUpperCase(),
        location_label: editForm.location_label.trim() || 'Main Counter',
        bundle_name: editForm.bundle_name.trim() || null,
        google_review_url: normalizedReviewUrl,
        plan_type: planObj.id,
        plan_amount: planObj.price,
        is_active: editForm.is_active,
        payment_status: editForm.is_active ? 'ACTIVE' : 'CANCELLED',
      })
      .eq('id', editStand.id);

    if (error) {
      setMsg(`Reassign error: ${error.message}`);
    } else {
      setMsg(`Updated & reassigned ${editForm.stand_slug.toUpperCase()} to ${editForm.owner_email.trim().toLowerCase()}!`);
      setEditStand(null);
      loadAllStands();
    }
  };

  const deleteStand = async (s) => {
    const confirmed = window.confirm(
      `Permanently delete QR stand "${s.stand_slug}" (${s.business_name}) and its feedback logs? This cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('qr_stands').delete().eq('id', s.id);
    if (error) {
      setMsg(`Delete error: ${error.message}`);
    } else {
      setSelectedForBundle((prev) => prev.filter((id) => id !== s.id));
      setMsg(`Deleted stand ${s.stand_slug}.`);
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

  const approveAndExtendPayment = async (stand) => {
    const planObj = SUBSCRIPTION_PLANS.find((p) => p.id === stand.plan_type) || SUBSCRIPTION_PLANS[0];
    const baseTime = Math.max(Date.now(), new Date(stand.subscription_expires_at).getTime());
    const nextExpiry = new Date(baseTime + planObj.days * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('qr_stands')
      .update({ payment_status: 'ACTIVE', is_active: true, subscription_expires_at: nextExpiry })
      .eq('id', stand.id);
    setMsg(`Payment confirmed (₹${stand.plan_amount || planObj.price}) & extended by ${planObj.label}.`);
    loadAllStands();
  };

  const toggleSelectStand = (id) => {
    setSelectedForBundle((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
          Super Admin Console
        </span>
        <h1 className="text-2xl font-extrabold mt-1">Stand Assignment, Reassignment, Bundles & Approvals</h1>
      </div>

      {msg && <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">{msg}</div>}

      <form onSubmit={assignNewStand} className={darkMode ? 'p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4' : 'p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4'}>
        <h2 className="font-bold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" /> Assign New QR / NFC Stand to Shop Owner</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Shop Owner Email (Primary Key)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Business Name" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Stand Serial (e.g. FP-101)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Placement (e.g. Ground Floor)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="Bundle Name (optional)" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
          <input type="text" required value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Google Place ID or Review Link" className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Plan:</span>
              <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Payment:</span>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900">
                <option value="CASH">Cash Collected</option>
                <option value="UPI">UPI Payment</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
            Assign Stand to Owner
          </button>
        </div>
      </form>

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

      <div className="space-y-3">
        <h2 className="font-bold text-lg">All Deployed Stands ({stands.length})</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {stands.map((s) => {
            const planObj = SUBSCRIPTION_PLANS.find((p) => p.id === s.plan_type) || SUBSCRIPTION_PLANS[0];
            return (
              <div key={s.id} className={darkMode ? 'p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3' : 'p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3'}>
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedForBundle.includes(s.id)} onChange={() => toggleSelectStand(s.id)} className="rounded text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-sm">{s.business_name} <span className="text-xs font-normal text-slate-500">({s.location_label || 'Main'})</span></h3>
                      <p className="text-xs text-slate-500">Owner: <strong>{s.owner_email || 'Unassigned'}</strong></p>
                    </div>
                  </label>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">{s.stand_slug}</span>
                </div>

                {s.bundle_name && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    <Layers className="w-3 h-3" /> Bundle: {s.bundle_name}
                  </div>
                )}

                <div className="text-xs text-slate-500">
                  Plan: <strong>{planObj.label} (₹{s.plan_amount || planObj.price})</strong> • {s.payment_status} ({s.payment_method || 'CASH'}) • Exp: {new Date(s.subscription_expires_at).toLocaleDateString('en-IN')}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => approveAndExtendPayment(s)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Approve +{planObj.label}
                  </button>
                  <button
                    onClick={() => openReassignModal(s)}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Reassign / Edit
                  </button>
                  <button
                    onClick={() => deleteStand(s)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold inline-flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REASSIGN / EDIT QR DETAILS MODAL */}
      {editStand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={saveReassignedStand} className="bg-white text-slate-900 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Reassign / Edit Stand — {editStand.stand_slug}</h3>
              <button type="button" onClick={() => setEditStand(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Owner Email (Primary Key — Reassign Ownership)</label>
                <input
                  type="email"
                  required
                  value={editForm.owner_email}
                  onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Stand Serial</label>
                <input
                  type="text"
                  required
                  value={editForm.stand_slug}
                  onChange={(e) => setEditForm({ ...editForm, stand_slug: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Placement / Floor</label>
                <input
                  type="text"
                  value={editForm.location_label}
                  onChange={(e) => setEditForm({ ...editForm, location_label: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Bundle Name (Optional)</label>
                <input
                  type="text"
                  value={editForm.bundle_name}
                  onChange={(e) => setEditForm({ ...editForm, bundle_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Google Place ID or Review Link</label>
                <input
                  type="text"
                  required
                  value={editForm.google_review_url}
                  onChange={(e) => setEditForm({ ...editForm, google_review_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Plan</label>
                <select
                  value={editForm.plan_type}
                  onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} — ₹{p.price}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  Stand Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditStand(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                Save & Reassign QR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ==================== 5. SHOP OWNER DASHBOARD ==================== */
function ShopOwnerDashboard({ session, profile, darkMode }) {
  const [stands, setStands] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeBundleFilter, setActiveBundleFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState('');

  const [payStand, setPayStand] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('PLAN_3M');
  const [selectedPayMethod, setSelectedPayMethod] = useState('CASH');
  const [payNotice, setPayNotice] = useState('');

  const [cancelStand, setCancelStand] = useState(null);
  const [cancelOtpSent, setCancelOtpSent] = useState(false);
  const [cancelOtpCode, setCancelOtpCode] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadOwnerData = async () => {
    const userEmail = (session.user.email || '').trim().toLowerCase();
    const { data: sData } = await supabase
      .from('qr_stands')
      .select('*')
      .ilike('owner_email', userEmail)
      .order('created_at', { ascending: false });

    const ownerStands = (sData || []).filter(
      (s) => (s.owner_email || '').trim().toLowerCase() === userEmail
    );
    setStands(ownerStands);

    if (ownerStands.length > 0) {
      const standIds = ownerStands.map((s) => s.id);
      const { data: lData } = await supabase
        .from('feedback_logs')
        .select('*')
        .in('stand_id', standIds)
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(lData || []);
    } else {
      setLogs([]);
    }
  };

  useEffect(() => { loadOwnerData(); }, [session]);

  const getDaysLeft = (isoDate) => {
    const diff = new Date(isoDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const expiringSoonStands = stands.filter((s) => s.is_active && getDaysLeft(s.subscription_expires_at) <= 7);
  const bundleNames = Array.from(new Set(stands.map((s) => s.bundle_name).filter(Boolean)));
  const visibleStands = activeBundleFilter === 'ALL'
    ? stands
    : stands.filter((s) => s.bundle_name === activeBundleFilter);

  const selectedPlanObj = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

  const submitIndividualPayment = async () => {
    if (!payStand) return;
    await supabase
      .from('qr_stands')
      .update({
        plan_type: selectedPlanObj.id,
        plan_amount: selectedPlanObj.price,
        payment_method: selectedPayMethod,
        payment_status: selectedPayMethod === 'CASH' ? 'CASH_PENDING_COLLECTION' : 'UPI_PENDING_VERIFY',
      })
      .eq('id', payStand.id);
    setPayNotice(
      selectedPayMethod === 'CASH'
        ? `Cash renewal request (${selectedPlanObj.label} — ₹${selectedPlanObj.price}) recorded for ${payStand.stand_slug}.`
        : `UPI renewal (${selectedPlanObj.label} — ₹${selectedPlanObj.price}) submitted for ${payStand.stand_slug}.`
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
      setCancelError('Invalid or expired 8-digit OTP PIN.');
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
      <div>
        <h1 className="text-2xl font-extrabold">Shop Owner Dashboard</h1>
        <p className="text-xs text-slate-500">
          {profile.full_name ? `${profile.full_name} • ` : ''}{session.user.email} • {stands.length} Assigned QR/NFC Stand(s)
        </p>
      </div>

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
            onClick={() => { setPayStand(expiringSoonStands[0]); setSelectedPlanId('PLAN_3M'); setSelectedPayMethod('CASH'); }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            Renew Now (3 / 6 / 12 Months)
          </button>
        </div>
      )}

      {payNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex justify-between items-center">
          <span>{payNotice}</span>
          <button onClick={() => setPayNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

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

      <div className="space-y-3">
        <h2 className="font-bold text-lg">Your QR & NFC Stands ({visibleStands.length})</h2>
        {visibleStands.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
            No QR stands are linked to <strong>{session.user.email}</strong> yet. Contact support@feedbackpulse101.in to link your stand.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {visibleStands.map((s) => {
              const daysLeft = getDaysLeft(s.subscription_expires_at);
              const shareUrl = `${window.location.origin}/r/${s.stand_slug}`;
              const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === s.plan_type) || SUBSCRIPTION_PLANS[0];
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
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Current Plan: <strong>{currentPlan.label} (₹{s.plan_amount || currentPlan.price})</strong> • Status: <strong>{s.payment_status}</strong>
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

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => { setPayStand(s); setSelectedPlanId(s.plan_type || 'PLAN_3M'); setSelectedPayMethod('CASH'); }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Plans & Pay ({daysLeft}d left)
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
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${l.rating_score >= 7 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    Score: {l.rating_score}/15
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

      {/* MODAL 1: 3 / 6 / 12-Month Plan Selection + Cash / UPI Payment */}
      {payStand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Subscription Plans — {payStand.stand_slug}</h3>
              <button onClick={() => setPayStand(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600">
              Location: <strong>{payStand.location_label || 'Main'}</strong> • Time Left: <strong>{getDaysLeft(payStand.subscription_expires_at)} days</strong>. Choose a validity plan:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-xl border text-left space-y-1 transition ${
                    selectedPlanId === plan.id
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {plan.badge}
                  </span>
                  <div className="font-extrabold text-sm pt-0.5">{plan.label}</div>
                  <div className="text-base font-extrabold text-indigo-600">₹{plan.price}</div>
                  <div className="text-[10px] text-slate-500">₹{Math.round(plan.price / plan.months)}/mo</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPayMethod('CASH')}
                className={`p-3.5 rounded-xl border text-left space-y-1 ${selectedPayMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-xs">Pay in Cash</div>
                <div className="text-[11px] text-slate-500">In-person cash collection</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayMethod('UPI')}
                className={`p-3.5 rounded-xl border text-left space-y-1 ${selectedPayMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}
              >
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <div className="font-bold text-xs">Pay via UPI</div>
                <div className="text-[11px] text-slate-500">{OWNER_UPI_ID || 'Direct UPI transfer'}</div>
              </button>
            </div>

            {selectedPayMethod === 'UPI' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                {OWNER_UPI_ID
                  ? <>Send <strong>₹{selectedPlanObj.price}</strong> ({selectedPlanObj.label}) to UPI ID: <strong className="font-mono">{OWNER_UPI_ID}</strong> (Ref: {payStand.stand_slug}) and click Confirm below.</>
                  : <>UPI handle will be updated shortly—you can select <strong>Pay in Cash</strong> right now for immediate collection.</>}
              </div>
            )}

            <button
              onClick={submitIndividualPayment}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
            >
              Confirm {selectedPlanObj.label} Plan (₹{selectedPlanObj.price}) via {selectedPayMethod}
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
              For your account security, cancelling a QR/NFC stand requires verifying an <strong>8-digit OTP PIN</strong> sent to <strong>{session.user.email}</strong>.
            </p>

            {cancelError && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">{cancelError}</div>}

            {!cancelOtpSent ? (
              <button
                onClick={initiateCancelOtp}
                disabled={cancelBusy}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {cancelBusy ? 'Sending OTP PIN...' : 'Send Cancellation PIN to My Email'}
              </button>
            ) : (
              <form onSubmit={confirmCancelWithOtp} className="space-y-3">
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={cancelOtpCode}
                  onChange={(e) => setCancelOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 8-digit OTP PIN"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-base tracking-widest"
                />
                <button
                  type="submit"
                  disabled={cancelBusy || cancelOtpCode.length < 6}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {cancelBusy ? 'Verifying...' : 'Verify PIN & Cancel Stand'}
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
      body: 'Physical NFC/QR stands include a 90-day software trial and free replacement for transit damage. Ongoing subscriptions (3-Month ₹399, 6-Month ₹699, or 12-Month ₹1,199 per stand) can be cancelled anytime via OTP verification in the Owner Dashboard prior to the next billing cycle.',
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