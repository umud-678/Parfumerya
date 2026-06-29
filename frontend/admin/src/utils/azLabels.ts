export const ORDER_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Gözləmədə' },
  { value: 'Confirmed', label: 'Təsdiqlənib' },
  { value: 'Shipped', label: 'Göndərilib' },
  { value: 'Delivered', label: 'Təhvil verilib' },
  { value: 'Cancelled', label: 'Ləğv edilib' },
] as const;

export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function formatUserRole(roles: string[]): string {
  if (roles.includes('SuperAdmin')) return 'Baş admin';
  if (roles.includes('Admin')) return 'Admin';
  return 'Müştəri';
}

export function isAdminRole(roles: string[]): boolean {
  return roles.some((r) => r === 'SuperAdmin' || r === 'Admin');
}

export function formatPaymentMethod(code: string): string {
  const map: Record<string, string> = {
    card: 'Bank kartı',
    cash: 'Nağd',
  };
  return map[code] ?? code;
}
