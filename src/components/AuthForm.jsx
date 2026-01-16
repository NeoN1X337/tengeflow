import { useState, useEffect } from 'react';
import { Card, TextInput, Label, Button, Alert } from 'flowbite-react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

export default function AuthForm() {
    const { user } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');

    // Проверка sessionStorage для уведомления о регистрации (переживает unmount/remount)
    useEffect(() => {
        const regSuccess = sessionStorage.getItem('regSuccess');
        if (regSuccess) {
            setNotification('Аккаунт успешно создан! Пожалуйста, войдите.');
            setIsLogin(true);
            sessionStorage.removeItem('regSuccess');
        }
        setEmail('');
        setPassword('');
        setError('');
    }, []);

    // Очистка полей когда пользователь выходит (НО НЕ УВЕДОМЛЕНИЯ)
    useEffect(() => {
        if (user === null) {
            setEmail('');
            setPassword('');
            setError('');
            // НЕ очищаем notification - оно нужно для показа успешной регистрации
        }
    }, [user]);

    const getErrorMessage = (code) => {
        const errors = {
            'auth/email-already-in-use': 'Такая почта уже занята',
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-email': 'Некорректный email',
            'auth/weak-password': 'Пароль должен быть минимум 6 символов',
            'auth/invalid-credential': 'Неверные учетные данные'
        };
        return errors[code] || 'Произошла ошибка. Попробуйте снова.';
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setNotification('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setNotification('');

        if (!email || !password) {
            setError('Заполните все поля');
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен быть минимум 6 символов');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Регистрация без автоматического входа
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User registered:', userCredential.user.email);

                // Сохраняем флаг в sessionStorage ДО signOut (чтобы пережить unmount)
                sessionStorage.setItem('regSuccess', 'true');

                // Сразу выходим после регистрации
                await auth.signOut();
                console.log('User signed out after registration');

                // После signOut компонент AuthForm remount'ится и считает флаг из sessionStorage
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="max-w-md w-full shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    TengeFlow
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Финансовый трекер для Казахстана
                </p>

                {/* ЯРКОЕ Сообщение об успешной регистрации */}
                {notification && (
                    <div className="mb-6 p-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg shadow-2xl border-4 border-green-600 animate-pulse">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-8 h-8 text-white flex-shrink-0 mt-0.5 drop-shadow-lg" />
                            <div>
                                <h3 className="text-xl font-black text-white mb-2 drop-shadow-md">
                                    {notification}
                                </h3>
                                <p className="text-base font-bold text-white drop-shadow-sm">
                                    Введите ваш email и пароль в форму ниже 👇
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert color="failure" onDismiss={() => setError('')} className="mb-4">
                        <span className="font-medium">{error}</span>
                    </Alert>
                )}

                {/* Переключатель Вход/Регистрация */}
                <div className="flex mb-6 bg-gray-200 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(true);
                            setError('');
                            setNotification('');
                        }}
                        disabled={loading}
                        className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all ${isLogin
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Вход
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(false);
                            setError('');
                            setNotification('');
                        }}
                        disabled={loading}
                        className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all ${!isLogin
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Регистрация
                    </button>
                </div>

                {/* Google Sign-In */}
                <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    color="light"
                    className="w-full mb-4 bg-white border-2 border-gray-300 hover:bg-gray-50"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-gray-700 font-medium">Войти через Google</span>
                </Button>

                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">или</span>
                    </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                        <Label htmlFor="email" value="Email" className="text-gray-700" />
                        <TextInput
                            id="email"
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" value="Пароль" className="text-gray-700" />
                        <TextInput
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        <span className="text-white font-semibold">
                            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
                        </span>
                    </Button>
                </form>
            </Card>
        </div>
    );
}
