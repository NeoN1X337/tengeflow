import { useContext } from 'react';
import { UserProfileContext } from '../contexts/UserProfileContext';

export function useUserProfile() {
    return useContext(UserProfileContext);
}

/**
 * Helper: checks if the user profile is in business mode
 */
export function isBusinessMode(profile) {
    return profile?.isBusinessMode === true;
}
