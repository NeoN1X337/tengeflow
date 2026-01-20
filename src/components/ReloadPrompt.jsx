import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast, Button } from 'flowbite-react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // SW Registered
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 flex flex-col gap-2">
            {/* Offline Notification */}
            {isOffline && (
                <Toast className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800">
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
                        <WifiOff className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-sm font-normal text-gray-800 dark:text-gray-200 flex-1">
                        Вы работаете в офлайн-режиме.
                    </div>
                    <Toast.Toggle className="ml-auto" />
                </Toast>
            )}

            {/* Offline Ready Notification */}
            {offlineReady && (
                <Toast>
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
                        <RefreshCw className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-sm font-normal flex-1">
                        Приложение готово к работе офлайн.
                    </div>
                    <Toast.Toggle onDismiss={() => setOfflineReady(false)} className="ml-auto" />
                </Toast>
            )}

            {/* New Version Notification */}
            {needRefresh && (
                <Toast duration={0}>
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center">
                            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200">
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            </div>
                            <div className="ml-3 text-sm font-normal">
                                Доступна новая версия.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="xs"
                                color="blue"
                                onClick={() => updateServiceWorker(true)}
                                className="w-full"
                            >
                                Обновить
                            </Button>
                            <Button size="xs" color="gray" onClick={close} className="w-full">
                                Позже
                            </Button>
                        </div>
                    </div>
                </Toast>
            )}
        </div>
    );
}
