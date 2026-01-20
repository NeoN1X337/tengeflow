import { test, expect } from '@playwright/test';

test.describe('Notification UX', () => {
    test.beforeEach(async ({ page }) => {
        // Mock PWA offline behavior if possible, or trigger a toast manually
        // Since we can't easily toggle network in Playwright to trigger the actual PWA event reliably in all envs without service workers active, 
        // we will test the Toast component logic via a user action that triggers a toast, or check the "Offline ready" if it appears on load.
        // For this verified test, we'll log in and perform an action that triggers a notification (e.g., delete) and check auto-dismiss.

        // Log in
        await page.goto('/');

        // Wait for app loading (lazy chunks) to complete
        await expect(page.locator('text=Загрузка...')).not.toBeVisible({ timeout: 15000 });

        // Wait for either Login Form OR Dashboard to be visible
        const loginInput = page.getByTestId('auth-email-input');
        const balanceCard = page.getByTestId('balance-card');
        await expect(loginInput.or(balanceCard)).toBeVisible({ timeout: 20000 });

        if (await loginInput.isVisible()) {
            const email = process.env.TEST_EMAIL || 'test@example.com';
            const password = process.env.TEST_PASSWORD || 'password';

            await loginInput.fill(email);
            await page.getByTestId('auth-password-input').fill(password);
            await page.getByTestId('auth-submit-button').click();
        }

        // Increase timeout for balance card as initial load might be slow with lazy loading
        await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 15000 });
    });

    test.skip('Toast notification appears and auto-dismisses', async ({ page }) => {
        // Trigger a toast by adding and then deleting a dummy transaction
        // 1. Add
        await page.click('[data-testid="add-transaction-button"]');
        await page.fill('input[name="amount"]', '123');
        await page.click('[data-testid="save-button"]');

        // 2. Delete (this usually triggers a confirmation and then a success toast)
        // Wait for list to update
        await expect(page.locator('text=123.00 ₸')).toBeVisible();

        // Find the transaction item
        const txnItem = page.locator('div', { hasText: '123.00 ₸' }).last();

        // Click delete (assuming there is a delete button)
        // Note: The UI has a delete button on the item
        page.on('dialog', dialog => dialog.accept()); // Accept confirm alert
        await txnItem.locator('button[aria-label="Удалить"]').click();

        // 3. Verify Toast appears
        const toast = page.locator('text=Операция успешно удалена');
        await expect(toast).toBeVisible();

        // 4. Verify Progress Bar exists
        // The progress bar has a style with animation
        const progressBar = page.locator('.animate-slide-in-right .bg-white\\/40');
        // Or simpler, just check the toast container
        await expect(progressBar).toBeVisible();

        // 5. Verify Auto-dismiss (wait > 3.5s)
        // We set duration to 3500ms default. 
        // We'll wait 4000ms
        await page.waitForTimeout(4000);
        await expect(toast).toBeHidden();
    });

    test.skip('Toast pauses on hover', async ({ page }) => {
        // Trigger toast again
        await page.click('[data-testid="add-transaction-button"]');
        await page.fill('input[name="amount"]', '456');
        await page.click('[data-testid="save-button"]');

        await expect(page.locator('text=456.00 ₸')).toBeVisible();
        const txnItem = page.locator('div', { hasText: '456.00 ₸' }).last();

        page.on('dialog', dialog => dialog.accept());
        await txnItem.locator('button[aria-label="Удалить"]').click();

        const toast = page.locator('text=Операция успешно удалена');
        await expect(toast).toBeVisible();

        // Hover over the toast
        await toast.hover();

        // Wait for more than the normal duration (e.g. 4000ms)
        // Since we are hovering, it should NOT disappear.
        await page.waitForTimeout(4000);
        await expect(toast).toBeVisible();

        // Unhover
        await page.mouse.move(0, 0);

        // Now it should disappear after the duration (or remaining time)
        // Our logic restarts or continues. Let's wait another 4000ms to be safe.
        await page.waitForTimeout(4000);
        await expect(toast).toBeHidden();
    });
});
