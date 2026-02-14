import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('unauthenticated user sees landing page with H1 and navigation', async ({ page }) => {
        // Ensure we're logged out by going to a fresh context
        await page.goto('/');

        // Check for H1 title (SEO)
        const h1 = page.locator('h1');
        await expect(h1).toBeVisible();
        await expect(h1).toContainText('TengeFlow');

        // Check for CTA buttons
        const registerButton = page.getByRole('link', { name: /начать использование/i });
        const loginButton = page.getByRole('link', { name: /войти/i });

        await expect(registerButton).toBeVisible();
        await expect(loginButton).toBeVisible();

        // Verify navigation to login page
        await loginButton.click();
        await expect(page).toHaveURL('/login');

        // Go back and verify navigation to register
        await page.goto('/');
        await registerButton.click();
        await expect(page).toHaveURL('/register');
    });

    test('authenticated user auto-redirects from / to /dashboard', async ({ page }) => {
        await page.goto('/');

        // Login
        const loginInput = page.getByTestId('auth-email-input');
        const balanceCard = page.getByTestId('balance-card');

        // If not logged in, log in first
        if (await loginInput.isVisible()) {
            const email = process.env.TEST_EMAIL || 'test@example.com';
            const password = process.env.TEST_PASSWORD || 'password';

            await loginInput.fill(email);
            await page.getByTestId('auth-password-input').fill(password);
            await page.getByTestId('auth-submit-button').click();

            await page.waitForTimeout(2000);
        }

        // Now visit / and verify redirect
        await page.goto('/');
        await page.waitForTimeout(1000);

        // Should be redirected to /dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(balanceCard).toBeVisible({ timeout: 10000 });
    });

    test('/login and /register pages are accessible', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByTestId('auth-email-input')).toBeVisible();

        await page.goto('/register');
        await expect(page.getByTestId('auth-email-input')).toBeVisible();
    });
});
