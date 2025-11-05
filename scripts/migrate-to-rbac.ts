#!/usr/bin/env ts-node

/**
 * RBAC Migration Script
 *
 * This script migrates from a simple role-based system (where users have a 'role' string field)
 * to the new RBAC system (where users have a 'roleId' reference to the roles table).
 *
 * What it does:
 * 1. Verifies system roles exist in the database
 * 2. Maps old role strings to new RBAC role IDs
 * 3. Updates all users with appropriate roleId
 * 4. Verifies all users have valid roles
 * 5. Provides detailed summary report
 *
 * Usage:
 *   npm run migrate:to-rbac
 *
 * Or directly:
 *   ts-node scripts/migrate-to-rbac.ts
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --verbose    Show detailed logs for each user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Command line arguments
const isDryRun = process.argv.includes('--dry-run');
const isVerbose = process.argv.includes('--verbose');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

/**
 * Mapping from old role strings to new RBAC role names
 * Customize this based on your legacy role system
 */
const ROLE_MAPPING: Record<string, string> = {
  // Legacy role -> New RBAC role
  'owner': 'Owner',
  'admin': 'Admin',
  'manager': 'Manager',
  'cashier': 'Cashier',
  'inventory_manager': 'Inventory Manager',
  'sales_rep': 'Sales Representative',
  'accountant': 'Accountant',

  // Variations/aliases (add more as needed)
  'superadmin': 'Owner',
  'administrator': 'Admin',
  'store_manager': 'Manager',
  'pos': 'Cashier',
  'sales': 'Sales Representative',
  'accounting': 'Accountant',
};

interface MigrationStats {
  totalUsers: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  usersMigrated: number;
  usersSkipped: number;
  usersWithUnmappedRoles: number;
  roleDistribution: Record<string, number>;
  errors: Array<{ userId: string; email: string; error: string }>;
}

async function verifySystemRoles(): Promise<boolean> {
  logSection('Step 1: Verifying System Roles');

  const requiredRoles = [
    'Owner',
    'Admin',
    'Manager',
    'Cashier',
    'Inventory Manager',
    'Sales Representative',
    'Accountant',
  ];

  let allRolesExist = true;

  for (const roleName of requiredRoles) {
    const role = await prisma.role.findFirst({
      where: { name: roleName, isSystem: true },
    });

    if (role) {
      log(`✓ ${roleName} role exists (ID: ${role.id})`, 'green');
    } else {
      log(`✗ ${roleName} role NOT FOUND`, 'red');
      allRolesExist = false;
    }
  }

  if (!allRolesExist) {
    log('\n⚠️  Some system roles are missing!', 'red');
    log('Please run the RBAC seed script first:', 'yellow');
    log('  npm run seed:rbac', 'cyan');
    return false;
  }

  log('\n✓ All system roles exist', 'green');
  return true;
}

async function getRoleMapping(): Promise<Map<string, string>> {
  log('\nFetching RBAC role IDs...', 'cyan');

  const roleMap = new Map<string, string>();

  for (const newRoleName of new Set(Object.values(ROLE_MAPPING))) {
    const role = await prisma.role.findFirst({
      where: { name: newRoleName, isSystem: true },
    });

    if (role) {
      roleMap.set(newRoleName, role.id);
      if (isVerbose) {
        log(`  Mapped "${newRoleName}" -> ${role.id}`, 'dim');
      }
    } else {
      log(`  Warning: Role "${newRoleName}" not found in database`, 'yellow');
    }
  }

  log(`✓ Mapped ${roleMap.size} RBAC roles`, 'green');
  return roleMap;
}

