
import { test, expect } from '@playwright/test';

test('Doctor signup and role check', async ({ page }) => {
  await page.goto('/signup');

  // Fill in the signup form
  await page.fill('input[name="fullName"]', 'Dr. John Doe');
  await page.fill('input[name="email"]', 'john.doe@example.com');
  await page.fill('input[name="password"]', 'password123');

  // Select the "doctor" role
  await page.click('button:has-text("Doctor")');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for the redirect to the dashboard
  await page.waitForURL('/doctor/dashboard');

  // Check if the user is logged in as a doctor
  const session = await page.evaluate(() => {
    return window.localStorage.getItem('next-auth.session');
  });

  const sessionData = JSON.parse(session);
  expect(sessionData.user.role).toBe('doctor');
});
