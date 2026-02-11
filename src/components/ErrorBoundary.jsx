import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h1>
                        <p className="text-gray-600 mb-4">Произошла ошибка при загрузке страницы.</p>
                        <pre className="text-xs text-left bg-gray-100 p-4 rounded overflow-auto mb-4">
                            {this.state.error?.toString()}
                        </pre>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Вернуться на главную
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
