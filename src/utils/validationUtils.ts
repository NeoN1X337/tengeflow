export const isValidEmail = (email: string): boolean => {
    // Enforce at least 2 characters for the domain name (e.g. 'gmail', 'yahoo')
    // Allows subdomains (e.g. co.uk) and standard formats
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

export interface PasswordCriteria {
    length: boolean;
    upper: boolean;
    number: boolean;
    special: boolean;
}

export const checkPasswordStrength = (password: string): PasswordCriteria => {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
};
