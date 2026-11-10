// University Microsoft accounts store names as ФИО: "Прізвище Ім'я По батькові"
// (surname, first name, patronymic). We keep surname + first name and drop the patronymic.

// Common patronymic endings: Ukrainian/Russian Cyrillic plus Latin transliterations.
const PATRONYMIC_RE = /(ович|евич|йович|ич|івна|ївна|овна|евна|ична|инична|ovych|evych|ovich|evich|ivna|ovna|evna|ichna)$/i;

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean);
const isPatronymic = (w) => PATRONYMIC_RE.test(w);

// { first, last } from a Microsoft account.
export function namesFromAccount(account) {
  const claims = account?.idTokenClaims || {};

  // Separate claims, when the tenant sends them. given_name is sometimes "Ім'я По-батькові".
  if (claims.given_name || claims.family_name) {
    const given = words(claims.given_name);
    return { first: given[0] || '', last: words(claims.family_name).join(' ') };
  }

  // Otherwise split the display name: "Surname First [Patronymic]".
  const parts = words(claims.name || account?.name);
  if (parts.length >= 3 && isPatronymic(parts[parts.length - 1])) parts.pop();
  if (parts.length >= 2) return { last: parts[0], first: parts.slice(1).join(' ') };
  return { first: parts[0] || '', last: '' };
}

// "First Last" without the patronymic, for showing the account.
export function displayAccountName(account) {
  const { first, last } = namesFromAccount(account);
  return [first, last].filter(Boolean).join(' ') || account?.username || '';
}

// The account's email: the `email` claim if the tenant sends it, else the sign-in name (usually the email).
export function microsoftEmail(account) {
  const claims = account?.idTokenClaims || {};
  return (claims.email || claims.preferred_username || account?.username || '').trim();
}