async function analyzeUsers(): Promise<MigrationStats> {
  logSection('Step 2: Analyzing Users');

  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithRoles: 0,
    usersWithoutRoles: 0,
    usersMigrated: 0,
    usersSkipped: 0,
    usersWithUnmappedRoles: 0,
    roleDistribution: {},
    errors: [],
  };

  // Count total users
  stats.totalUsers = await prisma.user.count();
  log(`Total users in database: ${stats.totalUsers}`, 'cyan');

  // Count users who already have roleId
  stats.usersWithRoles = await prisma.user.count({
    where: { roleId: { not: null } },
  });
  log(`Users with RBAC roleId: ${stats.usersWithRoles}`, 'green');

  // Count users without roleId
  stats.usersWithoutRoles = await prisma.user.count({
    where: { roleId: null },
  });
  log(`Users needing migration: ${stats.usersWithoutRoles}`, 'yellow');

  // Analyze legacy role distribution
  const usersToMigrate = await prisma.user.findMany({
    where: { roleId: null },
    select: { id: true, email: true, role: true },
  });

  log('\nLegacy role distribution:', 'cyan');
  for (const user of usersToMigrate) {
    const legacyRole = user.role || 'none';
    stats.roleDistribution[legacyRole] = (stats.roleDistribution[legacyRole] || 0) + 1;
  }

  for (const [role, count] of Object.entries(stats.roleDistribution).sort((a, b) => b[1] - a[1])) {
    const mappedTo = ROLE_MAPPING[role.toLowerCase()] || '(unmapped)';
    const color = mappedTo === '(unmapped)' ? 'red' : 'reset';
    log(`  ${role}: ${count} users -> ${mappedTo}`, color);

    if (mappedTo === '(unmapped)') {
      stats.usersWithUnmappedRoles += count;
    }
  }

  if (stats.usersWithUnmappedRoles > 0) {
    log(`\n⚠️  ${stats.usersWithUnmappedRoles} users have unmapped roles!`, 'yellow');
    log('You may need to update the ROLE_MAPPING in this script.', 'yellow');
  }

  return stats;
}

async function migrateUsers(roleMap: Map<string, string>, stats: MigrationStats): Promise<MigrationStats> {
  logSection('Step 3: Migrating Users');

  if (isDryRun) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  const usersToMigrate = await prisma.user.findMany({
    where: { roleId: null },
    select: { id: true, email: true, name: true, role: true, tenantId: true },
  });

  log(`Processing ${usersToMigrate.length} users...\n`, 'cyan');

  for (const user of usersToMigrate) {
    const legacyRole = (user.role || '').toLowerCase();
    const newRoleName = ROLE_MAPPING[legacyRole];

    if (!newRoleName) {
      // Unmapped role - skip or assign default
      stats.usersSkipped++;
      log(`⚠️  Skipped ${user.email} - unmapped role: "${user.role}"`, 'yellow');
      stats.errors.push({
        userId: user.id,
        email: user.email,
        error: `Unmapped legacy role: "${user.role}"`,
      });
      continue;
    }

    const newRoleId = roleMap.get(newRoleName);

    if (!newRoleId) {
      stats.usersSkipped++;
      log(`⚠️  Skipped ${user.email} - role ID not found for: "${newRoleName}"`, 'yellow');
      stats.errors.push({
        userId: user.id,
        email: user.email,
        error: `RBAC role not found: "${newRoleName}"`,
      });
      continue;
    }

    // Perform migration
    try {
      if (!isDryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: newRoleId },
        });
      }

      stats.usersMigrated++;

      if (isVerbose) {
        log(`✓ Migrated ${user.email}: "${user.role}" -> "${newRoleName}"`, 'green');
      } else {
        // Show progress indicator
        if (stats.usersMigrated % 10 === 0) {
          process.stdout.write('.');
        }
      }
    } catch (error) {
      stats.usersSkipped++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`✗ Error migrating ${user.email}: ${errorMessage}`, 'red');
      stats.errors.push({
        userId: user.id,
        email: user.email,
        error: errorMessage,
      });
    }
  }

  if (!isVerbose && stats.usersMigrated > 0) {
    console.log(''); // New line after progress dots
  }

  log(`\n✓ Migration complete`, 'green');
  log(`  Migrated: ${stats.usersMigrated}`, 'green');
  log(`  Skipped: ${stats.usersSkipped}`, 'yellow');

  return stats;
}

