import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent, ReactNode, CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Eye, EyeOff, LocateFixed, MapPin, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { navigate } from '../../router';
import { createDemoProfile, DEMO_OTP, profileCompletion } from '../model';
import type { AuthProvider, Profile } from '../model';
import { useDemo } from '../store';
import { Link } from '../ui';
import type { DemoAccount } from '../accounts';
import { DemoAccountsPanel } from './DemoAccounts';
import './auth.css';

const signupSteps = ['Account', 'Legal name', 'Mobile', 'Photo', 'Location', 'About you', 'Done'];
const interests = ['Camping', 'Photography', 'Cycling', 'Water sports', 'DIY', 'Events', 'Hiking', 'Music', 'Cooking', 'Gardening'];
const locations = ['Austin, TX', 'Brooklyn, NY', 'Denver, CO', 'Los Angeles, CA', 'Portland, OR', 'Seattle, WA'];
const dialCodes = [{ code: '+1', name: 'US / Canada' }, { code: '+44', name: 'United Kingdom' }, { code: '+61', name: 'Australia' }, { code: '+33', name: 'France' }, { code: '+91', name: 'India' }];

function BrandMark({ provider }: { provider: AuthProvider }) {
  if (provider === 'google') return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7V15H5.8a20 20 0 0 0 0 18l6.8-5.5Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1.1 7.8 3.2l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.4c1.6-4.8 6.1-8.3 11.4-8.3Z"/></svg>;
  if (provider === 'apple') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.8c0-2.1 1.7-3.1 1.8-3.2a4 4 0 0 0-3.2-1.7c-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.7a4.2 4.2 0 0 0-3.5 2.1c-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2.1 2.5 2 1-.1 1.4-.7 2.7-.7s1.7.7 2.8.7 1.8-1 2.4-2a9.2 9.2 0 0 0 1.1-2.2 3.8 3.8 0 0 1-1.6-3.7ZM14.3 6.5a3.8 3.8 0 0 0 .9-2.7 3.9 3.9 0 0 0-2.5 1.3 3.6 3.6 0 0 0-.9 2.6 3.2 3.2 0 0 0 2.5-1.2Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12H17l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z"/><path fill="#fff" d="M16.5 15.5 17 12h-3.1V9.6c0-1 .5-1.9 2-1.9h1.5V4.8s-1.3-.2-2.6-.2c-2.7 0-4.5 1.7-4.5 4.7V12h-3v3.5h3v8.4a12 12 0 0 0 3.7 0v-8.4h2.5Z"/></svg>;
}

function SocialButtons({ onChoose, disabled = false, loadingProvider = null }: { onChoose: (provider: AuthProvider) => void; disabled?: boolean; loadingProvider?: AuthProvider | null }) {
  return <div className="auth-socials">{(['google', 'apple', 'facebook'] as const).map((provider) => <button key={provider} type="button" className={`auth-social auth-social--${provider}`} disabled={disabled} aria-busy={loadingProvider === provider} onClick={() => onChoose(provider)}>{loadingProvider === provider ? <><span className="auth-social-spinner" />Connecting with {provider[0].toUpperCase() + provider.slice(1)}…</> : <><BrandMark provider={provider} /><span>Continue with {provider[0].toUpperCase() + provider.slice(1)}</span></>}</button>)}</div>;
}

function AuthFrame({ children, image = '/images/escape.jpg' }: { children: ReactNode; image?: string }) {
  return <main className="auth-frame"><aside className="auth-visual" style={{ backgroundImage: `linear-gradient(180deg, rgba(17, 40, 31, .12) 5%, rgba(17, 40, 31, .74) 100%), url("${image}")` }}><Link href="/" className="auth-brand" aria-label="YBuy home">YBuy<span>.</span></Link><div className="auth-visual-copy"><span className="auth-visual-rule" /><p>Good gear. Good neighbors.<br />More room for the life you want.</p><span className="auth-visual-caption">A better way to get out there</span></div><span className="auth-visual-credit">The trail is closer than you think</span></aside><section className="auth-content">{children}</section></main>;
}

