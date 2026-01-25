import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 text-center">
                    <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado.</h1>
                    <p className="mb-4">Ocorreu um erro inesperado.</p>
                    <div className="bg-white p-4 rounded shadow text-left overflow-auto max-w-full text-xs font-mono border border-red-200">
                        <p className="font-bold text-red-600">{this.state.error && this.state.error.toString()}</p>
                        <br />
                        <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Recarregar Página
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="mt-2 text-sm text-red-600 underline"
                    >
                        Limpar dados e voltar ao Login
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
