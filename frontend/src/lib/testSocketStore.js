// 테스트 진행 중 페이지 이동 시 소켓 유지용 모듈 변수
let _socket = null;

export const setTestSocket  = (s) => { _socket = s; };
export const getTestSocket  = ()  => _socket;
export const clearTestSocket = () => { _socket?.disconnect(); _socket = null; };
