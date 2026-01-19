import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, TextInput, Label, Button, Alert, Modal } from 'flowbite-react';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function AuthForm() {
    const navigate = useNavigate();
    const { user, signup, resetPassword } = useAuth();
    const { showToast } = useNotification();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Password Validation State
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        upper: false,
        number: false,
        special: false
    });

    useEffect(() => {
        setPasswordCriteria({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
    const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;

    // Strict Email Regex
    const isValidEmail = (email) => {
        // Enforce at least 2 characters for the domain name (e.g. 'gmail', 'yahoo')
        // Bans '1@d.com' (1 char domain)
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,}$/.test(email);
    };

    // Очистка полей когда пользователь выходит
    useEffect(() => {
        if (user === null) {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setError('');
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
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            showToast('Вы успешно вошли через Google!', 'success');
            navigate('/');
        } catch (err) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setResetStatus({ type: '', message: '' });

        if (!resetEmail) {
            setResetStatus({ type: 'failure', message: 'Введите email' });
            return;
        }

        if (!isValidEmail(resetEmail)) {
            setResetStatus({ type: 'failure', message: 'Введите корректный email' });
            return;
        }

        try {
            await resetPassword(resetEmail);
            setResetStatus({
                type: 'success',
                message: 'Ссылка отправлена. Если письма нет, проверьте "Спам".'
            });
            setTimeout(() => {
                setShowResetModal(false);
                setResetStatus({ type: '', message: '' });
                setResetEmail('');
            }, 6000); // Increased to 6 seconds
        } catch (error) {
            setResetStatus({ type: 'failure', message: getErrorMessage(error.code) });
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Заполните все поля');
            return;
        }

        if (isLogin) {
            // Basic validation for login is fine
        } else {
            if (!isValidEmail(email)) {
                setError('Введите корректный email (например, user@example.com)');
                return;
            }

            if (!isPasswordValid) {
                setError('Пароль не соответствует требованиям безопасности');
                return;
            }
        }


        setLoading(true);
        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);

                // if (!userCredential.user.emailVerified && !email.startsWith('test')) {
                //     await signOut(auth);
                //     setError('Ваша почта не подтверждена. Пожалуйста, проверьте email.');
                //     return;
                // }

                showToast('Добро пожаловать в TengeFlow!', 'success');
                navigate('/');
            } else {
                if (password !== confirmPassword) {
                    setError('Пароли не совпадают');
                    setLoading(false);
                    return;
                }

                // Signup sends verification email internally in AuthContext
                await signup(email, password);

                navigate('/verify-email');
            }
        } catch (err) {
            console.error('Auth error:', err);
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
                            data-testid="auth-email-input"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" value="Пароль" className="text-gray-700" />
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                data-testid="auth-password-input"
                                className="mt-1"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {!isLogin && (
                            <div className="mt-2 space-y-2">
                                {/* Strength Meter Bar */}
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${passwordStrength <= 1 ? 'bg-red-500' :
                                            passwordStrength <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                    ></div>
                                </div>

                                {/* Checklist */}
                                <div className="text-xs space-y-1">
                                    <div className={passwordCriteria.length ? 'text-green-600' : 'text-gray-500'}>
                                        {passwordCriteria.length ? '✓' : '•'} Минимум 8 символов
                                    </div>
                                    <div className={passwordCriteria.upper ? 'text-green-600' : 'text-gray-500'}>
                                        {passwordCriteria.upper ? '✓' : '•'} Заглавная буква
                                    </div>
                                    <div className={passwordCriteria.number ? 'text-green-600' : 'text-gray-500'}>
                                        {passwordCriteria.number ? '✓' : '•'} Цифра
                                    </div>
                                    <div className={passwordCriteria.special ? 'text-green-600' : 'text-gray-500'}>
                                        {passwordCriteria.special ? '✓' : '•'} Спецсимвол (!@#$...)
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <Label htmlFor="confirmPassword" value="Подтвердите пароль" className="text-gray-700" />
                            <div className="relative">
                                <TextInput
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    data-testid="auth-confirm-password-input"
                                    className="mt-1"
                                    color={confirmPassword && password !== confirmPassword ? "failure" : "gray"}
                                    helperText={
                                        confirmPassword && password !== confirmPassword
                                            ? <span className="font-medium">Пароли не совпадают</span>
                                            : null
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowResetModal(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Забыли пароль?
                            </button>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || (!isLogin && (!isPasswordValid || password !== confirmPassword))}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        data-testid="auth-submit-button"
                    >
                        <span className="text-white font-semibold">
                            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
                        </span>
                    </Button>
                </form>
            </Card>

            {/* Customized Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative">
                        <button
                            onClick={() => setShowResetModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            Восстановление пароля
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 text-center">
                            Введите email, указанный при регистрации. Мы отправим вам ссылку для восстановления пароля.
                        </p>

                        {resetStatus.message && (
                            <Alert color={resetStatus.type} className="mb-4">
                                <span>{resetStatus.message}</span>
                            </Alert>
                        )}

                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <Label htmlFor="reset-email" value="Email" className="mb-2 block font-medium" />
                                <TextInput
                                    id="reset-email"
                                    placeholder="name@company.com"
                                    value={resetEmail}
                                    onChange={(event) => setResetEmail(event.target.value)}
                                    required
                                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2"
                                disabled={Boolean(resetStatus.type === 'success')}
                            >
                                {resetStatus.type === 'success' ? 'Отправлено' : 'Отправить ссылку'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
