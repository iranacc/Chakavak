import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-xl font-bold text-red-400">خطایی در برنامه رخ داد</h2>
            <p className="mb-6 text-sm text-slate-300">
              {this.state.error?.message || "مشکلی در اجرای رابط کاربری پیش آمده است."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
              >
                تلاش مجدد
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch {}
                  window.location.href = '/login';
                }}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
              >
                خروج و ورود مجدد
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
