const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function validateNamePart(value, label, minLen = 2) {
  const part = String(value ?? '').trim();
  if (part.length < minLen) {
    return { ok: false, message: `${label} minimum ${minLen} simvol olmalıdır` };
  }
  if (!/^[\p{L}\s'-]+$/u.test(part)) {
    return { ok: false, message: `${label} yalnız hərflərdən ibarət olmalıdır` };
  }
  return { ok: true, value: part };
}

export function validateFirstName(firstName) {
  return validateNamePart(firstName, 'Ad');
}

export function validateLastName(lastName) {
  return validateNamePart(lastName, 'Soyad');
}

export function validateFullName(fullName) {
  const name = String(fullName ?? '').trim();
  if (name.length < 3) {
    return { ok: false, message: 'Ad soyad minimum 3 simvol olmalıdır' };
  }
  return { ok: true, value: name };
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_RE.test(normalized)) {
    return { ok: false, message: 'Etibarlı e-poçt ünvanı daxil edin' };
  }
  return { ok: true, value: normalized };
}

export function validatePassword(password) {
  const pwd = String(password ?? '');
  if (pwd.length < 8) {
    return { ok: false, message: 'Şifrə minimum 8 simvol olmalıdır' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { ok: false, message: 'Şifrədə ən azı bir böyük hərf olmalıdır' };
  }
  return { ok: true, value: pwd };
}

export function validateRegistrationInput(body) {
  let firstName;
  let lastName;
  let fullName;

  if (body?.firstName != null || body?.lastName != null) {
    const first = validateFirstName(body?.firstName);
    if (!first.ok) return first;
    const last = validateLastName(body?.lastName);
    if (!last.ok) return last;
    firstName = first.value;
    lastName = last.value;
    fullName = `${firstName} ${lastName}`;
  } else {
    const name = validateFullName(body?.fullName);
    if (!name.ok) return name;
    fullName = name.value;
    const parts = fullName.split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || parts[0];
  }

  const email = validateEmail(body?.email);
  if (!email.ok) return email;

  const password = validatePassword(body?.password);
  if (!password.ok) return password;

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      fullName,
      email: email.value,
      password: password.value,
    },
  };
}
