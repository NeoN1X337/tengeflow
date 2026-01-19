import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Full Cycle E2E: Login -> Transaction -> Analytics', () => {
    test.slow(); // Тест может идти дольше обычного из-за переходов

    test('should show verification message after registration', async ({ page }) => {
        await page.goto('/');

        // Go to Register
        const loginButton = page.getByRole('button', { name: 'Вход' });
        if (await loginButton.isVisible()) {
            await page.getByRole('button', { name: 'Регистрация' }).click();
        }

        const email = `test.new.${Date.now()}@example.com`;
        const weakPassword = 'password';
        const strongPassword = 'Password123!';

        await page.getByTestId('auth-email-input').fill(email);
        await page.getByTestId('auth-password-input').fill(weakPassword);
        await page.getByTestId('auth-confirm-password-input').fill(weakPassword);

        // Button should be disabled due to weak password
        await expect(page.getByTestId('auth-submit-button')).toBeDisabled();

        // Fix password to be strong
        await page.getByTestId('auth-password-input').fill(strongPassword);
        await page.getByTestId('auth-confirm-password-input').fill(strongPassword);

        // Button should be enabled
        await expect(page.getByTestId('auth-submit-button')).toBeEnabled();

        await page.getByTestId('auth-submit-button').click();

        // Check for redirection to /verify-email and message
        await expect(page).toHaveURL(/.*verify-email/);
        await expect(page.getByText('Подтвердите ваш Email')).toBeVisible();
        await expect(page.getByText('Мы отправили письмо')).toBeVisible();
    });

    test('should complete full user journey', async ({ page }) => {
        // --- 1. Login ---
        await page.goto('/');

        // Ждем пока пропадет глобальный лоадер приложения (App loading)
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

        // Проверка уведомления
        await expect(page.getByText('Операция добавлена')).toBeVisible();

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
        const parseAmount = (text) => {
            const cleaned = text.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };
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
        await expect(page.getByText('Операция добавлена')).toBeVisible();
        await expect(page.getByTestId('modal-overlay').first()).toBeHidden();

        // --- 5. Verify Analytics Increase (Feb Transaction) ---
        // Сценарий: Добавляем транзакцию за Февраль 2026 и проверяем Q1 и H1.

        // 1. Сначала получим текущие значения налога Q1 и H1
        await page.getByRole('link', { name: 'Аналитика' }).click();
        await expect(page.getByText('Налоговый календарь 2026')).toBeVisible();

        const getTaxValue = async (testId) => {
            const text = await page.getByTestId(testId).innerText();
            // Remove non-numeric except comma, then replace comma with dot
            const cleaned = text.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };

        const taxQ1Before = await getTaxValue('tax-q1');
        const taxH1Before = await getTaxValue('tax-h1');

        // 2. Добавляем транзакцию: 100 000 KZT, 15 Февраля 2026, Налог вкл.
        // Переходим на Dashboard чтобы открыть модалку (кнопка добавления там global, но проверим контекст)
        // Кнопка добавления может быть в шапке или на дашборде. В MainLayout?
        // В тесте выше используется `page.getByTestId('add-transaction-button')`.
        // Предполагаем, что она доступна. Если нет, вернемся на дашборд.
        await page.goto('/');
        await expect(page.getByTestId('balance-card')).toBeVisible();

        await page.getByTestId('add-transaction-button').click();
        await page.getByTestId('transaction-amount-input').fill('100000');
        await page.getByTestId('transaction-type-select').selectOption('income');

        // Установка даты: 2026-01-15 (Past valid date)
        // fill принимает YYYY-MM-DD
        await page.locator('input[type="date"]').fill('2026-01-15');

        await page.getByTestId('tax-checkbox').check();
        await page.getByTestId('save-button').click();
        await expect(page.getByText('Операция добавлена')).toBeVisible();
        await expect(page.getByTestId('modal-overlay').first()).toBeHidden();

        // 3. Проверяем изменения в Аналитике.
        // Налог с 100 000 = 4 000.
        // Q1 (Янв-Мар) должен увеличиться на 4000.
        // H1 (Янв-Июн) должен увеличиться на 4000.

        await page.getByRole('link', { name: 'Аналитика' }).click();
        await expect(page.getByText('Налоговый календарь 2026')).toBeVisible();

        await expect(async () => {
            const taxQ1After = await getTaxValue('tax-q1');
            const taxH1After = await getTaxValue('tax-h1');

            expect(taxQ1After).toBe(taxQ1Before + 4000);
            expect(taxH1After).toBe(taxH1Before + 4000);
        }).toPass({ timeout: 10000 });

        // --- 6. Verify Year Isolation & Rounding ---
        // Переключаемся на 2025 год и проверяем, что там 0 или нет наших транзакций.
        await page.locator('#year-select').selectOption('2025');
        await expect(page.getByText('Налоговый календарь 2025')).toBeVisible();

        // Ждем пока Q1 станет 0 или отличным от 2026
        // Если база пустая для 2025, должно быть 0.
        await expect(async () => {
            const taxQ1_2025 = await getTaxValue('tax-q1');
            expect(taxQ1_2025).toBe(0);
        }).toPass();
    });
});
