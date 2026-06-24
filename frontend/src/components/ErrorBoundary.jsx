import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl font-black tracking-tighter mb-3">오류 발생</p>
          <p className="text-[14px] text-gray-400 font-medium mb-8">
            예기치 못한 오류가 발생했습니다.<br />페이지를 새로고침해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white font-bold px-8 py-3.5 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
