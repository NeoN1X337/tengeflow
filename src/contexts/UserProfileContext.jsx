import { createContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebase';

export const UserProfileContext = createContext();

const DEFAULT_PROFILE = {
    taxRate: 4,
    isBusinessMode: false,
    onboardingComplete: false,
    bornAfter1975: true,
    hasEmployees: false,
    employeeCount: 0,
    totalEmployeeSalary: 0,
};

export function UserProfileProvider({ children }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(DEFAULT_PROFILE);
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'users', user.uid);
        setLoading(true);

        // Use onSnapshot for real-time updates across the app
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile({ ...DEFAULT_PROFILE, ...docSnap.data() });
            } else {
                // If doc doesn't exist, we don't create it here to avoid unnecessary writes
                // fetchProfile once to create if missing
                const ensureDoc = async () => {
                    const snap = await getDoc(docRef);
                    if (!snap.exists()) {
                        await setDoc(docRef, DEFAULT_PROFILE, { merge: true });
                    }
                };
                ensureDoc();
                setProfile(DEFAULT_PROFILE);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setProfile(DEFAULT_PROFILE);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateProfile = useCallback(async (data) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid);
            await setDoc(docRef, data, { merge: true });
            // onSnapshot will handle local state update
            return { success: true };
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }, [user]);

    const value = {
        profile,
        loading,
        updateProfile,
        isBusinessMode: profile?.isBusinessMode === true
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
}
