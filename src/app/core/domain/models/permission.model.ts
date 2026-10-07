export const PERMISSIONS = {
  makeEntry: 'canMakeEntry',
  makeOutput: 'canMakeOutput',
  manageUsers: 'canManageUsers',
  manageRoles: 'canManageRoles',
  manageCatalog: 'canManageCatalog',
  generateSeals: 'canGenerateSeals',
  generateLetters: 'canGenerateLetters'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionRequirement {
  allOf?: readonly Permission[];
  anyOf?: readonly Permission[];
}
