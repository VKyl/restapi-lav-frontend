import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { displayName, useAuth } from '../auth/AuthContext.jsx';
import { takeIntent, takeRedirectError } from '../auth/msal.js';
import { displayAccountName, microsoftEmail, namesFromAccount } from '../auth/names.js';
import { LIMITS, isEmail, passwordChecks, validateLogin, validateRegister } from '../auth/validation.js';
import { useDocumentTitle } from '../hooks/useApi.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import Field from '../components/Field.jsx';
import { useToast } from '../components/Toast.jsx';
import { FormError } from '../components/States.jsx';
import { focusField } from '../utils/errors.js';

const FROM_KEY = 'kma.authFrom';

const COPY = {
  login: {
    title: 'Sign in',
    eyebrow: 'Welcome back',
    heading: 'Good to see you again',
    lead: 'Sign in to pick up where you left off.',
    side: (
      <>
        Back on <span className="grad-text">stage.</span>
      </>
    ),
    sideLead: 'Your articles, gigs and bandmates are right where you left them.',
  },
  register: {
    title: 'Create account',
    eyebrow: 'Join KMArtists',
    heading: 'Create your account',
    lead: 'It takes less than a minute.',
    side: (
      <>
        Find your sound. <span className="grad-text">Find your people.</span>
      </>
    ),
    sideLead: 'Join the community wiki, gig board and jam finder for people who live for music.',
  },
};

