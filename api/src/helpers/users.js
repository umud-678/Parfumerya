export function isAdminUser(user) {
  return user?.roles?.includes('Admin');
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles ?? [],
    isBlocked: !!user.isBlocked,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

export function normalizeSingleAdminRoles(db) {
  let changed = false;
  const users = db.users ?? [];
  const primaryAdmin =
    users.find((u) => u.id === 'admin-umud') ??
    users.find((u) => u.roles?.some((r) => r === 'Admin' || r === 'SuperAdmin'));

  for (const user of users) {
    const isPrimary = primaryAdmin && user.id === primaryAdmin.id;
    if (isPrimary) {
      if (!user.roles?.includes('Admin') || user.roles.includes('SuperAdmin') || user.roles.length !== 1) {
        user.roles = ['Admin'];
        changed = true;
      }
      continue;
    }
    if (user.roles?.some((r) => r === 'Admin' || r === 'SuperAdmin')) {
      user.roles = ['Customer'];
      changed = true;
      continue;
    }
    if (!user.roles?.length || user.roles.includes('SuperAdmin')) {
      user.roles = ['Customer'];
      changed = true;
    }
  }

  return changed;
}
