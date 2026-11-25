import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, QrCode, Star, AlertTriangle, CheckCircle2, LogOut,
  Plus, Layers, CreditCard, Banknote, Smartphone, Clock, Sun, Moon,
  Lock, ExternalLink, Copy, Check, X, Building2, Sparkles, Edit3, Trash2,
  Download, UserCheck, ShieldAlert
} from 'lucide-react';
import { supabase } from './supabaseClient';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const ADMIN_EMAIL = 'sangosignature@gmail.com';
const OWNER_UPI_ID = ''; // Add your UPI ID here when ready; defaults to Cash collection until added

const RESTAURANT_BG_URL =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2074&q=80';

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

/* ==================== MAIN ROUTER & GLOBAL RESTAURANT GLASS SHELL ==================== */
export default function App() {
  const [route, setRoute] = useState('home');
  const [standParam, setStandParam] = useState('');
  const [session, setSession] = useState(null);
  const [lightGlass, setLightGlass] = useState(true); // High-contrast Light Frosted Glass by default
  const [legalModal, setLegalModal] = useState(null);

  const [trackerChoice, setTrackerChoice] = useState(() => {
    try { return localStorage.getItem('fp101_tracker_consent') || ''; } catch { return ''; }
  });

  const handleTrackerDecision = (decision) => {
    const record = JSON.stringify({ choice: decision, timestamp: new Date().toISOString() });
    setTrackerChoice(record);
    try { localStorage.setItem('fp101_tracker_consent', record); } catch {}
  };

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

  // High-contrast accessible tokens for both Light Glass and Dark Glass modes
  const theme = {
    lightGlass,
    card: lightGlass
      ? 'rounded-3xl border border-white/80 bg-white/92 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.28)] text-stone-900'
      : 'rounded-3xl border border-white/25 bg-stone-950/82 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] text-white',
    subCard: lightGlass
      ? 'rounded-2xl border border-stone-200 bg-stone-50/95 text-stone-900'
      : 'rounded-2xl border border-white/20 bg-stone-900/85 text-white',
    input: lightGlass
      ? 'w-full px-3.5 py-2.5 rounded-xl border border-stone-300 !bg-white !text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-amber-600'
      : 'w-full px-3.5 py-2.5 rounded-xl border border-white/25 !bg-stone-900/95 !text-white placeholder-white/55 text-sm focus:outline-none focus:border-amber-300',
    select: lightGlass
      ? 'px-3 py-2 rounded-xl border border-stone-300 !bg-white !text-stone-900 text-xs font-semibold'
      : 'px-3 py-2 rounded-xl border border-white/25 !bg-stone-900 !text-white text-xs font-semibold',
    muted: lightGlass ? 'text-stone-600' : 'text-stone-300',
    primaryBtn: lightGlass
      ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold shadow-md transition'
      : 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold shadow-lg transition',
    accentText: lightGlass ? 'text-amber-700' : 'text-amber-300',
    dangerTitle: lightGlass ? 'text-rose-700' : 'text-rose-300',
    dangerBtn: lightGlass
      ? 'border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold'
      : 'border border-rose-400/40 bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 font-bold',
    badgePill: lightGlass
      ? 'bg-amber-100 border border-amber-300 text-amber-900'
      : 'bg-amber-400/20 border border-amber-300/30 text-amber-200',
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundImage: `url('${RESTAURANT_BG_URL}')`,
      }}
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative selection:bg-amber-400 selection:text-stone-950"
    >
      <div
        className={
          lightGlass
            ? 'fixed inset-0 bg-gradient-to-b from-stone-950/45 via-amber-950/35 to-stone-950/55 backdrop-blur-[4px] pointer-events-none z-0'
            : 'fixed inset-0 bg-gradient-to-b from-stone-950/75 via-stone-900/65 to-black/80 backdrop-blur-[4px] pointer-events-none z-0'
        }
      />

      <header
        className={
          lightGlass
            ? 'sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-2xl text-stone-900'
            : 'sticky top-0 z-40 border-b border-white/15 bg-stone-950/80 backdrop-blur-2xl text-white'
        }
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('home')} className="flex items-center gap-2.5 text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base block leading-none">FeedbackPulse101</span>
              <span className={`text-[11px] font-medium ${theme.muted}`}>Smart QR &amp; NFC Reputation</span>
            </div>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLightGlass(!lightGlass)}
              title="Switch Light / Dark Frosted Glass"
              className={
                lightGlass
                  ? 'p-2 rounded-xl border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                  : 'p-2 rounded-xl border border-white/25 bg-stone-900 text-amber-300 hover:bg-stone-800'
              }
            >
              {lightGlass ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {session ? (
              <>
                <button onClick={() => navigate('dashboard')} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm ${theme.primaryBtn}`}>
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className={
                    lightGlass
                      ? 'p-2 rounded-xl border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                      : 'p-2 rounded-xl border border-white/25 bg-stone-900 text-white hover:bg-stone-800'
                  }
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('dashboard')} className={`px-4 py-2 rounded-xl text-sm ${theme.primaryBtn}`}>
                Owner Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {route === 'home' && <HomePage onOpenSerial={(s) => navigate('rate', s)} theme={theme} />}
        {route === 'rate' && <GuestRatingPage slug={standParam} theme={theme} />}
        {route === 'dashboard' && <DashboardRouter session={session} theme={theme} onOpenLegal={setLegalModal} />}
      </main>

      {!trackerChoice && (
        <div className="fixed bottom-4 inset-x-4 z-50 max-w-3xl mx-auto">
          <div className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${theme.card}`}>
            <div className="text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${theme.accentText}`} /> Privacy &amp; Storage Notice (Zero Ad Trackers)
              </div>
              <p className={theme.muted}>
                We do <strong>not</strong> use advertising or analytics trackers. Only strictly necessary security &amp; login session storage is used when you sign in.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleTrackerDecision('REJECTED_NON_ESSENTIAL')}
                className={
                  lightGlass
                    ? 'flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold transition'
                    : 'flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition'
                }
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={() => handleTrackerDecision('ACCEPTED_ESSENTIAL')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs ${theme.primaryBtn}`}
              >
                Accept Essential
              </button>
            </div>
          </div>
        </div>
      )}

      <footer
        className={
          lightGlass
            ? 'relative z-10 border-t border-stone-200/80 bg-white/90 backdrop-blur-2xl py-7 px-4 text-center text-xs text-stone-700 space-y-2.5'
            : 'relative z-10 border-t border-white/15 bg-stone-950/80 backdrop-blur-2xl py-7 px-4 text-center text-xs text-stone-300 space-y-2.5'
        }
      >
        <div className="flex flex-wrap justify-center gap-6 font-semibold">
          <button onClick={() => setLegalModal('terms')} className="hover:text-amber-600 transition">Terms &amp; Conditions</button>
          <button onClick={() => setLegalModal('privacy')} className="hover:text-amber-600 transition">Privacy Policy &amp; Sub-Processors (DPDP 2023)</button>
          <button onClick={() => setLegalModal('refund')} className="hover:text-amber-600 transition">Refund &amp; Cancellation</button>
          <button onClick={() => setLegalModal('contact')} className="hover:text-amber-600 transition">Contact &amp; Grievance</button>
        </div>
        <p>FeedbackPulse101 • MSME Registered Enterprise • Zero Ad Trackers • 1-Year Auto-Retention • SSL &amp; RLS Protected</p>
      </footer>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} theme={theme} />}
    </div>
  );
}

/* ==================== 1. HOME PAGE ==================== */
function HomePage({ onOpenSerial, theme }) {
  const [serial, setSerial] = useState('');

  const handleOpen = (e) => {
    e.preventDefault();
    if (serial.trim()) onOpenSerial(serial.trim().toUpperCase());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-10">
      <div className={`p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-5 ${theme.card}`}>
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${theme.badgePill}`}>
          <Sparkles className="w-3.5 h-3.5" /> Tap NFC or Scan QR • Instant Reputation Routing
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Turn Happy Walk-Ins Into <span className={theme.accentText}>5-Star Google Reviews</span>
        </h1>
        <p className={`text-sm sm:text-base max-w-xl mx-auto ${theme.muted}`}>
          Delighted guests go straight to your Google Business review page with an AI-assisted review ready to paste. Unhappy guests share private feedback directly with the owner.
        </p>

        <form onSubmit={handleOpen} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Enter Stand Serial (e.g. STAND3)"
            className={theme.input}
          />
          <button type="submit" className={`px-5 py-2.5 rounded-xl text-sm shrink-0 ${theme.primaryBtn}`}>
            Open Stand
          </button>
        </form>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { icon: Star, title: 'Smart Score Routing', desc: '3-question 5-star survey routes happy guests to Google Reviews and private feedback to the owner.' },
          { icon: Layers, title: 'Multi-Floor QR Bundles', desc: 'Place stands at Reception, Tables & Billing—manage all locations in one unified owner dashboard.' },
          { icon: ShieldCheck, title: 'DPDP 2023 Compliant', desc: 'Zero ad trackers, email-isolated RLS, double-OTP parental verification, and 1-year auto-retention.' },
        ].map((item, idx) => (
          <div key={idx} className={`p-6 space-y-2.5 ${theme.card}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.badgePill}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">{item.title}</h3>
            <p className={`text-xs leading-relaxed ${theme.muted}`}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== 2. GUEST RATING PAGE ==================== */
function GuestRatingPage({ slug, theme }) {
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
      customer_contact: null,
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
      feedback_text: `[Voluntary Follow-up | Total:${totalStars}/15] ${reviewText.trim()}`.slice(0, 1000),
      customer_contact: contact.trim().slice(0, 120),
      routed_to_google: false,
    });
    setPrivateSaved(true);
    setTimeout(() => {
      closePageSafely();
    }, 1500);
  };

  if (loading) return <div className="py-20 text-center text-sm text-white font-semibold">Loading survey...</div>;
  if (!stand || !stand.is_active) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className={`p-8 text-center space-y-2 ${theme.card}`}>
          <AlertTriangle className={`w-8 h-8 mx-auto ${theme.accentText}`} />
          <h2 className="font-bold text-lg">Stand Inactive or Not Found</h2>
          <p className={`text-xs ${theme.muted}`}>Please verify the QR serial code ({slug}) or contact the business.</p>
        </div>
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
        <div className={`p-8 text-center space-y-5 ${theme.card}`}>
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold">Thank You for Your Visit!</h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${theme.muted}`}>
              We truly appreciate your honest review for <strong className={theme.accentText}>{stand.business_name}</strong> ({totalStars}/15 stars). Your feedback has been shared directly with the owner so we can improve your next experience.
            </p>
          </div>

          {!privateSaved ? (
            <form onSubmit={saveFollowUpContact} className="space-y-2.5 text-left pt-2 border-t border-stone-200/40">
              <label className={`block text-xs font-semibold ${theme.muted}`}>Want the manager to reach out to resolve this? (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={120}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone or Email (optional)"
                  className={theme.input}
                />
                <button type="submit" className={`px-4 py-2 rounded-xl text-xs shrink-0 ${theme.primaryBtn}`}>
                  Send
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 text-xs font-bold">
              Feedback saved! You may now safely close this page.
            </div>
          )}

          <div className="pt-3 border-t border-stone-200/40 space-y-2.5">
            {stand.google_review_url && (
              <>
                <p className={`text-[11px] ${theme.muted}`}>Prefer to post publicly as well?</p>
                <a
                  href={stand.google_review_url}
                  onClick={() => copyReviewToClipboard(reviewText)}
                  className={
                    theme.lightGlass
                      ? 'w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold inline-flex items-center justify-center gap-2 transition'
                      : 'w-full py-2.5 px-4 rounded-xl border border-white/25 bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition'
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Write on Google Maps
                </a>
              </>
            )}

            <button type="button" onClick={closePageSafely} className={`w-full py-2.5 px-4 rounded-xl text-xs ${theme.primaryBtn}`}>
              Done &amp; Close Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 px-4">
      <form onSubmit={handleSurveySubmit} className={`p-6 sm:p-8 space-y-5 ${theme.card}`}>
        <div className="text-center space-y-1.5">
          <span className={`text-[11px] font-mono uppercase tracking-wider px-3 py-0.5 rounded-full font-bold ${theme.badgePill}`}>
            {stand.stand_slug} {stand.location_label ? `• ${stand.location_label}` : ''}
          </span>
          <h1 className="text-2xl font-extrabold pt-1">{stand.business_name}</h1>
          <p className={`text-xs ${theme.muted}`}>Rate 3 quick questions below ({totalStars}/15 Stars)</p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className={`p-4 flex flex-col items-start gap-2.5 ${theme.subCard}`}>
              <div className="w-full flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold">{q.label}</span>
                <span className={`text-[11px] font-bold ${theme.accentText}`}>{q.value}/5</span>
              </div>
              <div className="flex items-center gap-2.5">
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
                          : theme.lightGlass
                          ? 'text-stone-300'
                          : 'text-stone-600'
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
            <label className={`text-xs font-bold flex items-center gap-1.5 ${theme.accentText}`}>
              <Sparkles className="w-3.5 h-3.5" /> AI Quick-Write Suggestions (Tap to Auto-Fill &amp; Copy)
            </label>
            {copiedToast && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Copied!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset, idx)}
                className={`text-left p-3 rounded-2xl border text-xs transition ${
                  selectedPresetIdx === idx
                    ? theme.lightGlass
                      ? 'border-amber-500 bg-amber-100 text-stone-950 font-semibold'
                      : 'border-amber-300 bg-amber-400/25 text-white font-semibold'
                    : theme.lightGlass
                    ? 'border-stone-200 bg-stone-50 hover:border-amber-400 text-stone-800'
                    : 'border-white/15 bg-stone-900/80 hover:border-amber-300/60 text-stone-100'
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
              className={theme.input}
            />
            {reviewText.trim() && (
              <button
                type="button"
                onClick={() => copyReviewToClipboard(reviewText)}
                className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold hover:underline ${theme.accentText}`}
              >
                <Copy className="w-3 h-3" /> Copy text again
              </button>
            )}
          </div>
        </div>

        <TurnstileWidget onVerify={setCaptchaToken} />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !allAnswered}
          className={`w-full py-3.5 rounded-2xl text-sm disabled:opacity-45 ${theme.primaryBtn}`}
        >
          {submitting
            ? 'Submitting...'
            : !allAnswered
            ? 'Rate All 3 Questions to Continue'
            : totalStars < 7
            ? 'Submit Feedback'
            : 'Copy Review & Continue to Google Maps'}
        </button>
      </form>
    </div>
  );
}

