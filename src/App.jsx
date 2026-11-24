import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Star, QrCode, ShieldCheck, Store, ArrowRight, Search, Copy, Check,
  Sparkles, AlertTriangle, CheckCircle2, LogOut, Plus, ExternalLink, X
} from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState('home'); // 'home' | 'rate' | 'dashboard' | 'generator'
  const [standParam, setStandParam] = useState('');
  const [queryOverride, setQueryOverride] = useState({});
  const [session, setSession] = useState(null);
  const [legalModal, setLegalModal] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const qrId = params.get('qr_id');

    if (path.startsWith('/r/')) {
      setStandParam(decodeURIComponent(path.replace('/r/', '')));
      setRoute('rate');
    } else if (qrId) {
      setStandParam(qrId);
      setQueryOverride({
        shop_name: params.get('shop_name') || '',
        owner_whatsapp: params.get('owner_whatsapp') || '',
        google_review_url: params.get('google_review_url') || '',
      });
      setRoute('rate');
    } else if (path === '/dashboard') {
      setRoute('dashboard');
    }

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (newRoute, slug = '') => {
    if (newRoute === 'rate' && slug) {
      window.history.pushState({}, '', `/r/${encodeURIComponent(slug)}`);
      setStandParam(slug);
      setQueryOverride({});
    } else if (newRoute === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else {
      window.history.pushState({}, '', '/');
    }
    setRoute(newRoute);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Star className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">FeedbackPulse101</div>
            <div className="text-xs text-slate-500">Dynamic QR &amp; NFC feedback</div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <button
                onClick={() => navigate('dashboard')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('dashboard')}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Owner sign in
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {route === 'home' && <HomePage onOpenSerial={(s) => navigate('rate', s)} onOpenDash={() => navigate('dashboard')} />}
        {route === 'rate' && <GuestRatingPage slug={standParam} queryOverride={queryOverride} />}
        {route === 'dashboard' && <OwnerDashboard session={session} />}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-4 py-10 text-center text-xs text-slate-500 space-y-3">
        <div className="flex flex-wrap justify-center gap-6 font-medium text-slate-600">
          <button onClick={() => setLegalModal('terms')} className="hover:text-amber-600">Terms of Service</button>
          <button onClick={() => setLegalModal('privacy')} className="hover:text-amber-600">Privacy Policy</button>
          <button onClick={() => setLegalModal('refund')} className="hover:text-amber-600">Refund &amp; Cancellation Policy</button>
          <button onClick={() => setLegalModal('contact')} className="hover:text-amber-600">Contact support</button>
        </div>
        <p>FeedbackPulse101 — Dynamic QR &amp; NFC feedback &amp; reputation platform (feedbackpulse101.in)</p>
      </footer>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  );
}

