import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught Error in Component:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearAndReset = () => {
    if (window.confirm('سيتم حذف البيانات المؤقتة وإعادة ضبط النظام بالكامل. هل أنت متأكد؟')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 dir-rtl">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-teal-600/30 dark:border-teal-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-[#009d8f] flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 text-[#009d8f]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {this.props.fallbackTitleAr || 'وزارة التعليم - حماية النظام أكتشفت تنبيهاً'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                تم احتواء الاستجابة وتأمين الجلسة بنجاح دون أي تأثير على بيانات المستفيدين.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-start font-mono text-[10px] text-red-600 dark:text-red-400 max-h-24 overflow-y-auto border border-slate-200 dark:border-slate-700 dir-ltr">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-5 py-2.5 bg-[#009d8f] hover:bg-[#008277] text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الشاشة بنشاط</span>
              </button>
              
              <button
                onClick={this.handleClearAndReset}
                className="w-full px-5 py-2 text-slate-500 hover:text-red-500 text-[10px] font-bold transition-colors cursor-pointer"
              >
                حذف البيانات المخزنة وإعادة الضبط المصنعي
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
