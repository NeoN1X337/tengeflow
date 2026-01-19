import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ taxRate: 4 }); // Default 4%
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile({ taxRate: 4 });
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    // Create default profile if not exists
                    const defaultProfile = { taxRate: 4 };
                    await setDoc(docRef, defaultProfile);
                    setProfile(defaultProfile);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                // Fallback to default
                setProfile({ taxRate: 4 });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const updateProfile = async (data) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, data);
            setProfile(prev => ({ ...prev, ...data }));
            return { success: true };
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    return { profile, loading, updateProfile };
}
