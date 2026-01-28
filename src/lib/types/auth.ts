export type UserRole = 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';

export const RolePermissions: Record<UserRole, string[]> = {
    OWNER: ['*'],
    OPS: ['finance.view', 'finance.create', 'studio.*', 'users.view'],
    STUDIO: ['studio.*', 'calendar.view'],
    DIGITAL: ['social.*', 'calendar.view'],
    CLIENT: ['portal.view'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
    const perms = RolePermissions[role] || [];
    if (perms.includes('*')) return true;
    if (perms.includes(permission)) return true;

    // Wildcard check (e.g. 'studio.*' matches 'studio.view')
    const [scope] = permission.split('.');
    if (perms.includes(`${scope}.*`)) return true;

    return false;
}
