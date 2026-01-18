import { test, expect } from '@playwright/test';

test.describe('TengeFlow E2E', () => {
    test('should login and add an income transaction with 4% tax', async ({ page }) => {
        // 1. Открыть страницу входа
        await page.goto('/');

        // Проверяем, что мы на странице логина
        await expect(page.getByTestId('auth-submit-button')).toBeVisible();

        // 2. Ввести тестовые данные
        const email = process.env.TEST_EMAIL;
        const password = process.env.TEST_PASSWORD;

        if (!email || !password) {
            throw new Error('КРИТИЧЕСКАЯ ОШИБКА: TEST_EMAIL или TEST_PASSWORD не заданы.');
        }

        await page.getByTestId('auth-email-input').fill(email);
        await page.getByTestId('auth-password-input').fill(password);
        await page.getByTestId('auth-submit-button').click();

        // Ждем загрузки Dashboard
        await expect(page.getByTestId('total-balance')).toBeVisible({ timeout: 15000 });

        // Ждем, пока загрузятся транзакции (чтобы баланс был актуальным, а не 0)
        // В Dashboard.jsx блок загрузки содержит текст "Загрузка..."
        // Но чтобы не спутать с App loading, уточним контекст или просто подождем, пока текст Загрузка исчезнет совсем
        await expect(page.locator('.text-center >> text=Загрузка...')).not.toBeVisible();

        // Запоминаем баланс ДО
        const balanceTextBefore = await page.getByTestId('total-balance').innerText();
        const parseBalance = (text) => parseFloat(text.replace(/[^\d-]/g, '')) || 0;
        const balanceBefore = parseBalance(balanceTextBefore);

        // 3. Добавить новую операцию
        await page.getByTestId('add-transaction-button').click();

        // Ждем модалку
        await expect(page.getByTestId('save-transaction-button')).toBeVisible();

        // Заполняем форму
        await page.getByTestId('transaction-amount-input').fill('10000');
        await page.getByTestId('transaction-type-select').selectOption('income');
        await page.getByTestId('tax-checkbox').check();

        // Сохраняем
        await page.getByTestId('save-transaction-button').click();

        // 4. Проверяем обновление баланса
        await expect(async () => {
            const balanceTextAfter = await page.getByTestId('total-balance').innerText();
            const balanceAfter = parseBalance(balanceTextAfter);
            expect(balanceAfter).toBe(balanceBefore + 10000);
        }).toPass();

        // Проверяем наличие операции в списке (тут можно тоже добавить data-testid для списка, но пока проверим по тексту)
        // Используем filter по тексту, так как может быть несколько операций
        await expect(page.getByTestId('transaction-amount').filter({ hasText: '10 000' }).first()).toBeVisible();
    });
});
