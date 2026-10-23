import { execSync } from 'child_process';
import { TEST_DATABASE_URL } from './helpers/testDb';

/** Applies migrations to the test database once before the whole run. */
export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
