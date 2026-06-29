#!/usr/bin/env node
/**
 * Vercel build zamanı VITE_* env-ləri yoxlayır.
 * Lokal build-də skip edir. Env yoxdursa build dayandırmır — runtime-da DeployConfigGuard xəbərdar edir.
 */
const app = process.argv[2];

if (process.env.VERCEL !== '1') {
  process.exit(0);
}

const rules = {
  storefront: [{ key: 'VITE_API_URL', label: 'API URL (Render)' }],
  admin: [{ key: 'VITE_API_URL', label: 'API URL (Render)' }],
};

const checks = rules[app];
if (!checks) {
  console.error(`[deploy-check] Unknown app: ${app}`);
  process.exit(1);
}

const warnings = [];
for (const { key, label } of checks) {
  const value = process.env[key]?.trim();
  if (!value) {
    warnings.push(`${key} (${label}) təyin edilməyib — sayt açılacaq, amma API işləməyəcək`);
    continue;
  }
  if (value.includes('localhost') || value.includes('127.0.0.1')) {
    warnings.push(`${key} localhost göstərir — production API URL yazın`);
  }
  if (!value.startsWith('https://')) {
    warnings.push(`${key} https:// ilə başlamalıdır`);
  }
}

if (warnings.length) {
  console.warn('\n⚠️  Vercel Environment Variables (build davam edir):\n');
  warnings.forEach((w) => console.warn(`  • ${w}`));
  console.warn('\nVercel → Project → Settings → Environment Variables');
  console.warn('Nümunə: VITE_API_URL=https://amoria-api.onrender.com/api\n');
  process.exit(0);
}

console.log(`✓ [deploy-check] ${app} env OK`);