async function verifyMigration(): Promise<boolean> {
  logSection('Step 4: Verification');

  // Count users without roleId
  const usersWithoutRole = await prisma.user.count({
    where: { roleId: null },
  });

  if (usersWithoutRole > 0) {
    log(`⚠️  ${usersWithoutRole} users still don't have a roleId`, 'yellow');

    // List them
    const users = await prisma.user.findMany({
      where: { roleId: null },
      select: { id: true, email: true, role: true },
      take: 10,
    });

    log('\nUsers without roleId (showing first 10):', 'yellow');
    for (const user of users) {
      log(`  - ${user.email} (legacy role: "${user.role}")`, 'dim');
    }

    if (usersWithoutRole > 10) {
      log(`  ... and ${usersWithoutRole - 10} more`, 'dim');
    }

    return false;
  }

  // All users have roles!
  log('✓ All users have RBAC roles assigned', 'green');

  // Show final role distribution
  const roleDistribution = await prisma.user.groupBy({
    by: ['roleId'],
    _count: true,
  });

  log('\nFinal RBAC role distribution:', 'cyan');
  for (const item of roleDistribution) {
    const role = await prisma.role.findUnique({
      where: { id: item.roleId! },
      select: { name: true },
    });
    log(`  ${role?.name || 'Unknown'}: ${item._count} users`, 'reset');
  }

  return true;
}

function printSummary(stats: MigrationStats, success: boolean) {
  logSection('Migration Summary');

  log('Statistics:', 'bright');
  log(`  Total users: ${stats.totalUsers}`, 'cyan');
  log(`  Already had RBAC roles: ${stats.usersWithRoles}`, 'green');
  log(`  Needed migration: ${stats.usersWithoutRoles}`, 'yellow');
  log(`  Successfully migrated: ${stats.usersMigrated}`, 'green');
  log(`  Skipped (unmapped roles): ${stats.usersSkipped}`, 'yellow');

  if (stats.errors.length > 0) {
    log(`\nErrors (${stats.errors.length}):`, 'red');
    for (const error of stats.errors.slice(0, 10)) {
      log(`  ${error.email}: ${error.error}`, 'red');
    }
    if (stats.errors.length > 10) {
      log(`  ... and ${stats.errors.length - 10} more errors`, 'dim');
    }
  }

  console.log('\n' + '='.repeat(80));
  if (success) {
    log('✓ MIGRATION SUCCESSFUL', 'green');
  } else {
    log('⚠️  MIGRATION INCOMPLETE', 'yellow');
    log('Some users were not migrated. Please review the errors above.', 'yellow');
  }

  if (isDryRun) {
    log('\n🔍 This was a DRY RUN - no changes were made', 'cyan');
    log('Run without --dry-run to perform the actual migration', 'cyan');
  }

  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    log('\n' + '█'.repeat(80), 'cyan');
    log('  RBAC MIGRATION SCRIPT', 'bright');
    log('  Migrating from legacy roles to RBAC system', 'dim');
    log('█'.repeat(80) + '\n', 'cyan');

    if (isDryRun) {
      log('  Mode: DRY RUN (no changes will be made)\n', 'yellow');
    }

    // Step 1: Verify system roles exist
    const rolesExist = await verifySystemRoles();
    if (!rolesExist) {
      log('\n❌ Migration aborted - system roles not found', 'red');
      process.exit(1);
    }

    // Get role ID mapping
    const roleMap = await getRoleMapping();

    // Step 2: Analyze users
    let stats = await analyzeUsers();

    if (stats.usersWithoutRoles === 0) {
      log('\n✓ All users already have RBAC roles - nothing to migrate!', 'green');
      process.exit(0);
    }

    // Step 3: Migrate users
    stats = await migrateUsers(roleMap, stats);

    // Step 4: Verify migration
    const success = await verifyMigration();

    // Print summary
    printSummary(stats, success);

    if (!success) {
      process.exit(1);
    }

    log('Next steps:', 'bright');
    log('1. Verify users can log in and access their expected resources', 'cyan');
    log('2. Update backend code to use @RequirePermission decorators', 'cyan');
    log('3. Update frontend code to use PermissionGuard components', 'cyan');
    log('4. Run E2E tests to verify permission checks', 'cyan');
    log('5. Monitor audit logs for permission errors\n', 'cyan');

  } catch (error) {
    log('\n❌ Migration failed with error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main();
