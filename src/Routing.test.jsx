import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import App from './App';
import * as AuthContextModule from './contexts/AuthContext';

// Mock components to avoid deep rendering issues and focus on routing
vi.mock('./components/AuthForm', () => ({
    default: () => <div data-testid="auth-form">AuthForm Content</div>
}));

vi.mock('./pages/Profile', () => ({
    default: () => <div data-testid="profile-page">Profile Content</div>
}));

// Mock firebase
vi.mock('./firebase', () => ({
    auth: {},
    googleProvider: {},
    db: {}
}));

describe('App Routing Protection', () => {
    it('shows AuthForm when accessing /profile without user', () => {
        // Mock useAuth to return no user and not loading
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: null,
            loading: false,
            signup: vi.fn(),
            logout: vi.fn(),
            resetPassword: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
        expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
    });

    it('shows Spinner when loading', () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: null,
            loading: true,
            signup: vi.fn(),
            logout: vi.fn(),
            resetPassword: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
});
