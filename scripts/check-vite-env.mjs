#!/usr/bin/env node
/**
 * Vercel build zamanı VITE_* env-lərin düzgün təyin olunub-olunmadığını yoxlayır.
 * Lokal build-də skip edir.
 */
const app = process.argv[2];

if (process.env.VERCEL !== '1') {
  process.exit(0);
}

const rules = {
  storefront: [
    { key: 'VITE_API_URL', label: 'API URL (Render)' },
  ],
  admin: [
    { key: 'VITE_API_URL', label: 'API URL (Render)' },
  ],
};

const checks = rules[app];
if (!checks) {
  console.error(`[deploy-check] Unknown app: ${app}`);
  process.exit(1);
}

const errors = [];
for (const { key, label } of checks) {
  const value = process.env[key]?.trim();
  if (!value) {
    errors.push(`${key} (${label}) təyin edilməyib`);
    continue;
  }
  if (value.includes('localhost') || value.includes('127.0.0.1')) {
    errors.push(`${key} localhost göstərir — production API URL yazın`);
  }
  if (!value.startsWith('https://')) {
    errors.push(`${key} https:// ilə başlamalıdır`);
  }
}

if (errors.length) {
  console.error('\n❌ Vercel Environment Variables xətası:\n');
  errors.forEach((e) => console.error(`  • ${e}`));
  console.error('\nVercel → Project → Settings → Environment Variables\n');
  process.exit(1);
}

console.log(`✓ [deploy-check] ${app} env OK`);