function SignedInCard({ user, onSignOut }: { user: Profile; onSignOut: () => void }) {
  const name = user.firstName || user.legalName || user.email;
  return <AuthFrame><div className="auth-form auth-signed-in"><span className="auth-success-icon"><CheckCircle2 size={26} /></span><span className="auth-kicker">Welcome back</span><h1>You’re signed in as {name}.</h1><p className="auth-intro">Your neighborhood is ready when you are.</p><button className="auth-primary" type="button" onClick={() => navigate('/')}>Continue exploring<ArrowRight size={17} /></button><button className="auth-quiet-button" type="button" onClick={onSignOut}>Sign out</button></div></AuthFrame>;
}

function PasswordField({ value, onChange, label = 'Password', autoComplete, error }: { value: string; onChange: (value: string) => void; label?: string; autoComplete: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field"><label htmlFor={`auth-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</label><div className={`auth-input-wrap ${error ? 'has-error' : ''}`}><input id={`auth-${label.toLowerCase().replaceAll(' ', '-')}`} className="auth-input" type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} /><button type="button" className="auth-eye" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{error && <span className="auth-error" role="alert">{error}</span>}</div>;
}

function passwordChecks(value: string) { return [{ label: 'At least 8 characters', done: value.length >= 8 }, { label: 'One uppercase letter', done: /[A-Z]/.test(value) }, { label: 'One number', done: /\d/.test(value) }, { label: 'One symbol', done: /[^A-Za-z0-9]/.test(value) }]; }
function PasswordStrength({ password, checklist = false }: { password: string; checklist?: boolean }) {
  const checks = passwordChecks(password); const score = checks.filter((check) => check.done).length;
  return <div className="auth-strength" aria-live="polite"><div className="auth-strength-bars" aria-label={`Password strength: ${score} of 4`}>{checks.map((check, index) => <span key={check.label} className={index < score ? `is-level-${score}` : ''} />)}<small>{password ? ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score] : 'Use a strong password'}</small></div>{checklist && <ul className="auth-requirements">{checks.map((check) => <li key={check.label} className={check.done ? 'is-met' : ''}>{check.done ? <Check size={14} /> : <span className="auth-check-empty" />}{check.label}</li>)}</ul>}</div>;
}
function AuthDivider() { return <div className="auth-divider"><span>or</span></div>; }
function EmailInput({ value, onChange, error, id = 'auth-email' }: { value: string; onChange: (value: string) => void; error?: string; id?: string }) {
  return <div className="auth-field"><label htmlFor={id}>Email address</label><input id={id} className={`auth-input ${error ? 'has-error' : ''}`} type="email" autoComplete="email" inputMode="email" value={value} onChange={(event) => onChange(event.target.value)} />{error && <span className="auth-error" role="alert">{error}</span>}</div>;
}
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const strongPassword = (password: string) => passwordChecks(password).every((check) => check.done);

/** Premium sign-in screen with a focused split layout and demo social sign-in. */
export function SignInPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, signIn, signInWithPassword, completeAuth, signOut } = useDemo();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(true); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [socialLoadingProvider, setSocialLoadingProvider] = useState<AuthProvider | null>(null);
  if (user) return <SignedInCard user={user} onSignOut={signOut} />;
  const authenticate = (provider: AuthProvider, address = email) => { setLoading(true); setSocialLoadingProvider(provider); window.setTimeout(() => { signIn(provider, address.trim() || undefined); setSocialLoadingProvider(null); completeAuth(); }, 700); };
  const passwordSignIn = (address: string, secret: string) => { setLoading(true); window.setTimeout(() => { const profile = signInWithPassword(address, secret); if (!profile) { setLoading(false); setError('That email and password don’t match an account. Try a demo account below.'); return; } completeAuth(); }, 700); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!validEmail(email)) { setError('Enter a valid email address.'); return; } if (password.length < 8) { setError('Your password must be at least 8 characters.'); return; } setError(''); passwordSignIn(email, password); };
  const pickDemo = (account: DemoAccount) => { setEmail(account.email); setPassword(account.password); setError(''); passwordSignIn(account.email, account.password); };
  return <AuthFrame><div className="auth-form"><span className="auth-kicker">Your next good thing</span><h1>Welcome back</h1><p className="auth-intro">Sign in to find what you need, right around the corner.</p><SocialButtons onChoose={(provider) => authenticate(provider)} disabled={loading} loadingProvider={socialLoadingProvider} /><AuthDivider /><form className="auth-form-fields" onSubmit={submit} noValidate><EmailInput value={email} onChange={(value) => { setEmail(value); setError(''); }} /><PasswordField value={password} onChange={(value) => { setPassword(value); setError(''); }} autoComplete="current-password" error={error && !error.includes('email') ? error : undefined} />{error && error.includes('email') && <p className="auth-error" role="alert">{error}</p>}<div className="auth-form-options"><label className="auth-check-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label><Link href="/signin/reset" className="auth-link">Forgot password?</Link></div><button className="auth-primary" type="submit" disabled={loading}>{loading ? <><span className="auth-spinner" />Signing you in…</> : <>Sign in<ArrowRight size={17} /></>}</button></form><p className="auth-switch">New to YBuy? <Link href="/signup" className="auth-link">Create an account</Link></p><DemoAccountsPanel onPick={pickDemo} disabled={loading} /><p className="auth-demo-note"><ShieldCheck size={14} /> Demo preview — accounts live only in this browser.</p></div></AuthFrame>;
}
type ResetPhase = 'email' | 'code' | 'password' | 'success';

