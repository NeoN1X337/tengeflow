import { Card, Button } from 'flowbite-react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="max-w-md w-full shadow-xl text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 rounded-full animate-pulse">
                        <Mail className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Подтвердите ваш Email
                </h2>

                <p className="text-gray-600 mb-6">
                    Мы отправили письмо с ссылкой для подтверждения на вашу электронную почту. Пожалуйста, перейдите по ссылке, чтобы активировать аккаунт и войти в систему.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
                    <span className="font-semibold">Не пришло письмо?</span> Проверьте папку "Спам" или "Нежелательная почта".
                </div>

                <div className="flex justify-center">
                    <Button
                        color="gray"
                        onClick={() => navigate('/')}
                        className="w-full"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Вернуться ко входу
                    </Button>
                </div>
            </Card>
        </div>
    );
}