const PERKS = [
  { icon: 'book', text: 'Write and edit artist articles' },
  { icon: 'calendar', text: 'Post gigs and see what’s on' },
  { icon: 'users', text: 'Get found by bands looking for you' },
];

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const copy = COPY[mode];
  const auth = useAuth();
  const { user, account, microsoftEnabled } = auth;
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [msPhase, setMsPhase] = useState('idle'); // idle | redirecting | working
  const [msError, setMsError] = useState(null);
  const notice = location.state?.notice;
  useDocumentTitle(copy.title);

  // Where to go once signed in. Kept in sessionStorage so it survives the trip to Microsoft.
  const from = location.state?.from || sessionStorage.getItem(FROM_KEY) || null;
  const finish = (u, message) => {
    sessionStorage.removeItem(FROM_KEY);
    toast(message);
    navigate(from && !['/login', '/register'].includes(from) ? from : '/', { replace: true });
  };

  function goToMicrosoft(intent, opts) {
    if (from) sessionStorage.setItem(FROM_KEY, from);
    setMsError(null);
    setMsPhase('redirecting');
    auth.signInWithMicrosoft(intent, opts).catch((err) => {
      setMsPhase('idle');
      setMsError({ message: err.message || 'Couldn’t open Microsoft sign-in.' });
    });
  }

  async function microsoftLogin() {
    setMsError(null);
    setMsPhase('working');
    try {
      const u = await auth.loginWithMicrosoft();
      finish(u, `Welcome back, ${u.first_name || u.username}!`);
    } catch (err) {
      setMsPhase('idle');
      if (err.status === 404 || err.code === 'not_registered') {
        navigate('/register', { replace: true, state: { notice: 'not_registered', from } });
      } else if (err.code === 'microsoft_expired') {
        // Microsoft session ended: go straight back through Microsoft sign-in.
        goToMicrosoft('login');
      } else {
        setMsError(err);
      }
    }
  }

  // Coming back from Microsoft: finish what the user started.
  useEffect(() => {
    const intent = takeIntent();
    const redirectError = takeRedirectError();
    if (redirectError) setMsError(redirectError);
    else if (intent === 'login' && isLogin && account) microsoftLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (path, state) => navigate(path, { replace: true, state: { ...state, from } });

  let body;
  if (user) {
    body = (
      <div className="auth-stack">
        <AccountRow name={displayName(user)} detail={`@${user.username}`} />
        <p className="muted">You’re already signed in.</p>
        <Link to="/" className="btn btn-primary btn-lg btn-block">
          Go to KMArtists <Icon name="arrowRight" size={18} />
        </Link>
      </div>
    );
  } else if (isLogin) {
    body = (
      <div className="auth-stack">
        {notice === 'already_registered' && <Notice>You already have an account. Sign in instead.</Notice>}
        {microsoftEnabled && (
          <>
            <FormError error={msError} />
            {account ? (
              <div className="auth-stack auth-stack-tight">
                <AccountRow name={displayAccountName(account)} detail={account.username} />
                <button className="btn btn-ms btn-lg btn-block" onClick={microsoftLogin} disabled={msPhase !== 'idle'}>
                  <MicrosoftLogo />
                  {msPhase === 'working' ? 'Signing you in…' : `Continue as ${namesFromAccount(account).first || account.username}`}
                </button>
                <button className="link-btn" onClick={() => goToMicrosoft('login', { chooseAccount: true })} disabled={msPhase !== 'idle'}>
                  Use a different Microsoft account
                </button>
              </div>
            ) : (
              <MicrosoftButton label="Continue with Microsoft" onClick={() => goToMicrosoft('login')} busy={msPhase === 'redirecting'} />
            )}
            <Divider>or sign in with username or email</Divider>
          </>
        )}
        <LoginForm
          onSubmit={async (creds) => {
            const u = await auth.loginWithPassword(creds);
            finish(u, `Welcome back, ${u.first_name || u.username}!`);
          }}
        />
      </div>
    );
  } else if (microsoftEnabled && account) {
    // Signing up with a connected Microsoft account: no password, names and email pre-filled from Microsoft.
    body = (
      <div className="auth-stack">
        {notice === 'not_registered' && (
          <Notice>
            There’s no KMArtists account for <strong>{account.username}</strong> yet. Pick a username to finish signing up.
          </Notice>
        )}
        <RegisterForm
          microsoftAccount={account}
          onSwitchAccount={() => goToMicrosoft('register', { chooseAccount: true })}
          onUseEmail={auth.forgetMicrosoft}
          onSubmit={async (form) => {
            try {
              const u = await auth.registerWithMicrosoft(form);
              finish(u, `Welcome to KMArtists, ${u.first_name || u.username}!`);
            } catch (err) {
              if (err.code === 'already_registered') return goTo('/login', { notice: 'already_registered' });
              if (err.code === 'microsoft_expired') return goToMicrosoft('register');
              throw err;
            }
          }}
        />
      </div>
    );
  } else {
    body = (
      <div className="auth-stack">
        {microsoftEnabled && (
          <>
            <FormError error={msError} />
            <MicrosoftButton label="Sign up with Microsoft" onClick={() => goToMicrosoft('register')} busy={msPhase === 'redirecting'} />
            <Divider>or sign up with email</Divider>
          </>
        )}
        <RegisterForm
          onSubmit={async (form) => {
            const u = await auth.register(form);
            finish(u, `Welcome to KMArtists, ${u.first_name || u.username}!`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="auth">
      <aside className="auth-side" aria-hidden="true">
        <div className="auth-side-glow" />
        <Link to="/" className="brand auth-brand" tabIndex={-1}>
          <Logo size={36} />
        </Link>
        <div className="auth-side-body">
          <h2 className="auth-side-title" key={mode}>
            {copy.side}
          </h2>
          <p className="auth-side-lead">{copy.sideLead}</p>
          <ul className="auth-perks">
            {PERKS.map((p) => (
              <li key={p.text}>
                <span className="auth-perk-icon">
                  <Icon name={p.icon} size={18} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-eq">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms`, animationDuration: `${700 + ((i * 53) % 500)}ms` }} />
          ))}
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <Link to="/" className="brand auth-brand-sm">
            <Logo size={30} />
          </Link>
          <Link to="/" className="back-link auth-back">
            <Icon name="arrowLeft" size={16} /> Back to site
          </Link>
        </div>

        <div className="auth-card card">
          <div className={`auth-switch ${isLogin ? '' : 'is-register'}`} role="tablist">
            <span className="auth-switch-thumb" />
            <Link to="/login" replace state={{ from }} role="tab" aria-selected={isLogin} className={isLogin ? 'is-active' : ''}>
              Sign in
            </Link>
            <Link to="/register" replace state={{ from }} role="tab" aria-selected={!isLogin} className={!isLogin ? 'is-active' : ''}>
              Create account
            </Link>
          </div>

          <div className="auth-content" key={mode}>
            <header className="auth-head">
              <span className="eyebrow">{copy.eyebrow}</span>
              <h1>{copy.heading}</h1>
              <p className="muted">{copy.lead}</p>
            </header>
            {body}
          </div>
        </div>

        <p className="auth-alt muted small">
          {isLogin ? 'New to KMArtists? ' : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'} replace state={{ from }} className="link-accent">
            {isLogin ? 'Create an account' : 'Sign in'}
          </Link>
        </p>
      </main>
    </div>
  );
}

/* ---------- Forms ---------- */

// Shared form state: client-side errors (live after the first submit) plus server errors.
function useAuthForm(initial, validate) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return focusField(first);

    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      // Backend errors look like {"error": {code, message, field}}. Show the message under
      // that field when the form has it; otherwise (no field, or a field not on this form) on top.
      const shown = err.field && document.querySelector(`[data-field="${CSS.escape(err.field)}"]`);
      if (shown) {
        setErrors({ [err.field]: err.message });
        focusField(err.field);
      } else if (err.field) {
        // Name the field, since "This field is required." alone wouldn't say which one.
        const label = err.field.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
        setServerError({ status: err.status, message: `${label}: ${err.message}` });
      } else {
        setServerError(err);
      }
      setBusy(false);
    }
  };

  return { form, errors, serverError, busy, set, handleSubmit };
}

function LoginForm({ onSubmit }) {
  const { form, errors, serverError, busy, set, handleSubmit } = useAuthForm({ login: '', password: '' }, validateLogin);

  return (
    <form className="auth-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormError error={serverError} />
      <Field label="Username or email" htmlFor="login" error={errors.login}>
        <input id="login" data-field="login" className="input" autoComplete="username" maxLength={LIMITS.email} value={form.login} onChange={set('login')} aria-invalid={Boolean(errors.login)} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" autoComplete="current-password" value={form.password} onChange={set('password')} invalid={Boolean(errors.password)} />
      </Field>
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? 'Signing you in…' : 'Sign in'}
        {!busy && <Icon name="arrowRight" size={18} />}
      </button>
    </form>
  );
}

function RegisterForm({ microsoftAccount, onSwitchAccount, onUseEmail, onSubmit }) {
  const withPassword = !microsoftAccount;
  // Email from Microsoft is locked; if Microsoft didn't provide a usable one, the user types it.
  const emailLocked = Boolean(microsoftAccount) && isEmail(microsoftEmail(microsoftAccount));
  const { form, errors, serverError, busy, set, handleSubmit } = useAuthForm(
    () => initialRegisterForm(microsoftAccount),
    (f) => validateRegister(f, { withPassword }),
  );

  const submit = (f) => {
    const payload = { username: f.username.trim(), first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim() };
    if (withPassword) Object.assign(payload, { password: f.password, password_confirmation: f.password_confirmation });
    return onSubmit(payload);
  };

  return (
    <form className="auth-stack" onSubmit={handleSubmit(submit)} noValidate>
      {microsoftAccount && (
        <AccountRow
          name={displayAccountName(microsoftAccount)}
          detail={microsoftAccount.username}
          action={
            <button type="button" className="link-btn" onClick={onSwitchAccount}>
              Not you?
            </button>
          }
        />
      )}
      <FormError error={serverError} />

      <Field label="Username" htmlFor="username" error={errors.username} hint="Letters, numbers and . + - _ (no @ or spaces).">
        <input id="username" data-field="username" className="input" autoComplete="username" maxLength={LIMITS.username} value={form.username} onChange={set('username')} aria-invalid={Boolean(errors.username)} autoFocus={Boolean(microsoftAccount)} />
      </Field>

      <div className="field-row">
        <Field label={<Optional>First name</Optional>} htmlFor="first_name" error={errors.first_name}>
          <input id="first_name" data-field="first_name" className="input" autoComplete="given-name" maxLength={LIMITS.first_name} value={form.first_name} onChange={set('first_name')} aria-invalid={Boolean(errors.first_name)} />
        </Field>
        <Field label={<Optional>Last name</Optional>} htmlFor="last_name" error={errors.last_name}>
          <input id="last_name" data-field="last_name" className="input" autoComplete="family-name" maxLength={LIMITS.last_name} value={form.last_name} onChange={set('last_name')} aria-invalid={Boolean(errors.last_name)} />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email} hint={emailLocked ? 'From your Microsoft account.' : undefined}>
        <input
          id="email"
          data-field="email"
          type="email"
          className="input"
          autoComplete="email"
          placeholder="name@example.com"
          maxLength={LIMITS.email}
          value={form.email}
          onChange={set('email')}
          readOnly={emailLocked}
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      {withPassword && (
        <>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={Boolean(errors.password)} />
            <PasswordStrength password={form.password} />
          </Field>
          <Field label="Confirm password" htmlFor="password_confirmation" error={errors.password_confirmation}>
            <PasswordInput
              id="password_confirmation"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={set('password_confirmation')}
              invalid={Boolean(errors.password_confirmation)}
              matched={form.password_confirmation && form.password_confirmation === form.password}
            />
          </Field>
        </>
      )}

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? 'Creating your account…' : 'Create account'}
        {!busy && <Icon name="arrowRight" size={18} />}
      </button>
      {microsoftAccount && (
        <button type="button" className="link-btn" onClick={onUseEmail}>
          Sign up with a password instead
        </button>
      )}
    </form>
  );
}