/** Reset flow demonstrates email, one-time code, and password reset states without a backend. */
export function ResetPasswordPage({ params }: { params: Record<string, string> }) {
  void params;
  const { notify } = useDemo();
  const [phase, setPhase] = useState<ResetPhase>('email'); const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const title = phase === 'email' ? 'Reset your password' : phase === 'code' ? 'Check your inbox' : phase === 'password' ? 'Choose a new password' : 'You’re all set';
  const submitEmail = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!validEmail(email)) { setError('Enter a valid email address.'); return; } setError(''); setPhase('code'); };
  return <AuthFrame image="/images/hike.jpg"><div className="auth-form auth-reset">
    {phase !== 'success' && <Link href="/signin" className="auth-back"><ArrowLeft size={16} />Back to sign in</Link>}<span className="auth-kicker">Account access</span><h1>{title}</h1>
    {phase === 'email' && <><p className="auth-intro">Enter the email linked to your account. We’ll show a demo recovery code in the next step.</p><form className="auth-form-fields" onSubmit={submitEmail} noValidate><EmailInput value={email} onChange={(value) => { setEmail(value); setError(''); }} error={error} /><button className="auth-primary" type="submit">Send recovery code<ArrowRight size={17} /></button></form></>}
    {phase === 'code' && <><p className="auth-intro">We’ve prepared a recovery code for <strong>{email}</strong>.</p><div className="auth-demo-code"><span>Demo recovery code</span><strong>{DEMO_OTP}</strong></div><form className="auth-form-fields" onSubmit={(event) => { event.preventDefault(); if (code !== DEMO_OTP) { setError('That code doesn’t match. Try 246810.'); return; } setError(''); setPhase('password'); }}><div className="auth-field"><label htmlFor="reset-code">6-digit code</label><input id="reset-code" className="auth-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} /></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" type="submit">Verify code<ArrowRight size={17} /></button><button type="button" className="auth-quiet-button" onClick={() => { setCode(''); setError(''); notify('A fresh demo code is ready: 246810.'); }}>Resend code</button></form></>}
    {phase === 'password' && <><p className="auth-intro">Create a password you haven’t used before.</p><form className="auth-form-fields" onSubmit={(event) => { event.preventDefault(); if (!strongPassword(password)) { setError('Meet all four password requirements to continue.'); return; } setError(''); setPhase('success'); }}><PasswordField label="New password" value={password} onChange={(value) => { setPassword(value); setError(''); }} autoComplete="new-password" /><PasswordStrength password={password} checklist />{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" type="submit">Save new password<ArrowRight size={17} /></button></form></>}
    {phase === 'success' && <><span className="auth-success-icon"><CheckCircle2 size={26} /></span><p className="auth-intro">Your demo password has been updated. You can sign in with it now.</p><button className="auth-primary" type="button" onClick={() => navigate('/signin')}>Back to sign in<ArrowRight size={17} /></button></>}
    <p className="auth-demo-note"><ShieldCheck size={14} /> Demo only — recovery messages aren’t sent.</p>
  </div></AuthFrame>;
}

interface SignupState {
  email: string; password: string; provider: AuthProvider; social: boolean; terms: boolean;
  firstName: string; lastName: string; preferredName: string; dateOfBirth: string;
  dialCode: string; phone: string; phoneVerified: boolean;
  photo: string; location: string; radius: number | null; bio: string; interests: string[];
}
const initialSignup: SignupState = { email: '', password: '', provider: 'email', social: false, terms: false, firstName: '', lastName: '', preferredName: '', dateOfBirth: '', dialCode: '+1', phone: '', phoneVerified: false, photo: '', location: '', radius: 5, bio: '', interests: [] };

/** Compares the birth date against the local calendar day to enforce the 18+ requirement. */
function ageAtLeast18(value: string) {
  if (!value) return false;
  const birth = new Date(`${value}T00:00:00`); const today = new Date(); const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return Number.isFinite(birth.getTime()) && birth <= cutoff;
}
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, -10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
}