/* ==================== 3. DASHBOARD ROUTER (OTP LOGIN + AGE SELECTOR + PARENTAL DOUBLE-OTP) ==================== */
function DashboardRouter({ session, theme, onOpenLegal }) {
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(8).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyStage, setVerifyStage] = useState('idle');
  const [verifiedAt, setVerifiedAt] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Explicit Age Group Selection on Login ('18_PLUS' | 'UNDER_18')
  const [ageGroup, setAgeGroup] = useState('18_PLUS');
  const [parentEmail, setParentEmail] = useState('');
  const [parentOtpCode, setParentOtpCode] = useState('');
  const [parentOtpSent, setParentOtpSent] = useState(false);
  const [parentVerifiedAt, setParentVerifiedAt] = useState('');

  const inputRefs = useRef([]);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState('');

  // Individual Unchecked Consent Checkboxes with Exact Timestamps
  const [tickTermsAt, setTickTermsAt] = useState('');
  const [tickPrivacyAt, setTickPrivacyAt] = useState('');
  const [tickAgeAt, setTickAgeAt] = useState('');
  const [tickMarketingAt, setTickMarketingAt] = useState('');

  const isUnder18Login = ageGroup === 'UNDER_18';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

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

  const maskEmail = (raw) => {
    const [user, domain] = (raw || '').split('@');
    if (!domain) return raw;
    return `${user.slice(0, 2)}***@${domain}`;
  };

  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    if (resendTimer > 0) return;
    if (TURNSTILE_SITE_KEY && !captchaToken && !otpSent) {
      setAuthError('Please complete the human verification widget first.');
      return;
    }
    if (isUnder18Login) {
      if (!parentEmail.trim() || parentEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        setAuthError('Please enter a valid Parent/Guardian email address different from your own.');
        return;
      }
    }

    setAuthError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setLoading(false);
      setAuthError(
        error.message.toLowerCase().includes('rate')
          ? 'Email rate limit reached in Supabase/Resend. Please wait 60 seconds and check your Spam folder.'
          : error.message
      );
      return;
    }

    if (isUnder18Login && parentEmail.trim()) {
      const { error: parentErr } = await supabase.auth.signInWithOtp({
        email: parentEmail.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (parentErr) {
        setLoading(false);
        setAuthError(`Parent OTP error: ${parentErr.message}`);
        return;
      }
      setParentOtpSent(true);
    }

    setLoading(false);
    setOtpSent(true);
    setOtpDigits(Array(8).fill(''));
    setVerifyStage('idle');
    setResendTimer(60);
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  const submitEightDigitCode = async (codeStr) => {
    if (codeStr.length !== 8 || verifyStage === 'verifying') return;
    if (isUnder18Login && parentOtpCode.trim().length < 8) {
      setAuthError('Please also enter the 8-digit Parent/Guardian OTP code below before verifying.');
      return;
    }

    setAuthError('');
    setVerifyStage('verifying');
    setLoading(true);

    if (isUnder18Login) {
      const { error: pErr } = await supabase.auth.verifyOtp({
        email: parentEmail.trim().toLowerCase(),
        token: parentOtpCode.trim(),
        type: 'email',
      });
      if (pErr) {
        setLoading(false);
        setVerifyStage('idle');
        setAuthError('Invalid or expired Parent/Guardian 8-digit OTP code.');
        return;
      }
      setParentVerifiedAt(new Date().toISOString());
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codeStr,
      type: 'email',
    });

    setLoading(false);
    if (error) {
      setVerifyStage('idle');
      setAuthError('Invalid or expired 8-digit code. Please check your inbox and try again.');
    } else {
      const nowIso = new Date().toISOString();
      setVerifiedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setVerifyStage('verified');

      if (isUnder18Login && data?.user) {
        await supabase.from('owner_profiles').upsert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          is_under_18: true,
          parent_email: parentEmail.trim().toLowerCase(),
          parent_verified_at: nowIso,
        });
        await supabase.from('consent_audit_logs').insert({
          user_id: data.user.id,
          user_email: email.trim().toLowerCase(),
          consent_type: `PARENTAL_DOUBLE_OTP:${parentEmail.trim().toLowerCase()}`,
          granted: true,
          recorded_at: nowIso,
        });
      }

      setTimeout(() => setVerifyStage('confirmed'), 1100);
    }
  };

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[idx] = '';
      setOtpDigits(next);
      return;
    }
    if (clean.length > 1) {
      const chars = clean.slice(0, 8).split('');
      const next = Array(8).fill('');
      chars.forEach((c, i) => { next[i] = c; });
      setOtpDigits(next);
      const focusIdx = Math.min(7, chars.length);
      inputRefs.current[focusIdx]?.focus();
      if (chars.length === 8 && (!isUnder18Login || parentOtpCode.length === 8)) {
        submitEightDigitCode(next.join(''));
      }
      return;
    }
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    if (idx < 7) inputRefs.current[idx + 1]?.focus();
    const joined = next.join('');
    if (joined.length === 8 && !next.includes('') && (!isUnder18Login || parentOtpCode.length === 8)) {
      submitEightDigitCode(joined);
    }
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const acceptLegalTerms = async (e) => {
    e.preventDefault();
    if (!tickTermsAt || !tickPrivacyAt || !tickAgeAt) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('owner_profiles')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: ownerFullName.trim() || null,
        is_super_admin: session.user.email?.toLowerCase() === ADMIN_EMAIL,
        terms_accepted_at: tickTermsAt,
        privacy_accepted_at: tickPrivacyAt,
        age_verified_at: tickAgeAt,
        age_confirmed: true,
        marketing_consent: Boolean(tickMarketingAt),
        marketing_consent_at: tickMarketingAt || null,
      })
      .select()
      .single();

    const auditRows = [
      { user_id: session.user.id, user_email: session.user.email, consent_type: 'TERMS_AND_CONDITIONS', granted: true, recorded_at: tickTermsAt },
      { user_id: session.user.id, user_email: session.user.email, consent_type: 'PRIVACY_POLICY_DPDP2023', granted: true, recorded_at: tickPrivacyAt },
      { user_id: session.user.id, user_email: session.user.email, consent_type: profile?.is_under_18 ? 'AGE_UNDER_18_PARENT_VERIFIED' : 'AGE_18_PLUS_CONFIRMED', granted: true, recorded_at: tickAgeAt },
      { user_id: session.user.id, user_email: session.user.email, consent_type: 'MARKETING_COMMUNICATIONS', granted: Boolean(tickMarketingAt), recorded_at: tickMarketingAt || new Date().toISOString() },
    ];
    await supabase.from('consent_audit_logs').insert(auditRows);

    setLoading(false);
    if (!error && data) setProfile(data);
  };

  if (!session || verifyStage === 'verified' || verifyStage === 'confirmed') {
    const joinedCode = otpDigits.join('');
    return (
      <div className="min-h-[calc(100vh-8rem)] w-full flex items-center justify-center px-4 py-12">
        <div className={`w-full max-w-md p-7 sm:p-9 space-y-6 transition-all duration-500 ${theme.card}`}>
          {verifyStage === 'confirmed' ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight">You&apos;re verified</h2>
                <p className={`text-xs leading-relaxed ${theme.muted}`}>
                  Your email is confirmed and this browser is now trusted. Welcome back.
                </p>
              </div>

              <div className="space-y-2.5 text-left">
                <div className={`p-3.5 flex items-center gap-3 ${theme.subCard}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.badgePill}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Email confirmed</div>
                    <div className={`text-[11px] ${theme.muted}`}>{maskEmail(email || session?.user?.email)}</div>
                  </div>
                </div>

                {parentVerifiedAt && (
                  <div className={`p-3.5 flex items-center gap-3 ${theme.subCard}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.badgePill}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Parent / Guardian Double-OTP Verified</div>
                      <div className={`text-[11px] ${theme.muted}`}>{maskEmail(parentEmail)} • Recorded</div>
                    </div>
                  </div>
                )}

                <div className={`p-3.5 flex items-center gap-3 ${theme.subCard}`}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Device trusted</div>
                    <div className={`text-[11px] ${theme.muted}`}>Verified at {verifiedAt || 'just now'} • RLS Active</div>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setVerifyStage('idle')} className={`w-full py-3.5 rounded-2xl text-sm ${theme.primaryBtn}`}>
                Continue →
              </button>
            </div>
          ) : !otpSent ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${theme.badgePill}`}>
                  <QrCode className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Owner &amp; Admin Portal</h2>
                <p className={`text-xs ${theme.muted}`}>
                  Enter your registered email &amp; select your age group to receive an 8-digit PIN
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-700 text-xs text-center font-bold">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourrestaurant.com"
                    className={`${theme.input} py-3 rounded-2xl`}
                  />
                </div>

                {/* Clear Age Selection Pills on Login */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold">Select Your Age Group</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAgeGroup('18_PLUS')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        ageGroup === '18_PLUS'
                          ? 'border-amber-500 bg-amber-400/25 ring-1 ring-amber-500'
                          : 'border-stone-300/60 opacity-75'
                      }`}
                    >
                      18 Years or Older
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeGroup('UNDER_18')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        ageGroup === 'UNDER_18'
                          ? 'border-amber-500 bg-amber-400/25 ring-1 ring-amber-500'
                          : 'border-stone-300/60 opacity-75'
                      }`}
                    >
                      Below 18 (Parent OTP)
                    </button>
                  </div>
                </div>

                {isUnder18Login && (
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-bold ${theme.accentText}`}>
                      Parent / Legal Guardian Email (Double 8-Digit OTP Required)
                    </label>
                    <input
                      type="email"
                      required
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent.guardian@email.com"
                      className={`${theme.input} py-3 rounded-2xl`}
                    />
                  </div>
                )}

                <TurnstileWidget onVerify={setCaptchaToken} />
              </div>

              <button
                type="submit"
                disabled={loading || resendTimer > 0}
                className={`w-full py-3.5 rounded-2xl text-sm disabled:opacity-60 ${theme.primaryBtn}`}
              >
                {loading
                  ? 'Sending 8-Digit Code...'
                  : isUnder18Login
                  ? 'Send Double OTPs (Owner + Parent)'
                  : 'Send 8-Digit Verification Code'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${theme.badgePill}`}>
                  {verifyStage === 'verified' ? <Check className="w-6 h-6 stroke-[3]" /> : <Lock className="w-5 h-5" />}
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Check your inbox</h2>
                <p className={`text-xs ${theme.muted}`}>
                  Enter the 8-digit code sent to <strong>{maskEmail(email)}</strong> (check Spam/Promotions too)
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-700 text-xs text-center font-bold">
                  {authError}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2.5 max-w-[290px] mx-auto pt-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={digit}
                    disabled={verifyStage === 'verifying' || verifyStage === 'verified'}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className={`h-14 rounded-2xl text-center font-mono text-xl font-extrabold border transition-all focus:outline-none ${
                      theme.lightGlass
                        ? 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
                        : 'bg-stone-900 border-white/25 text-white focus:border-amber-300'
                    }`}
                  />
                ))}
              </div>

              {isUnder18Login && parentOtpSent && (
                <div className={`p-3.5 space-y-2 ${theme.subCard}`}>
                  <label className={`block text-xs font-bold ${theme.accentText}`}>
                    Parent / Guardian 8-Digit OTP ({maskEmail(parentEmail)})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={parentOtpCode}
                    onChange={(e) => setParentOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter Parent 8-digit PIN"
                    className={`${theme.input} text-center font-mono text-base tracking-widest`}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={
                  joinedCode.length < 8 ||
                  (isUnder18Login && parentOtpCode.length < 8) ||
                  verifyStage === 'verifying' ||
                  verifyStage === 'verified'
                }
                onClick={() => submitEightDigitCode(joinedCode)}
                className={`w-full py-3.5 rounded-2xl text-sm disabled:opacity-45 ${theme.primaryBtn}`}
              >
                {verifyStage === 'verified' ? 'Verified ✓' : verifyStage === 'verifying' ? 'Verifying...' : 'Verify code'}
              </button>

              <div className={`text-center space-y-2 text-xs ${theme.muted}`}>
                <div>
                  Didn&apos;t get a code?{' '}
                  {resendTimer > 0 ? (
                    <span className="font-bold">Resend in 0:{resendTimer.toString().padStart(2, '0')}</span>
                  ) : (
                    <button type="button" onClick={() => sendOtp()} className={`font-bold hover:underline ${theme.accentText}`}>
                      Resend now
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setParentOtpSent(false);
                    setOtpDigits(Array(8).fill(''));
                    setParentOtpCode('');
                    setVerifyStage('idle');
                    setAuthError('');
                  }}
                  className="text-[11px] underline"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return <div className="py-20 text-center text-sm text-white font-semibold">Verifying security profile...</div>;
  }

  // Require explicit Privacy Policy + Age Verified timestamps (never pre-ticked)
  if (!profile.terms_accepted_at || !profile.privacy_accepted_at || !profile.age_verified_at) {
    const allRequiredChecked = Boolean(tickTermsAt && tickPrivacyAt && tickAgeAt);
    return (
      <div className="max-w-xl mx-auto my-10 px-4">
        <form onSubmit={acceptLegalTerms} className={`p-8 space-y-4 ${theme.card}`}>
          <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${theme.accentText}`}>
            <ShieldCheck className="w-4 h-4" /> DPDP Act 2023 Granular Consent &amp; Age Verification
          </div>
          <h2 className="text-xl font-extrabold">Review &amp; Confirm Your Consents</h2>
          <p className={`text-xs ${theme.muted}`}>
            No boxes are pre-ticked. Each box you select records your individual consent with an exact timestamp.
          </p>

          <div>
            <label className="block text-xs font-bold mb-1.5">Business Owner / Authorized Representative Name</label>
            <input
              type="text"
              required
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
              placeholder="Enter your full legal name"
              className={theme.input}
            />
          </div>

          <label className={`flex items-start gap-3 p-3.5 cursor-pointer select-none ${theme.subCard}`}>
            <input
              type="checkbox"
              required
              checked={Boolean(tickTermsAt)}
              onChange={(e) => setTickTermsAt(e.target.checked ? new Date().toISOString() : '')}
              className="mt-0.5 w-4 h-4 rounded text-amber-500"
            />
            <div className="text-xs leading-relaxed">
              <strong>[Required]</strong> I have read and accept the{' '}
              <button type="button" onClick={() => onOpenLegal('terms')} className={`underline font-bold ${theme.accentText}`}>
                Terms &amp; Conditions
              </button>{' '}
              (including Consumer Protection Act / CCPA anti-review-gating guidelines).
              {tickTermsAt && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Ticked at: {tickTermsAt}</span>}
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3.5 cursor-pointer select-none ${theme.subCard}`}>
            <input
              type="checkbox"
              required
              checked={Boolean(tickPrivacyAt)}
              onChange={(e) => setTickPrivacyAt(e.target.checked ? new Date().toISOString() : '')}
              className="mt-0.5 w-4 h-4 rounded text-amber-500"
            />
            <div className="text-xs leading-relaxed">
              <strong>[Required]</strong> I have read and accept the{' '}
              <button type="button" onClick={() => onOpenLegal('privacy')} className={`underline font-bold ${theme.accentText}`}>
                Privacy Policy, Sub-Processors &amp; 1-Year Retention Schedule (DPDP Act, 2023)
              </button>.
              {tickPrivacyAt && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Ticked at: {tickPrivacyAt}</span>}
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3.5 cursor-pointer select-none ${theme.subCard}`}>
            <input
              type="checkbox"
              required
              checked={Boolean(tickAgeAt)}
              onChange={(e) => setTickAgeAt(e.target.checked ? new Date().toISOString() : '')}
              className="mt-0.5 w-4 h-4 rounded text-amber-500"
            />
            <div className="text-xs leading-relaxed">
              <strong>[Required]</strong>{' '}
              {profile.is_under_18
                ? `I confirm verifiable Parental/Guardian consent was completed via double-OTP (${profile.parent_email}).`
                : 'I confirm that I am 18 years of age or older and legally authorized to bind my business.'}
              {tickAgeAt && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Ticked at: {tickAgeAt}</span>}
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3.5 cursor-pointer select-none ${theme.subCard}`}>
            <input
              type="checkbox"
              checked={Boolean(tickMarketingAt)}
              onChange={(e) => setTickMarketingAt(e.target.checked ? new Date().toISOString() : '')}
              className="mt-0.5 w-4 h-4 rounded text-amber-500"
            />
            <div className="text-xs leading-relaxed">
              <strong>[Optional — Separate Marketing Consent]</strong> I agree to receive occasional product updates and offers from FeedbackPulse101.
              {tickMarketingAt && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Opted-in at: {tickMarketingAt}</span>}
            </div>
          </label>

          <button type="submit" disabled={!allRequiredChecked || loading} className={`w-full py-3.5 rounded-2xl text-sm disabled:opacity-45 ${theme.primaryBtn}`}>
            {loading ? 'Recording Timestamps...' : 'Save Consent Timestamps & Enter Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  if (profile.is_super_admin) {
    return <SuperAdminDashboard session={session} theme={theme} />;
  }

  return <ShopOwnerDashboard session={session} profile={profile} theme={theme} />;
}

/* ==================== 4. SUPER ADMIN DASHBOARD (WITH DELETED ACCOUNTS HISTORY) ==================== */
function SuperAdminDashboard({ session, theme }) {
  const [stands, setStands] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [deletedHistory, setDeletedHistory] = useState([]);
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
    const { data: inc } = await supabase.from('security_incidents').select('*').eq('resolved', false).order('detected_at', { ascending: false });
    setIncidents(inc || []);
    const { data: delH } = await supabase.from('deleted_accounts_history').select('*').order('deleted_at', { ascending: false }).limit(25);
    setDeletedHistory(delH || []);
  };

  useEffect(() => { loadAllStands(); }, []);

  const resolveIncident = async (id) => {
    await supabase.from('security_incidents').update({ resolved: true }).eq('id', id);
    loadAllStands();
  };

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

    if (error) setMsg(`Reassign error: ${error.message}`);
    else {
      setMsg(`Updated & reassigned ${editForm.stand_slug.toUpperCase()} to ${editForm.owner_email.trim().toLowerCase()}!`);
      setEditStand(null);
      loadAllStands();
    }
  };

  const deleteStand = async (s) => {
    if (!window.confirm(`Permanently delete QR stand "${s.stand_slug}" (${s.business_name}) and its feedback logs?`)) return;
    const { error } = await supabase.from('qr_stands').delete().eq('id', s.id);
    if (error) setMsg(`Delete error: ${error.message}`);
    else {
      setSelectedForBundle((prev) => prev.filter((id) => id !== s.id));
      setMsg(`Deleted stand ${s.stand_slug}.`);
      loadAllStands();
    }
  };

  const createBundleFromSelected = async () => {
    if (!newBundleTitle.trim() || selectedForBundle.length === 0) return;
    await supabase.from('qr_stands').update({ bundle_name: newBundleTitle.trim() }).in('id', selectedForBundle);
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
      {incidents.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-600 text-white shadow-xl space-y-3">
          <div className="flex items-center gap-2 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5" />
            SECURITY BREACH / ANOMALY ALERT — 72-Hour Statutory Reporting Window Active
          </div>
          {incidents.map((inc) => (
            <div key={inc.id} className="p-3 rounded-2xl bg-black/25 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <strong>{inc.title}:</strong> {inc.details} <br />
                <span>
                  Detected: {new Date(inc.detected_at).toLocaleString('en-IN')} • Report Deadline (72h):{' '}
                  <strong>{new Date(inc.report_deadline_at).toLocaleString('en-IN')}</strong>
                </span>
              </div>
              <button onClick={() => resolveIncident(inc.id)} className="px-3 py-1.5 rounded-xl bg-white text-stone-950 font-bold">
                Acknowledge &amp; Close
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`p-6 sm:p-7 ${theme.card}`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${theme.badgePill}`}>
          Super Admin Console
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Stand Assignment, Reassignment, Bundles &amp; Approvals</h1>
        <p className={`text-xs mt-1 ${theme.muted}`}>Full platform control • 72-hour incident monitor active • 1-year data retention enforced</p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow">
          {msg}
        </div>
      )}

      <form onSubmit={assignNewStand} className={`p-6 space-y-4 ${theme.card}`}>
        <h2 className="font-bold text-base flex items-center gap-2">
          <Plus className={`w-4 h-4 ${theme.accentText}`} /> Assign New QR / NFC Stand to Shop Owner
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Shop Owner Email (Primary Key)" className={theme.input} />
          <input type="text" required value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Business / Restaurant Name" className={theme.input} />
          <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Stand Serial (e.g. FP-101)" className={theme.input} />
          <input type="text" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Placement (e.g. Ground Floor / Table 1)" className={theme.input} />
          <input type="text" value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="Bundle Name (optional)" className={theme.input} />
          <input type="text" required value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Google Place ID or Review Link" className={theme.input} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Plan:</span>
              <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className={theme.select}>
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">Payment:</span>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={theme.select}>
                <option value="CASH">Cash Collected</option>
                <option value="UPI">UPI Payment</option>
              </select>
            </div>
          </div>
          <button type="submit" className={`px-5 py-2.5 rounded-xl text-sm ${theme.primaryBtn}`}>
            Assign Stand to Owner
          </button>
        </div>
      </form>

      <div className={`p-5 flex flex-wrap items-center justify-between gap-3 ${theme.card}`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Layers className={`w-4 h-4 ${theme.accentText}`} />
          <span>Bundle Selected Stands ({selectedForBundle.length} selected):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newBundleTitle}
            onChange={(e) => setNewBundleTitle(e.target.value)}
            placeholder="Bundle Name (e.g. All Floors Bundle)"
            className={`${theme.input} !w-auto text-xs`}
          />
          <button
            type="button"
            onClick={createBundleFromSelected}
            disabled={selectedForBundle.length === 0 || !newBundleTitle.trim()}
            className={`px-4 py-2 rounded-xl text-xs disabled:opacity-45 ${theme.primaryBtn}`}
          >
            Create Owner Bundle
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg text-white drop-shadow">All Deployed Stands ({stands.length})</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {stands.map((s) => {
            const planObj = SUBSCRIPTION_PLANS.find((p) => p.id === s.plan_type) || SUBSCRIPTION_PLANS[0];
            return (
              <div key={s.id} className={`p-5 space-y-3 ${theme.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedForBundle.includes(s.id)} onChange={() => toggleSelectStand(s.id)} className="rounded text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm">{s.business_name} <span className={`text-xs font-normal ${theme.muted}`}>({s.location_label || 'Main'})</span></h3>
                      <p className={`text-xs ${theme.muted}`}>Owner: <strong>{s.owner_email || 'Unassigned'}</strong></p>
                    </div>
                  </label>
                  <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold ${theme.badgePill}`}>{s.stand_slug}</span>
                </div>

                {s.bundle_name && (
                  <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${theme.subCard}`}>
                    <Layers className={`w-3 h-3 ${theme.accentText}`} /> Bundle: {s.bundle_name}
                  </div>
                )}

                <div className={`text-xs ${theme.muted}`}>
                  Plan: <strong>{planObj.label} (₹{s.plan_amount || planObj.price})</strong> • {s.payment_status} ({s.payment_method || 'CASH'}) • Exp: {new Date(s.subscription_expires_at).toLocaleDateString('en-IN')}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-stone-200/40 text-xs">
                  <button onClick={() => approveAndExtendPayment(s)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Approve +{planObj.label}
                  </button>
                  <button
                    onClick={() => openReassignModal(s)}
                    className={`px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 ${theme.badgePill}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Reassign / Edit
                  </button>
                  <button
                    onClick={() => deleteStand(s)}
                    className={`px-3 py-1.5 rounded-xl inline-flex items-center gap-1 ml-auto ${theme.dangerBtn}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deleted Accounts & Erasure Audit History */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-white drop-shadow">Deleted Data &amp; Erasure Audit History ({deletedHistory.length})</h2>
        <div className={`divide-y divide-stone-200/30 ${theme.card}`}>
          {deletedHistory.length === 0 && (
            <p className={`p-5 text-xs ${theme.muted}`}>No owner data erasure requests recorded yet.</p>
          )}
          {deletedHistory.map((item) => (
            <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <strong>{item.owner_email}</strong> {item.owner_name ? `(${item.owner_name})` : ''} • Erased{' '}
                <strong>{item.stands_deleted_count}</strong> stand(s) &amp; <strong>{item.feedback_deleted_count}</strong> feedback record(s)
              </div>
              <span className={theme.muted}>{new Date(item.deleted_at).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      {editStand && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={saveReassignedStand} className={`max-w-lg w-full p-6 space-y-4 ${theme.card}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Reassign / Edit Stand — {editStand.stand_slug}</h3>
              <button type="button" onClick={() => setEditStand(null)} className="p-1 rounded-lg hover:bg-stone-200/30"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Owner Email (Primary Key — Reassign Ownership)</label>
                <input type="email" required value={editForm.owner_email} onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })} className={theme.input} />
              </div>
              <div>
                <label className="block font-bold mb-1">Business Name</label>
                <input type="text" required value={editForm.business_name} onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })} className={theme.input} />
              </div>
              <div>
                <label className="block font-bold mb-1">Stand Serial</label>
                <input type="text" required value={editForm.stand_slug} onChange={(e) => setEditForm({ ...editForm, stand_slug: e.target.value })} className={`${theme.input} font-mono uppercase`} />
              </div>
              <div>
                <label className="block font-bold mb-1">Placement / Floor</label>
                <input type="text" value={editForm.location_label} onChange={(e) => setEditForm({ ...editForm, location_label: e.target.value })} className={theme.input} />
              </div>
              <div>
                <label className="block font-bold mb-1">Bundle Name (Optional)</label>
                <input type="text" value={editForm.bundle_name} onChange={(e) => setEditForm({ ...editForm, bundle_name: e.target.value })} className={theme.input} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Google Place ID or Review Link</label>
                <input type="text" required value={editForm.google_review_url} onChange={(e) => setEditForm({ ...editForm, google_review_url: e.target.value })} className={theme.input} />
              </div>
              <div>
                <label className="block font-bold mb-1">Plan</label>
                <select value={editForm.plan_type} onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })} className={`w-full ${theme.select}`}>
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} — ₹{p.price}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="rounded text-amber-500" />
                  Stand Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditStand(null)} className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold">Cancel</button>
              <button type="submit" className={`px-5 py-2 rounded-xl text-xs ${theme.primaryBtn}`}>Save &amp; Reassign QR</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ==================== 5. SHOP OWNER DASHBOARD (FIXED OTP ERASURE + HIGH CONTRAST) ==================== */