/* ==================== 1. HOME PAGE ==================== */
function HomePage({ onOpenSerial, onOpenDash }) {
  const [serial, setSerial] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (serial.trim()) onOpenSerial(serial.trim());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide">
          <QrCode className="w-3.5 h-3.5" /> DYNAMIC QR &amp; NFC FEEDBACK
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Turn every visit into a <span className="text-amber-500">Google review</span>
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base sm:text-lg">
          One stand per counter. Guests rate their visit in seconds, and your shop sees every private concern before it reaches the internet.
        </p>

        {/* Serial Lookup Box */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto pt-4">
          <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Enter your sticker serial
          </label>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:border-amber-500">
            <Search className="w-4 h-4 text-slate-400 ml-3" />
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="TR-8421-MPK"
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center gap-1.5 transition"
            >
              Open <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Have a sticker or NFC stand? Its serial is printed on it.</p>
        </form>
      </div>

      {/* 3 Feature Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Scan or tap the stand</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every counter has a serial-coded QR &amp; NFC stand. One tap opens the shop’s own feedback page.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Rate in seconds</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Three taps — quality, service and cleanliness — then submit. No app, no sign-up required.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Review or resolve</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Happy guests are handed a ready-to-post Google review. Concerns go privately to the owner.
          </p>
        </div>
      </div>

      {/* Run a shop CTA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Run a shop?</h3>
            <p className="text-sm text-slate-600">
              Sign in to generate serials, print QR stands, and read every private review in one ledger.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onOpenDash}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center gap-1.5"
          >
            Owner dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Early-bird launch pricing
          </h2>
          <p className="text-xs text-slate-500">
            Locked-in launch rates for the first 100 businesses — hardware included, software included for 90 days.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700">
              Launch Offer • First 100 Only
            </span>
            <h3 className="font-bold text-slate-900">Smart NFC + QR Stand</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">₹799</span>
              <span className="text-xs text-slate-400">one-time <s className="text-slate-400">₹899</s></span>
            </div>
            <p className="text-xs font-semibold text-emerald-600">Save ₹100</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Includes custom-printed NFC + QR acrylic stand, doorstep setup, and 90 days of Smart Review Routing free.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700">
              Early-Bird Rate Locked
            </span>
            <h3 className="font-bold text-slate-900">Monthly Smart Routing Plan</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">₹149</span>
              <span className="text-xs text-slate-400">/mo <s className="text-slate-400">₹179/mo</s></span>
            </div>
            <p className="text-xs font-semibold text-emerald-600">Save ₹360/year vs. regular ₹179/mo rate</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              After your 90-day trial ends. Billed monthly, cancel anytime.
            </p>
          </div>

          <div className="bg-amber-50/40 p-6 rounded-2xl border-2 border-amber-400 space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
              Most Popular • Save 44%
            </span>
            <h3 className="font-bold text-slate-900">Yearly Smart Routing Plan</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">₹1,199</span>
              <span className="text-xs text-slate-400">/yr <s className="text-slate-400">₹2,148/yr</s></span>
            </div>
            <p className="text-xs font-semibold text-emerald-600">Just ₹100/mo — saves ₹949/year vs. ₹179/mo regular rate</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              One payment covers a full year of Smart Review Routing.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          First 90 days included with stand purchase. Subscription auto-renews only if activated (24-hour advance bank notice before every debit). Cancel anytime in 1 click.
        </p>
      </div>
    </div>
  );
}

/* ==================== 2. GUEST RATING PAGE ==================== */
function GuestRatingPage({ slug, queryOverride }) {
  const [stand, setStand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({ quality: 0, service: 0, cleanliness: 0 });
  const [aiTone, setAiTone] = useState('Warm');
  const [reviewText, setReviewText] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittedState, setSubmittedState] = useState(null); // 'google' | 'private'

  useEffect(() => {
    async function loadStand() {
      setLoading(true);
      const { data } = await supabase
        .from('qr_stands')
        .select('*')
        .ilike('stand_slug', slug)
        .maybeSingle();

      const resolved = data || (queryOverride.shop_name ? {
        stand_slug: slug,
        business_name: queryOverride.shop_name,
        owner_name: '',
        google_review_url: queryOverride.google_review_url,
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
      } : null);

      setStand(resolved);
      if (resolved) {
        setReviewText(generatePreset('Warm', resolved.business_name, resolved.owner_name));
      }
      setLoading(false);
    }
    if (slug) loadStand();
  }, [slug]);

  const generatePreset = (tone, shop, owner) => {
    const byOwner = owner ? ` from ${owner}` : '';
    if (tone === 'Quick') return `Great experience at ${shop}! Clean place, fast service, and top quality. Highly recommend!`;
    if (tone === 'Detailed') return `Visited ${shop} today and had an amazing experience. The quality was outstanding, staff service was polite and attentive, and cleanliness was spotless${byOwner}. Will definitely visit again!`;
    return `Had a wonderful experience at ${shop}! Great quality, spotless cleanliness, and warm hospitality${byOwner}. Highly recommended!`;
  };

  const handleToneChange = (tone) => {
    setAiTone(tone);
    setReviewText(generatePreset(tone, stand.business_name, stand.owner_name));
  };

  const copyText = () => {
    navigator.clipboard.writeText(reviewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="max-w-md mx-auto p-10 text-center text-slate-500">Loading feedback stand...</div>;

  if (!stand) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Stand Not Found</h2>
        <p className="text-sm text-slate-600">Serial <strong>{slug}</strong> is not active yet. Please check the code on your stand.</p>
      </div>
    );
  }

  const isExpired = stand.subscription_status === 'paused' ||
    (stand.subscription_expires_at && new Date(stand.subscription_expires_at) < new Date());

  if (isExpired) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Service Paused</h2>
        <p className="text-sm text-slate-600">
          Feedback collection for <strong>{stand.business_name}</strong> is temporarily paused. If you are the shop owner, sign in to renew your plan.
        </p>
      </div>
    );
  }

  const totalScore = ratings.quality + ratings.service + ratings.cleanliness; // out of 15; scaled or >=8 threshold
  const allRated = ratings.quality > 0 && ratings.service > 0 && ratings.cleanliness > 0;
  // Normalize 3x5 (max 15) to 10-point equivalent or direct sum: >= 12/15 (8/10) routes to Google
  const normalizedScore = Math.round((totalScore / 15) * 10);

  const handleSubmit = async () => {
    if (!allRated) return;
    const isPositive = normalizedScore >= 8;

    if (stand.id) {
      await supabase.from('feedback_logs').insert({
        stand_id: stand.id,
        rating_score: normalizedScore,
        quality_rating: ratings.quality,
        service_rating: ratings.service,
        cleanliness_rating: ratings.cleanliness,
        feedback_text: isPositive ? reviewText : privateNote,
        customer_contact: customerPhone || null,
        routed_to_google: isPositive,
      });
    }

    if (isPositive && stand.google_review_url) {
      navigator.clipboard?.writeText(reviewText).catch(() => {});
      setSubmittedState('google');
      setTimeout(() => {
        window.location.href = stand.google_review_url;
      }, 900);
    } else {
      setSubmittedState('private');
    }
  };

  if (submittedState === 'google') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold">Opening Google Reviews...</h2>
        <p className="text-sm text-slate-600">Your review text has been copied — just paste it into Google!</p>
        <a href={stand.google_review_url} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold">
          Open Google Review Box <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (submittedState === 'private') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold">Thank You for Your Feedback</h2>
        <p className="text-sm text-slate-600">
          Your message has been sent privately to the management of <strong>{stand.business_name}</strong> so we can improve immediately.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{stand.business_name}</h1>
          {stand.owner_name && <p className="text-xs text-slate-500">Owner: {stand.owner_name}</p>}
          <p className="text-xs text-indigo-600 mt-2">Your feedback helps us serve you better.</p>
        </div>
        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {stand.stand_slug}
        </span>
      </div>

      {/* 3 Star Cards */}
      {[
        { key: 'quality', label: '1. Quality & Taste' },
        { key: 'service', label: '2. Staff Service' },
        { key: 'cleanliness', label: '3. Cleanliness' },
      ].map((item) => (
        <div key={item.key} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-slate-900">{item.label}</span>
            <span className="text-xs text-slate-400">Tap to rate</span>
          </div>
          <div className="flex justify-between px-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatings({ ...ratings, [item.key]: star })}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`w-8 h-8 ${
                    ratings[item.key] >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Conditional Box: High rating shows Pre-set AI Review; Low rating shows Private Concern box */}
      {allRated && normalizedScore < 8 ? (
        <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Tell the owner privately what went wrong</h3>
          <textarea
            rows={3}
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            placeholder="Share what we can fix right away..."
            className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500"
          />
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Optional phone/WhatsApp for manager callback"
            className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
          />
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Pre-set AI Review
            </span>
            <button onClick={copyText} className="text-xs font-medium text-indigo-600 flex items-center gap-1">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <div className="flex gap-2">
            {['Warm', 'Quick', 'Detailed'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleToneChange(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  aiTone === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none"
          />
          <p className="text-[11px] text-slate-400">
            Pre-written message — customize or copy it, ready to paste if you post a Google review.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!allRated}
        onClick={handleSubmit}
        className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm transition ${
          allRated ? 'bg-amber-500 hover:bg-amber-600 shadow-sm' : 'bg-amber-300/70 cursor-not-allowed'
        }`}
      >
        Submit Rating
      </button>
    </div>
  );
}

/* ==================== 3. OWNER DASHBOARD ==================== */
function OwnerDashboard({ session }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [stands, setStands] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newBiz, setNewBiz] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlaceId, setNewPlaceId] = useState('');

  useEffect(() => {
    if (session) fetchOwnerData();
  }, [session]);

  const fetchOwnerData = async () => {
    const { data: sData } = await supabase.from('qr_stands').select('*').order('created_at', { ascending: false });
    setStands(sData || []);
    const { data: lData } = await supabase.from('feedback_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs(lData || []);
  };

  const sendMagicLink = async (e) => {
    e.preventDefault();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setOtpSent(true);
  };

  const createStand = async (e) => {
    e.preventDefault();
    if (!newBiz || !newSlug) return;
    const reviewUrl = newPlaceId.startsWith('http')
      ? newPlaceId
      : `https://search.google.com/local/writereview?placeid=${newPlaceId.trim()}`;

    await supabase.from('qr_stands').insert({
      owner_id: session.user.id,
      business_name: newBiz.trim(),
      stand_slug: newSlug.trim().toUpperCase(),
      google_review_url: reviewUrl,
    });
    setNewBiz('');
    setNewSlug('');
    setNewPlaceId('');
    fetchOwnerData();
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xl font-bold">Owner Dashboard Sign In</h2>
        <p className="text-sm text-slate-600">Enter your registered email to receive a 1-click login link.</p>
        {otpSent ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm">
            Login link sent to <strong>{email}</strong>. Check your inbox!
          </div>
        ) : (
          <form onSubmit={sendMagicLink} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourshop.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm">
              Send Login Link
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-xs text-slate-500">Signed in as {session.user.email}</p>
        </div>
      </div>

      {/* Add New Stand */}
      <form onSubmit={createStand} className="bg-white p-6 rounded-2xl border border-slate-200 grid sm:grid-cols-4 gap-3">
        <input
          type="text"
          required
          value={newBiz}
          onChange={(e) => setNewBiz(e.target.value)}
          placeholder="Shop Name (e.g. Sharma Bakers)"
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <input
          type="text"
          required
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="Serial (e.g. TR-8421-MPK)"
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <input
          type="text"
          required
          value={newPlaceId}
          onChange={(e) => setNewPlaceId(e.target.value)}
          placeholder="Google Place ID or Review URL"
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> Add Stand
        </button>
      </form>

      {/* Active Stands & Expiry */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Your QR / NFC Stands ({stands.length})</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {stands.map((s) => {
            const shareUrl = `${window.location.origin}/r/${s.stand_slug}`;
            const expDate = s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString('en-IN') : 'Active';
            return (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{s.business_name}</h3>
                    <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{s.stand_slug}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    Valid till {expDate}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">QR Link: {shareUrl}</div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50"
                  >
                    Copy Stand URL
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
                  >
                    Preview Stand
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Private Feedback Ledger */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Recent Guest Feedback ({logs.length})</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {logs.length === 0 && <p className="p-6 text-sm text-slate-500">No feedback recorded yet.</p>}
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${l.rating_score >= 8 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    Score: {l.rating_score}/10
                  </span>
                  <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{l.feedback_text || 'No written note'}</p>
                {l.customer_contact && <p className="text-xs text-indigo-600 mt-0.5">Contact: {l.customer_contact}</p>}
              </div>
              <span className="text-xs text-slate-500">{l.routed_to_google ? 'Sent to Google' : 'Private Inbox'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== 4. LEGAL MODAL ==================== */
function LegalModal({ type, onClose }) {
  const content = {
    terms: {
      title: 'Terms of Service — FeedbackPulse101',
      body: 'FeedbackPulse101 provides NFC/QR feedback routing hardware and SaaS software for businesses in India. Merchants agree to collect genuine customer feedback in compliance with the Consumer Protection Act, 2019 and CCPA guidelines without incentivizing or fabricating fake reviews.',
    },
    privacy: {
      title: 'Privacy Policy (DPDP Act, 2023 Compliant)',
      body: 'FeedbackPulse101 collects business contact details and voluntary guest feedback. Data is encrypted and hosted on secure cloud infrastructure (Cloudflare and Supabase, which may process data on servers in the US or other compliant jurisdictions under Section 16 of the DPDP Act, 2023). Users may request access or deletion anytime.',
    },
    refund: {
      title: 'Refund & Cancellation Policy',
      body: 'Custom-printed NFC + QR stands include a 90-day software trial and are eligible for replacement if damaged in transit. Ongoing monthly (₹149/mo) or yearly (₹1,199/yr) software plans can be cancelled in 1 click anytime before the next billing cycle.',
    },
    contact: {
      title: 'Contact & Grievance Officer',
      body: 'Enterprise: FeedbackPulse101 (MSME Registered Sole Proprietorship, Bhopal / Raisen, Madhya Pradesh, India). Email: support@feedbackpulse101.in',
    },
  }[type];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{content.title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{content.body}</p>
      </div>
    </div>
  );
}