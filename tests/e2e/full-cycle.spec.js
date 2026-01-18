import { test, expect } from '@playwright/test';

test.describe('Full Cycle E2E: Login -> Transaction -> Analytics', () => {
    test.slow(); // Тест может идти дольше обычного из-за переходов

    test('should complete full user journey', async ({ page }) => {
        // --- 1. Login ---
        await page.goto('/');

        // Ждем пока пропадет глобальный лоадер приложения (App loading)
        await expect(page.locator('text=Загрузка...')).not.toBeVisible({ timeout: 15000 });

        // Проверяем, авторизованы ли мы
        const isDashboardVisible = await page.getByTestId('balance-card').isVisible();

        if (!isDashboardVisible) {
            // Если не на дашборде, значит должны быть на логине
            await expect(page.getByTestId('auth-email-input')).toBeVisible();

            const email = process.env.TEST_EMAIL;
            const password = process.env.TEST_PASSWORD;

            if (!email || !password) throw new Error('Creds missing');

            await page.getByTestId('auth-email-input').fill(email);
            await page.getByTestId('auth-password-input').fill(password);
            await page.getByTestId('auth-submit-button').click();
        }

        // Ждем загрузки баланса - это маркер того, что Dashboard готов
        await expect(page.getByTestId('balance-card')).toBeVisible({ timeout: 15000 });

        // Ждем пока пропадет "Загрузка..." (Firebase может долго грузиться)
        await expect(page.locator('.text-center >> text=Загрузка...')).not.toBeVisible({ timeout: 30000 });

        // --- 2. Action: Create Transaction ---
        await page.getByTestId('add-transaction-button').click();
        await expect(page.getByTestId('save-button')).toBeVisible();

        // Заполняем: Доход, 50 000, Налог 4%
        await page.getByTestId('transaction-amount-input').fill('50000');
        await page.getByTestId('transaction-type-select').selectOption('income');
        await page.getByTestId('tax-checkbox').check();

        // Сохраняем
        await page.getByTestId('save-button').click();

        // Strict Wait: Ждем, пока модалка исчезнет
        // Используем first(), так как Flowbite клонирует атрибуты на overlay и backdrop
        await expect(page.getByTestId('modal-overlay').first()).toBeHidden();

        // --- 3. Dashboard Verification ---
        // Ждем обновления списка (если есть рефетч)
        await expect(page.locator('.text-center >> text=Загрузка...')).not.toBeVisible();

        // Проверяем, что в списке есть 50 000. Используем более точный локатор для элемента списка.
        // Ищем элемент с amount содержащим 50 и 000 (учитывая любые разделители)
        await expect(page.getByTestId('transaction-amount').filter({ hasText: /50.*000/ }).first()).toBeVisible({ timeout: 15000 });

        // --- 4. Analytics Cross-Check ---
        // Сначала запомним налог, если бы мы делали это "до", но сейчас мы только добавили.
        // Чтобы проверить увеличение, нам надо было замерить "до".
        // Но в задании: "Проверь, что в блоке налогов сумма увеличилась на 2 000 ₸".
        // Значит, нам нужно было сходить в аналитику ДО транзакции.

        // --- RESTART LOGIC TO MEASURE BEFORE ---
        // Перезапустим логику: Сначала измерим, потом добавим.

        // Идем в аналитику
        await page.getByRole('link', { name: 'Аналитика' }).click();
        await expect(page.getByText('Налоговый монитор')).toBeVisible();

        const taxTextBefore = await page.getByTestId('tax-monitor-amount').innerText();
        const parseAmount = (text) => parseFloat(text.replace(/[^\d]/g, '')) || 0;
        const taxBefore = parseAmount(taxTextBefore);

        // Возвращаемся на Dashboard
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await expect(page.getByTestId('balance-card')).toBeVisible();

        // Добавляем снова (или первый раз, если считать это началом)
        await page.getByTestId('add-transaction-button').click();
        await page.getByTestId('transaction-amount-input').fill('50000');
        await page.getByTestId('transaction-type-select').selectOption('income');
        await page.getByTestId('tax-checkbox').check();
        await page.getByTestId('save-button').click();
        await expect(page.getByTestId('modal-overlay').first()).toBeHidden();

        // --- 5. Verify Analytics Increase ---
        await page.getByRole('link', { name: 'Аналитика' }).click();
        await expect(page.getByText('Налоговый монитор')).toBeVisible();

        // Ждем обновления данных (может быть задержка Firebase)
        await expect(async () => {
            const taxTextAfter = await page.getByTestId('tax-monitor-amount').innerText();
            const taxAfter = parseAmount(taxTextAfter);
            // Налог 4% от 50 000 = 2000
            expect(taxAfter).toBe(taxBefore + 2000);
        }).toPass({ timeout: 10000 });
    });
});