function initialRegisterForm(account) {
  const blank = { username: '', first_name: '', last_name: '', email: '', password: '', password_confirmation: '' };
  if (!account) return blank;
  // Prefill from Microsoft, without the patronymic (see names.js).
  const claims = account.idTokenClaims || {};
  const { first, last } = namesFromAccount(account);
  const local = (claims.preferred_username || account.username || '').split('@')[0];
  return {
    ...blank,
    username: local.replace(/[^\p{L}\p{N}_.+-]/gu, '').slice(0, LIMITS.username),
    first_name: first.slice(0, LIMITS.first_name),
    last_name: last.slice(0, LIMITS.last_name),
    email: isEmail(microsoftEmail(account)) ? microsoftEmail(account).trim().slice(0, LIMITS.email) : '',
  };
}

/* ---------- Pieces ---------- */

function PasswordInput({ id, value, onChange, autoComplete, invalid, matched }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id}
        data-field={id}
        className="input"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        maxLength={LIMITS.password}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
      />
      {matched && (
        <span className="input-ok" title="Passwords match">
          <Icon name="check" size={16} />
        </span>
      )}
      <button type="button" className="input-eye" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} title={visible ? 'Hide password' : 'Show password'}>
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

const STRENGTH = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'];

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length;
  return (
    <div className={`pw-strength pw-${score}`} aria-live="polite">
      <div className="pw-meter">
        {checks.map((c, i) => (
          <i key={c.id} className={i < score ? 'on' : ''} />
        ))}
        <span>{STRENGTH[score]}</span>
      </div>
      <ul className="pw-checks">
        {checks.map((c) => (
          <li key={c.id} className={c.ok ? 'ok' : ''}>
            <Icon name={c.ok ? 'check' : 'x'} size={13} />
            {c.label}
            {c.optional && <span className="muted"> (optional)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MicrosoftButton({ label, onClick, busy }) {
  return (
    <button type="button" className="btn btn-ms btn-lg btn-block" onClick={onClick} disabled={busy}>
      {busy ? <span className="spinner" aria-hidden="true" /> : <MicrosoftLogo />}
      {busy ? 'Opening Microsoft…' : label}
    </button>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function AccountRow({ name, detail, action }) {
  return (
    <div className="account-row">
      <Avatar name={name || detail || '?'} size={40} />
      <div className="account-row-text">
        <strong>{name || detail}</strong>
        {detail && detail !== name && <span className="muted small">{detail}</span>}
      </div>
      {action || (
        <span className="account-row-badge" title="Connected">
          <Icon name="check" size={14} />
        </span>
      )}
    </div>
  );
}

function Divider({ children }) {
  return (
    <div className="auth-divider">
      <span>{children}</span>
    </div>
  );
}

function Optional({ children }) {
  return (
    <>
      {children} <span className="optional">optional</span>
    </>
  );
}

function Notice({ children }) {
  return (
    <div className="auth-note auth-note-info" role="status">
      <Icon name="user" size={18} />
      <span>{children}</span>
    </div>
  );
}

