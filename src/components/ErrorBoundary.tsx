import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary] Unhandled render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div className="max-w-xl rounded border border-white/15 bg-white/5 p-8">
            <div className="mb-4 font-serif text-3xl tracking-[0.25em] text-[#d4af37]">
              RENDER ERROR
            </div>
            <p className="mb-6 text-sm leading-7 text-white/70">
              游戏界面出现了运行时错误。请刷新页面，或返回主菜单后再试一次。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-[#d4af37]/40 px-6 py-2 text-xs uppercase tracking-[0.3em] text-[#d4af37] transition-colors hover:bg-[#d4af37] hover:text-black"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;