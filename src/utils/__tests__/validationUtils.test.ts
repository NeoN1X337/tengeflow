import { describe, it, expect } from 'vitest';
import { isValidEmail, checkPasswordStrength } from '../validationUtils';

describe('validationUtils', () => {
    describe('isValidEmail', () => {
        it('returns true for valid emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('returns false for invalid emails', () => {
            expect(isValidEmail('plainaddress')).toBe(false);
            expect(isValidEmail('@missingusername.com')).toBe(false);
            expect(isValidEmail('user@.com')).toBe(false);
            expect(isValidEmail('user@domain')).toBe(false); // Missing TLD
        });

        it('allows short domains like x.com', () => {
            expect(isValidEmail('1@x.com')).toBe(true);
        });
    });

    describe('checkPasswordStrength', () => {
        it('identifies weak passwords (only numbers)', () => {
            const result = checkPasswordStrength('12345678');
            expect(result.length).toBe(true);
            expect(result.number).toBe(true);
            expect(result.upper).toBe(false);
            expect(result.special).toBe(false);
        });

        it('identifies short passwords', () => {
            const result = checkPasswordStrength('Ab1@');
            expect(result.length).toBe(false);
        });

        it('identifies strong passwords', () => {
            const result = checkPasswordStrength('StrongP@ssw0rd');
            expect(result.length).toBe(true);
            expect(result.upper).toBe(true);
            expect(result.number).toBe(true);
            expect(result.special).toBe(true);
        });
    });
});
