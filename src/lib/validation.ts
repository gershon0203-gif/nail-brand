export const validators = {
  required: (value: string, label: string) => (value.trim() ? '' : `${label} is required.`),
  email: (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.',
  password: (value: string) =>
    value.length >= 8 ? '' : 'Password must be at least 8 characters.',
  phone: (value: string) =>
    /^[+\d][\d\s()-]{6,}$/.test(value.trim()) ? '' : 'Enter a valid phone number.',
  pinCode: (value: string) => (/^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(value.trim()) ? '' : 'Enter a valid PIN/postal code.'),
  positiveNumber: (value: string, label: string) =>
    Number(value) > 0 ? '' : `${label} must be greater than zero.`,
  nonNegativeNumber: (value: string, label: string) =>
    Number.isFinite(Number(value)) && Number(value) >= 0 ? '' : `${label} must be zero or more.`,
};

export function validateAddress(values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  const checks: Array<[string, string]> = [
    ['full_name', validators.required(values.full_name || '', 'Full name')],
    ['phone', validators.phone(values.phone || '') || validators.required(values.phone || '', 'Phone number')],
    ['house_flat', validators.required(values.house_flat || '', 'House / Flat number')],
    ['street', validators.required(values.street || '', 'Street')],
    ['area', validators.required(values.area || '', 'Area')],
    ['city', validators.required(values.city || '', 'City')],
    ['state', validators.required(values.state || '', 'State')],
    ['pin_code', validators.pinCode(values.pin_code || '') || validators.required(values.pin_code || '', 'PIN code')],
  ];
  checks.forEach(([key, error]) => {
    if (error) errors[key] = error;
  });
  return errors;
}
