// Client-side checks for the sign-in and sign-up forms.
// The backend must run the same checks; these just give instant feedback.

export const LIMITS = {
  username: 150,
  first_name: 150,
  last_name: 150,
  email: 254,
  password: 128,
};
export const PASSWORD_MIN = 8;

const USERNAME_RE = /^[\w.@+-]+$/;
// name@example.com: something, @, a domain with at least one dot, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function passwordChecks(pw) {
  return [
    { id: 'length', label: `At least ${PASSWORD_MIN} characters`, ok: pw.length >= PASSWORD_MIN },
    { id: 'case', label: 'Upper- and lowercase letters', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { id: 'number', label: 'At least one number', ok: /\d/.test(pw) },
    { id: 'symbol', label: 'A symbol, like ! or #', ok: /[^A-Za-z0-9]/.test(pw), optional: true },
  ];
}

const tooLong = (value, field) => value.length > LIMITS[field] && `Keep it under ${LIMITS[field]} characters.`;

// Returns { field: message } for every problem found. Empty object = valid.
// `withPassword: false` is the Microsoft sign-up: email still required, no password.
export function validateRegister(form, { withPassword = true } = {}) {
  const errors = {};
  const username = form.username.trim();
  if (!username) errors.username = 'Choose a username.';
  else if (tooLong(username, 'username')) errors.username = tooLong(username, 'username');
  else if (!USERNAME_RE.test(username)) errors.username = 'Use only letters, numbers and @ . + - _ (no spaces).';

  for (const field of ['first_name', 'last_name']) {
    const msg = tooLong(form[field].trim(), field);
    if (msg) errors[field] = msg;
  }

  const email = form.email.trim();
  if (!email) errors.email = 'Enter your email.';
  else if (tooLong(email, 'email')) errors.email = tooLong(email, 'email');
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email, like name@example.com.';

  if (!withPassword) return errors;

  const pw = form.password;
  if (!pw) errors.password = 'Create a password.';
  else if (tooLong(pw, 'password')) errors.password = tooLong(pw, 'password');
  else {
    const missing = passwordChecks(pw).find((c) => !c.optional && !c.ok);
    if (missing) errors.password = `Password needs: ${missing.label.toLowerCase()}.`;
  }

  if (!form.password_confirmation) errors.password_confirmation = 'Repeat your password.';
  else if (pw && form.password_confirmation !== pw) errors.password_confirmation = 'Passwords don’t match.';

  return errors;
}

export const isEmail = (value) => EMAIL_RE.test((value || '').trim());

export function validateLogin(form) {
  const errors = {};
  if (!form.username.trim()) errors.username = 'Enter your username.';
  if (!form.password) errors.password = 'Enter your password.';
  return errors;
}