function OtpBoxes({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const inputs = useRef<HTMLInputElement[]>([]);
  const setDigit = (index: number, digit: string) => { const next = value.split(''); next[index] = digit; onChange(next.join('').slice(0, 6)); if (digit && index < 5) inputs.current[index + 1]?.focus(); };
  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus(); if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus(); if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus(); };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => { const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (pasted) { event.preventDefault(); onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); } };
  return <div className="auth-otp" aria-label="Enter six digit verification code">{Array.from({ length: 6 }, (_, index) => <input key={index} ref={(node) => { if (node) inputs.current[index] = node; }} aria-label={`Code digit ${index + 1}`} className={error ? 'has-error' : ''} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} value={value[index] ?? ''} onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, '').slice(-1))} onKeyDown={(event) => onKeyDown(index, event)} onPaste={paste} />)}</div>;
}

/** Shrinks uploaded photos before storing them in the session-backed demo profile. */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = () => reject(new Error('Could not read that photo.'));
    reader.onload = () => { const image = new Image(); image.onerror = () => reject(new Error('Choose a valid image file.')); image.onload = () => { const canvas = document.createElement('canvas'); const scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight)); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale); const context = canvas.getContext('2d'); if (!context) { resolve(String(reader.result)); return; } context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', 0.78)); }; image.src = String(reader.result); };
    reader.readAsDataURL(file);
  });
}

function SignupStepper({ step }: { step: number }) {
  return <><ol className="auth-stepper">{signupSteps.map((name, index) => <li key={name} className={index < step ? 'is-done' : index === step ? 'is-current' : ''}><span className="auth-step-number">{index < step ? <Check size={13} /> : index + 1}</span><span>{name}</span></li>)}</ol><div className="auth-mobile-progress"><div className="auth-progress-track"><span style={{ width: `${((step + 1) / signupSteps.length) * 100}%` }} /></div><span>Step {step + 1} of {signupSteps.length}</span></div></>;
}
function accountError(form: SignupState) {
  if (!form.social && !validEmail(form.email)) return 'Enter a valid email address.';
  if (!form.social && !strongPassword(form.password)) return 'Meet all four password requirements to continue.';
  if (!form.terms) return 'Agree to the Terms and Privacy Policy to continue.';
  return '';
}

