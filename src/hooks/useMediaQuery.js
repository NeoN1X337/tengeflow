import { useState, useEffect } from 'react';

/**
 * Хук для отслеживания media-query.
 * @param {number} breakpoint — ширина в px (по умолчанию 768)
 * @returns {boolean} true если viewport >= breakpoint
 */
export default function useMediaQuery(breakpoint = 768) {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= breakpoint;
    });

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const handler = (e) => setMatches(e.matches);

        setMatches(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);

    return matches;
}
