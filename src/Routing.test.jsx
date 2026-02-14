import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import App from './App';
import * as AuthContextModule from './contexts/AuthContext';
import * as UserProfileModule from './hooks/useUserProfile';

// Mock components to avoid deep rendering issues and focus on routing
vi.mock('./pages/LandingPage', () => ({
    default: () => <div data-testid="landing-page">Landing Page Content</div>
}));

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
    it('redirects to / (landing page) when accessing /profile without user', async () => {
        // Mock useAuth to return no user and not loading
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: null,
            loading: false,
            signup: vi.fn(),
            logout: vi.fn(),
            resetPassword: vi.fn()
        });

        vi.spyOn(UserProfileModule, 'useUserProfile').mockReturnValue({
            profile: { onboardingComplete: true, isBusinessMode: false },
            loading: false,
            updateProfile: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        // Should redirect to / (landing page) for unauthenticated users
        expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
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

        vi.spyOn(UserProfileModule, 'useUserProfile').mockReturnValue({
            profile: { onboardingComplete: true, isBusinessMode: false },
            loading: false,
            updateProfile: vi.fn()
        });

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
});