/** Seven-step account wizard, with locally preserved state and demo verification interactions. */
export function SignUpPage({ params }: { params: Record<string, string> }) {
  void params;
  const { user, signUp, completeAuth, signOut } = useDemo();
  const [form, setForm] = useState<SignupState>(initialSignup); const [step, setStep] = useState(0); const [error, setError] = useState('');
  const [phoneSent, setPhoneSent] = useState(false); const [phoneCode, setPhoneCode] = useState(''); const [countdown, setCountdown] = useState(0);
  const [locationQuery, setLocationQuery] = useState(''); const [locating, setLocating] = useState(false); const [locationAttention, setLocationAttention] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false); const [socialLoading, setSocialLoading] = useState(false); const [socialLoadingProvider, setSocialLoadingProvider] = useState<AuthProvider | null>(null); const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<SignupState>) => { setForm((current) => ({ ...current, ...patch })); setError(''); };
  useEffect(() => {
    if (!phoneSent || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phoneSent, countdown]);
  const chooseSocial = (provider: AuthProvider) => {
    setSocialLoading(true); setSocialLoadingProvider(provider);
    window.setTimeout(() => { const demo = createDemoProfile(provider); setForm((current) => ({ ...current, provider, social: true, email: current.email || demo.email })); setSocialLoading(false); setSocialLoadingProvider(null); }, 700);
  };
  const advance = () => {
    setError('');
    if (step === 0) { const message = accountError(form); if (message) { setError(message); return; } }
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) { setError('Enter your first and last legal name.'); return; }
      if (!ageAtLeast18(form.dateOfBirth)) { setError('You must be at least 18 to create an account.'); return; }
    }
    if (step === 2 && !form.phoneVerified) { setError('Verify your mobile number before continuing.'); return; }
    if (step === 4) {
      const location = form.location.trim() || locationQuery.trim();
      if (!location) { setError('Add a preferred location or use your current location.'); setLocationAttention(true); return; }
      if (!form.location.trim()) update({ location });
    }
    if (step === 5) {
      const email = form.email.trim() || createDemoProfile(form.provider).email;
      const profile: Profile = { ...createDemoProfile(form.provider, email), firstName: form.preferredName.trim() || form.firstName.trim(), lastName: form.lastName.trim(), legalName: `${form.firstName.trim()} ${form.lastName.trim()}`, email, emailVerified: false, phone: `${form.dialCode} ${form.phone}`.trim(), phoneVerified: form.phoneVerified, paymentAdded: false, photo: form.photo, bio: form.bio.trim(), interests: form.interests, location: form.location.trim(), radius: form.radius, dateOfBirth: form.dateOfBirth };
      signUp(profile); setCreatedProfile(profile);
    }
    setStep((current) => Math.min(current + 1, 6));
  };
  const back = () => { setError(''); setStep((current) => Math.max(current - 1, 0)); };
  if (user && !createdProfile) return <SignedInCard user={user} onSignOut={signOut} />;
  const doneProfile = createdProfile ?? user; const completion = profileCompletion(doneProfile);
  const sendPhoneCode = () => { if (form.phone.replace(/\D/g, '').length < 7) { setError('Enter a valid mobile number.'); return; } setError(''); setPhoneSent(true); setCountdown(30); setPhoneCode(''); };
  const verifyPhone = () => { if (phoneCode !== DEMO_OTP) { setError('That code doesn’t match. Try 246810.'); return; } update({ phoneVerified: true }); setPhoneSent(false); setError(''); };
  const getLocation = () => {
    setLocationAttention(false); setError('');
    if (!navigator.geolocation) { setLocationAttention(true); setError('Location access isn’t available here. Enter your city or ZIP code.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(() => { update({ location: 'Near you' }); setLocationQuery('Near you'); setLocationAttention(false); setLocating(false); }, () => { setLocationAttention(true); setError('Location access was declined. Enter a city or ZIP code instead.'); setLocating(false); }, { timeout: 8000 });
  };
  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; setSavingPhoto(true); setError('');
    try { update({ photo: await resizePhoto(file) }); } catch { setError('That photo couldn’t be opened. Try another image.'); }
    finally { setSavingPhoto(false); event.target.value = ''; }
  };
  const title = ['Create your account', 'Your legal name', 'Your mobile number', 'Add a profile photo', 'Where do you spend time?', 'A little about you', 'You’re ready to explore'][step];
  const subtitle = ['Join a community that helps good things go further.', 'Use the name exactly as it appears on your government ID.', 'We’ll use this to help neighbors coordinate rentals.', 'A clear photo helps neighbors feel confident meeting you.', 'Choose the neighborhood where you’d like to rent and lend.', 'Help your neighbors get to know you.', 'Your profile is off to a good start.'][step];

  return <AuthFrame image="/images/hike.jpg"><div className="auth-signup">
    <header className="auth-signup-header"><Link href="/" className="auth-brand auth-brand--small" aria-label="YBuy home">YBuy<span>.</span></Link><p>Already have an account? <Link href="/signin" className="auth-link">Sign in</Link></p></header>
    <SignupStepper step={step} />
    <div className="auth-wizard-content"><span className="auth-kicker">{step === 6 ? 'Your neighborhood awaits' : 'Let’s get to know you'}</span><h1>{title}</h1><p className="auth-intro">{subtitle}</p>
      {step === 0 && <div className="auth-step-panel"><SocialButtons onChoose={chooseSocial} disabled={socialLoading} loadingProvider={socialLoadingProvider} /><AuthDivider /><div className="auth-form-fields"><EmailInput value={form.email} onChange={(value) => update({ email: value, social: false, provider: 'email' })} /><PasswordField value={form.password} onChange={(value) => update({ password: value, social: false, provider: 'email' })} autoComplete="new-password" /><PasswordStrength password={form.password} checklist /><label className="auth-terms"><input type="checkbox" checked={form.terms} onChange={(event) => update({ terms: event.target.checked })} /><span>I agree to the <Link href="/terms" className="auth-link">Terms</Link> and <Link href="/privacy" className="auth-link">Privacy Policy</Link>.</span></label></div></div>}
      {step === 1 && <div className="auth-step-panel"><div className="auth-name-grid"><div className="auth-field"><label htmlFor="legal-first">First name</label><input id="legal-first" className="auth-input" autoComplete="given-name" value={form.firstName} onChange={(event) => update({ firstName: event.target.value })} /></div><div className="auth-field"><label htmlFor="legal-last">Last name</label><input id="legal-last" className="auth-input" autoComplete="family-name" value={form.lastName} onChange={(event) => update({ lastName: event.target.value })} /></div></div><p className="auth-help"><ShieldCheck size={15} /> Exact legal names help with identity verification and rental agreements.</p><div className="auth-field"><label htmlFor="preferred-name">Preferred first name <span>Optional</span></label><input id="preferred-name" className="auth-input" autoComplete="nickname" value={form.preferredName} onChange={(event) => update({ preferredName: event.target.value })} /></div><div className="auth-field"><label htmlFor="birth-date">Date of birth</label><input id="birth-date" className="auth-input" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(event) => update({ dateOfBirth: event.target.value })} /><span className="auth-field-note">You must be 18 or older to rent or lend.</span></div></div>}
      {step === 2 && <div className="auth-step-panel"><div className="auth-field"><label htmlFor="mobile-number">Mobile number</label><div className="auth-phone-row"><div className="auth-select-wrap"><select className="auth-input auth-select" aria-label="Country calling code" value={form.dialCode} onChange={(event) => update({ dialCode: event.target.value })}>{dialCodes.map((country) => <option key={country.code} value={country.code}>{country.code} · {country.name}</option>)}</select><ChevronDown size={15} /></div><input id="mobile-number" className="auth-input" type="tel" autoComplete="tel-national" inputMode="tel" value={form.phone} onChange={(event) => update({ phone: formatPhone(event.target.value), phoneVerified: false })} placeholder="(555) 555-0123" /></div></div>
        {form.phoneVerified ? <p className="auth-verified"><CheckCircle2 size={18} /> Mobile number verified</p> : !phoneSent ? <button className="auth-secondary auth-send-code" type="button" onClick={sendPhoneCode}>Send code<ArrowRight size={16} /></button> : <div className="auth-code-panel"><label className="auth-field-label">Enter your 6-digit code</label><OtpBoxes value={phoneCode} onChange={(value) => { setPhoneCode(value); setError(''); }} error={error} /><p className="auth-demo-hint">Demo code: <strong>{DEMO_OTP}</strong></p><button className="auth-secondary auth-send-code" type="button" onClick={verifyPhone}>Verify number<Check size={16} /></button><button className="auth-resend" type="button" disabled={countdown > 0} onClick={() => { setCountdown(30); setPhoneCode(''); setError(''); }}>{countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}</button></div>}
      </div>}
        {error && <p className="auth-error" role="alert">{error}</p>}
      {step === 3 && <div className="auth-step-panel auth-photo-panel"><div className="auth-photo-preview">{form.photo ? <img src={form.photo} alt="Your selected profile" /> : <UserRound size={44} strokeWidth={1.3} />}</div><p>{savingPhoto ? 'Preparing your photo…' : form.photo ? 'Your photo is ready' : 'A friendly, recent photo works best.'}</p><input ref={fileInput} className="auth-file-input" type="file" accept="image/*" capture="user" onChange={handlePhoto} /><button className="auth-secondary" type="button" onClick={() => fileInput.current?.click()} disabled={savingPhoto}><Upload size={16} />{form.photo ? 'Choose a different photo' : 'Upload or take a selfie'}</button><button className="auth-skip" type="button" onClick={advance}>I’ll do this later</button></div>}
      {step === 4 && <div className="auth-step-panel"><div className={`auth-field ${locationAttention ? 'is-attention' : ''}`}><label htmlFor="preferred-location">City or ZIP code</label><div className="auth-location-input"><MapPin size={17} /><input id="preferred-location" className="auth-input" role="combobox" aria-expanded={Boolean(locationQuery && !form.location)} aria-controls="auth-location-suggestions" autoComplete="off" value={locationQuery || form.location} onChange={(event) => { setLocationQuery(event.target.value); update({ location: '' }); setLocationAttention(false); }} placeholder="Try Austin, TX" /></div>{locationQuery && !form.location && <div id="auth-location-suggestions" className="auth-suggestions" role="listbox">{locations.filter((place) => place.toLowerCase().includes(locationQuery.toLowerCase())).slice(0, 4).map((place) => <button key={place} type="button" role="option" onClick={() => { update({ location: place }); setLocationQuery(''); }}>{place}</button>)}</div>}</div><button className="auth-location-button" type="button" disabled={locating} onClick={getLocation}><LocateFixed size={16} />{locating ? 'Finding your location…' : 'Use my current location'}</button>{error && <p className="auth-error" role="alert">{error}</p>}<fieldset className="auth-radius"><legend>Search radius</legend><div>{[{ label: '5 mi', value: 5 }, { label: '10 mi', value: 10 }, { label: '25 mi', value: 25 }, { label: '50 mi', value: 50 }, { label: 'Any', value: null }].map((choice) => <button key={choice.label} type="button" className={form.radius === choice.value ? 'is-selected' : ''} aria-pressed={form.radius === choice.value} onClick={() => update({ radius: choice.value })}>{choice.label}</button>)}</div></fieldset></div>}
      {step === 5 && <div className="auth-step-panel"><div className="auth-field"><label htmlFor="about-bio">Your bio <span>Optional</span></label><textarea id="about-bio" className="auth-input auth-textarea" maxLength={280} value={form.bio} onChange={(event) => update({ bio: event.target.value })} placeholder="What do you enjoy doing around your neighborhood?" /><span className="auth-char-count">{form.bio.length} / 280</span></div><fieldset className="auth-interests"><legend>What are you into? <span>Choose any</span></legend><div>{interests.map((interest) => <button type="button" key={interest} aria-pressed={form.interests.includes(interest)} className={form.interests.includes(interest) ? 'is-selected' : ''} onClick={() => update({ interests: form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest] })}>{interest}</button>)}</div></fieldset><button type="button" className="auth-skip" onClick={advance}>Skip for now</button></div>}
      {step === 6 && <div className="auth-step-panel auth-done-panel"><div className="auth-completion"><span className="auth-completion-ring" style={{ '--completion': `${completion.percent}%` } as CSSProperties}><span>{completion.percent}%</span></span><div><strong>Profile started</strong><span>You can add the rest any time.</span></div></div><ul className="auth-completion-list">{completion.items.map((item) => <li key={item.label} className={item.done ? 'is-done' : ''}><span className="auth-completion-check">{item.done ? <Check size={14} /> : <span />}</span><span>{item.label}</span>{!item.done && (item.label === 'Government ID' || item.label === 'Payment method') && <Link href="/profile/verify" className="auth-link">Add later</Link>}</li>)}</ul><p className="auth-demo-note"><ShieldCheck size={14} /> ID verification and payment setup are optional for now.</p></div>}
      {error && step !== 2 && step !== 4 && <p className="auth-error auth-step-error" role="alert">{error}</p>}
    </div>
    <footer className="auth-wizard-actions">{step > 0 && step < 6 && <button className="auth-back-button" type="button" onClick={back}><ArrowLeft size={16} />Back</button>}{step < 6 ? <button className="auth-primary auth-next" type="button" onClick={advance} disabled={savingPhoto || socialLoading}>{step === 5 ? 'Finish profile' : 'Continue'}<ArrowRight size={17} /></button> : <button className="auth-primary auth-next" type="button" onClick={completeAuth}>Start exploring<ArrowRight size={17} /></button>}</footer>
    <p className="auth-wizard-note"><ShieldCheck size={14} /> No real account, text, or identity check is created in this demo.</p>
  </div></AuthFrame>;
}