function ShopOwnerDashboard({ session, profile, theme }) {
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

  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [delOtpSent, setDelOtpSent] = useState(false);
  const [delOtpCode, setDelOtpCode] = useState('');
  const [delError, setDelError] = useState('');
  const [delBusy, setDelBusy] = useState(false);

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
        .limit(100);
      setLogs(lData || []);
    } else {
      setLogs([]);
    }
  };

  useEffect(() => { loadOwnerData(); }, [session]);

  const downloadOwnerData = async () => {
    const { data: consentLogs } = await supabase
      .from('consent_audit_logs')
      .select('*')
      .eq('user_id', session.user.id);

    const exportPayload = {
      exported_at: new Date().toISOString(),
      retention_policy: 'Non-essential feedback records are automatically purged after 365 days.',
      owner_profile: profile,
      consent_timestamps: consentLogs || [],
      assigned_qr_stands: stands,
      feedback_records: logs,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FeedbackPulse101-Data-Export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const initiateDeleteAllOtp = async () => {
    setDelError('');
    setDelBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: session.user.email,
      options: { shouldCreateUser: false },
    });
    setDelBusy(false);
    if (error) setDelError(error.message);
    else setDelOtpSent(true);
  };

  const confirmDeleteAllWithOtp = async (e) => {
    e.preventDefault();
    setDelError('');
    setDelBusy(true);

    // 1. Verify 8-digit OTP PIN
    const { error: otpErr } = await supabase.auth.verifyOtp({
      email: session.user.email,
      token: delOtpCode.trim(),
      type: 'email',
    });

    if (otpErr) {
      setDelBusy(false);
      setDelError('Invalid or expired 8-digit OTP PIN. Please request a fresh code and try again.');
      return;
    }

    // 2. Archive to deleted_accounts_history & erase all owner records in Supabase
    const { error: rpcErr } = await supabase.rpc('delete_all_owner_data');
    if (rpcErr) {
      setDelBusy(false);
      setDelError(`Database erasure error: ${rpcErr.message}`);
      return;
    }

    // 3. Clear local state, sign out, and redirect to home
    setStands([]);
    setLogs([]);
    setDelBusy(false);
    setDeleteAllModal(false);
    await supabase.auth.signOut();
    window.location.replace('/');
  };

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
      <div className={`p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4 ${theme.card}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Shop Owner Dashboard</h1>
          <p className={`text-xs mt-1 ${theme.muted}`}>
            {profile.full_name ? `${profile.full_name} • ` : ''}{session.user.email} • {stands.length} Assigned QR/NFC Stand(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={downloadOwnerData}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${theme.subCard}`}
          >
            <Download className={`w-3.5 h-3.5 ${theme.accentText}`} /> Download My Data
          </button>
          <button
            type="button"
            onClick={() => { setDeleteAllModal(true); setDelOtpSent(false); setDelOtpCode(''); setDelError(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition ${theme.dangerBtn}`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete All My Data
          </button>
        </div>
      </div>

      {expiringSoonStands.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500 text-stone-950 font-semibold flex flex-wrap items-center justify-between gap-3 shadow">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong>Subscription Renewal Reminder (Within 7 Days):</strong>{' '}
              {expiringSoonStands.map((s) => `${s.stand_slug} (${getDaysLeft(s.subscription_expires_at)}d left)`).join(', ')}.
            </div>
          </div>
          <button
            onClick={() => { setPayStand(expiringSoonStands[0]); setSelectedPlanId('PLAN_3M'); setSelectedPayMethod('CASH'); }}
            className="px-4 py-2 rounded-xl bg-stone-950 text-white text-xs font-bold"
          >
            Renew Now (3 / 6 / 12 Months)
          </button>
        </div>
      )}

      {payNotice && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex justify-between items-center shadow">
          <span>{payNotice}</span>
          <button onClick={() => setPayNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {bundleNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-amber-300" /> QR Bundles:</span>
          <button
            onClick={() => setActiveBundleFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeBundleFilter === 'ALL' ? theme.primaryBtn : 'bg-white/90 text-stone-900'}`}
          >
            All Stands ({stands.length})
          </button>
          {bundleNames.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBundleFilter(b)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeBundleFilter === b ? theme.primaryBtn : 'bg-white/90 text-stone-900'}`}
            >
              {b} ({stands.filter((s) => s.bundle_name === b).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-bold text-lg text-white drop-shadow">Your QR &amp; NFC Stands ({visibleStands.length})</h2>
        {visibleStands.length === 0 ? (
          <div className={`p-8 text-center text-sm ${theme.card}`}>
            No QR stands are linked to <strong>{session.user.email}</strong> yet. Contact support@feedbackpulse101.in to link your stand.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {visibleStands.map((s) => {
              const daysLeft = getDaysLeft(s.subscription_expires_at);
              const shareUrl = `${window.location.origin}/r/${s.stand_slug}`;
              const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === s.plan_type) || SUBSCRIPTION_PLANS[0];
              return (
                <div key={s.id} className={`p-6 space-y-4 ${theme.card}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${theme.accentText}`} />
                        <h3 className="font-extrabold text-base">{s.business_name}</h3>
                      </div>
                      <p className={`text-xs mt-0.5 ${theme.muted}`}>
                        Placement: <strong>{s.location_label || 'Main Counter'}</strong> • Serial: <span className={`font-mono font-bold ${theme.accentText}`}>{s.stand_slug}</span>
                      </p>
                      <p className={`text-[11px] mt-0.5 ${theme.muted}`}>
                        Current Plan: <strong>{currentPlan.label} (₹{s.plan_amount || currentPlan.price})</strong> • Status: <strong>{s.payment_status}</strong>
                      </p>
                      {s.bundle_name && (
                        <span className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${theme.subCard}`}>
                          <Layers className={`w-3 h-3 ${theme.accentText}`} /> Bundle: {s.bundle_name}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      !s.is_active
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : daysLeft <= 7
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {!s.is_active ? 'Cancelled' : `${daysLeft} days left`}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between gap-2 p-2.5 text-xs ${theme.subCard}`}>
                    <span className="truncate font-mono">{shareUrl}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { navigator.clipboard.writeText(shareUrl); setCopiedId(s.id); setTimeout(() => setCopiedId(''), 1500); }}
                        className="p-1.5 rounded-lg border border-stone-300/60 hover:bg-stone-200/40"
                        title="Copy Link"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={shareUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-stone-300/60 hover:bg-stone-200/40" title="Open Stand">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/40">
                    <button
                      onClick={() => { setPayStand(s); setSelectedPlanId(s.plan_type || 'PLAN_3M'); setSelectedPayMethod('CASH'); }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 ${theme.primaryBtn}`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Plans &amp; Pay ({daysLeft}d left)
                    </button>

                    {s.is_active && (
                      <button
                        onClick={() => { setCancelStand(s); setCancelOtpSent(false); setCancelOtpCode(''); setCancelError(''); }}
                        className={`py-2.5 px-3 rounded-xl text-xs ${theme.dangerBtn}`}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-lg text-white drop-shadow">Customer Feedback Inbox ({logs.length})</h2>
          <span className="text-[11px] text-white/90 font-medium">Auto-retention policy: non-essential feedback auto-purges after 365 days</span>
        </div>
        <div className={`divide-y divide-stone-200/40 ${theme.card}`}>
          {logs.length === 0 && <p className={`p-6 text-xs ${theme.muted}`}>No guest ratings recorded yet.</p>}
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    l.rating_score >= 7
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    Score: {l.rating_score}/15
                  </span>
                  <span className={`text-xs ${theme.muted}`}>{new Date(l.created_at).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm mt-1">{l.feedback_text || 'Rated without written note'}</p>
                {l.customer_contact && <p className={`text-xs font-bold mt-0.5 ${theme.accentText}`}>Guest Contact: {l.customer_contact}</p>}
              </div>
              <span className={`text-xs font-bold ${theme.muted}`}>{l.routed_to_google ? 'Routed to Google' : 'Private Resolution'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: 3 / 6 / 12-Month Plan Selection + Cash / UPI Payment */}
      {payStand && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-lg w-full p-6 space-y-4 ${theme.card}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">Subscription Plans — {payStand.stand_slug}</h3>
              <button onClick={() => setPayStand(null)} className="p-1 rounded-lg hover:bg-stone-200/40"><X className="w-5 h-5" /></button>
            </div>
            <p className={`text-xs ${theme.muted}`}>
              Location: <strong>{payStand.location_label || 'Main'}</strong> • Time Left: <strong>{getDaysLeft(payStand.subscription_expires_at)} days</strong>. Choose a validity plan:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-2xl border text-left space-y-1 transition ${
                    selectedPlanId === plan.id
                      ? 'border-amber-500 bg-amber-400/25 ring-1 ring-amber-500'
                      : 'border-stone-300/60'
                  }`}
                >
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgePill}`}>{plan.badge}</span>
                  <div className="font-extrabold text-sm pt-0.5">{plan.label}</div>
                  <div className={`text-base font-extrabold ${theme.accentText}`}>₹{plan.price}</div>
                  <div className={`text-[10px] ${theme.muted}`}>₹{Math.round(plan.price / plan.months)}/mo</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPayMethod('CASH')}
                className={`p-3.5 rounded-2xl border text-left space-y-1 ${selectedPayMethod === 'CASH' ? 'border-amber-500 bg-amber-400/25' : 'border-stone-300/60'}`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div className="font-bold text-xs">Pay in Cash</div>
                <div className={`text-[11px] ${theme.muted}`}>In-person cash collection</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left space-y-1 ${selectedPayMethod === 'UPI' ? 'border-amber-500 bg-amber-400/25' : 'border-stone-300/60'}`}
              >
                <Smartphone className={`w-5 h-5 ${theme.accentText}`} />
                <div className="font-bold text-xs">Pay via UPI</div>
                <div className={`text-[11px] ${theme.muted}`}>{OWNER_UPI_ID || 'Direct UPI transfer'}</div>
              </button>
            </div>

            <button onClick={submitIndividualPayment} className={`w-full py-3 rounded-2xl text-sm ${theme.primaryBtn}`}>
              Confirm {selectedPlanObj.label} Plan (₹{selectedPlanObj.price}) via {selectedPayMethod}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: OTP-Verified Subscription Cancellation */}
      {cancelStand && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full p-6 space-y-4 ${theme.card}`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-extrabold text-base ${theme.dangerTitle}`}>Cancel Subscription — {cancelStand.stand_slug}</h3>
              <button onClick={() => setCancelStand(null)} className="p-1 rounded-lg hover:bg-stone-200/40"><X className="w-5 h-5" /></button>
            </div>
            <p className={`text-xs ${theme.muted}`}>
              Cancelling requires verifying an <strong>8-digit OTP PIN</strong> sent to <strong>{session.user.email}</strong>.
            </p>
            {cancelError && <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">{cancelError}</div>}
            {!cancelOtpSent ? (
              <button onClick={initiateCancelOtp} disabled={cancelBusy} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm">
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
                  className={`${theme.input} text-center font-mono text-base tracking-widest`}
                />
                <button type="submit" disabled={cancelBusy || cancelOtpCode.length < 8} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm">
                  {cancelBusy ? 'Verifying...' : 'Verify PIN & Cancel Stand'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: OTP-Verified "Delete All My Data" (DPDP Right to Erasure + Deleted History Audit) */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full p-6 space-y-4 ${theme.card}`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-extrabold text-base ${theme.dangerTitle}`}>Permanently Delete All My Data</h3>
              <button onClick={() => setDeleteAllModal(false)} className="p-1 rounded-lg hover:bg-stone-200/40"><X className="w-5 h-5" /></button>
            </div>
            <p className={`text-xs leading-relaxed ${theme.muted}`}>
              Under the Digital Personal Data Protection (DPDP) Act, 2023, this permanently erases your profile, consent logs, assigned QR stands, and feedback records (logging an erasure audit entry). Verify your <strong>8-digit OTP PIN</strong> sent to <strong>{session.user.email}</strong> to confirm.
            </p>
            {delError && <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">{delError}</div>}
            {!delOtpSent ? (
              <button onClick={initiateDeleteAllOtp} disabled={delBusy} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow">
                {delBusy ? 'Sending Deletion OTP...' : 'Send 8-Digit Erasure OTP to My Email'}
              </button>
            ) : (
              <form onSubmit={confirmDeleteAllWithOtp} className="space-y-3">
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={delOtpCode}
                  onChange={(e) => setDelOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 8-digit OTP PIN"
                  className={`${theme.input} text-center font-mono text-base tracking-widest`}
                />
                <button type="submit" disabled={delBusy || delOtpCode.length < 8} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow">
                  {delBusy ? 'Erasing All Data...' : 'Verify OTP & Permanently Erase Everything'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 6. COMPREHENSIVE DPDP 2023 PRIVACY POLICY & TERMS MODAL ==================== */
function LegalModal({ type, onClose, theme }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-4 ${theme.card}`}>
        <div className="flex justify-between items-center sticky top-0 pb-2 border-b border-stone-200/40">
          <h3 className="font-extrabold text-base sm:text-lg">
            {type === 'terms' && 'Terms & Conditions — FeedbackPulse101'}
            {type === 'privacy' && 'Privacy Policy, Sub-Processors & Breach Policy (DPDP Act, 2023)'}
            {type === 'refund' && 'Refund & Cancellation Policy'}
            {type === 'contact' && 'Contact & Grievance Officer'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-200/40"><X className="w-5 h-5" /></button>
        </div>

        {type === 'terms' && (
          <div className={`text-xs sm:text-sm space-y-3 leading-relaxed ${theme.muted}`}>
            <p><strong>1. Scope of Service:</strong> FeedbackPulse101 (MSME Registered Enterprise, Bhopal/Raisen, MP, India) provides QR &amp; NFC stand routing software and merchant dashboards.</p>
            <p><strong>2. Eligibility &amp; Parental Verification:</strong> Users must be 18+ years old, or complete verifiable Parent/Guardian double-OTP verification prior to account activation.</p>
            <p><strong>3. Anti-Review-Gating &amp; Consumer Protection Compliance:</strong> In compliance with the Consumer Protection Act, 2019 and CCPA Guidelines, merchants must never fabricate reviews, offer cash/discounts in exchange for positive ratings, or coerce customers.</p>
          </div>
        )}

        {type === 'privacy' && (
          <div className={`text-xs sm:text-sm space-y-3 leading-relaxed ${theme.muted}`}>
            <p><strong>1. Data Minimization &amp; Zero Ad Trackers:</strong> We collect only strictly required business owner credentials (email, name, stand configuration) and voluntary guest survey ratings. Zero advertising or behavioral tracking cookies are used.</p>
            <p><strong>2. Granular Consent &amp; Timestamps:</strong> All consents (Terms, Privacy, Age/Parental Double-OTP, and separate optional Marketing) are unchecked by default and logged with exact ISO timestamps.</p>
            <p><strong>3. Data Retention &amp; Right to Erasure:</strong> Non-essential guest feedback logs are automatically deleted after <strong>365 days (1 year)</strong>. Shop owners can export all their data in JSON format or permanently erase all their records anytime using 8-digit OTP verification (logged in our erasure audit ledger).</p>
            <p><strong>4. Authorized Sub-Processors (DPDP Section 8(2) DPAs Executed):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cloudflare, Inc.</strong> — CDN Hosting, DNS, SSL/TLS &amp; Turnstile Bot Protection (Global Edge)</li>
              <li><strong>Supabase, Inc.</strong> — PostgreSQL Database, Row-Level Security &amp; OTP Auth (AWS Cloud)</li>
              <li><strong>Resend, Inc.</strong> — Transactional 8-Digit OTP Email Delivery (US/Global Cloud)</li>
              <li><strong>Google LLC (Google Maps)</strong> — Destination review platform when guests voluntarily choose to post publicly</li>
            </ul>
            <p><strong>5. 72-Hour Data Breach Notification:</strong> Automated anomaly alerts trigger immediately upon detection, and any confirmed personal data breach is reported within <strong>72 hours</strong> to the Data Protection Board of India and affected users.</p>
          </div>
        )}

        {type === 'refund' && (
          <div className={`text-xs sm:text-sm space-y-3 leading-relaxed ${theme.muted}`}>
            <p>Physical QR/NFC stands include transit-damage replacement. Software subscription plans (<strong>3 Months ₹399</strong>, <strong>6 Months ₹699</strong>, or <strong>12 Months ₹1,199</strong> per stand) can be cancelled anytime in the Owner Dashboard via 8-digit OTP verification prior to the next billing cycle.</p>
          </div>
        )}

        {type === 'contact' && (
          <div className={`text-xs sm:text-sm space-y-3 leading-relaxed ${theme.muted}`}>
            <p><strong>Enterprise Name:</strong> FeedbackPulse101 (MSME Registered Enterprise)</p>
            <p><strong>Location:</strong> Bhopal / Raisen, Madhya Pradesh, India</p>
            <p><strong>Grievance &amp; Privacy Email:</strong> support@feedbackpulse101.in (Response within 48 hours)</p>
          </div>
        )}
      </div>
    </div>
  );
}
