import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white px-6">

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <Link to="/solo" className="text-[12px] text-gray-300 hover:text-black transition font-medium">← 돌아가기</Link>
        <span className="text-[13px] font-bold text-black tracking-tight">개인정보처리방침</span>
      </div>

      <div className="py-8 space-y-8 text-[14px] leading-relaxed text-gray-600">

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Last updated</p>
          <p className="text-[15px] font-black text-black tracking-tight">2026. 06. 24</p>
        </div>

        <Section title="서비스 소개">
          WordDay(wordday999.netlify.app)는 영어 단어 학습을 돕는 웹 서비스입니다.
          본 방침은 서비스 이용 과정에서 수집되는 정보와 그 처리 방법을 설명합니다.
        </Section>

        <Section title="수집하는 정보">
          <ul className="space-y-2 list-none">
            <Li><b>교사 계정:</b> 아이디, 비밀번호(암호화 저장), 이름, 보안 질문 및 답변</Li>
            <Li><b>학생 계정:</b> 학번, 비밀번호(암호화 저장) — 학급 코드를 통해 교사가 등록</Li>
            <Li><b>학습 데이터:</b> 퀴즈 점수, 테스트 결과</Li>
            <Li><b>방문 기록:</b> 솔로 모드 익명 방문 횟수 (개인 식별 불가)</Li>
          </ul>
        </Section>

        <Section title="정보 이용 목적">
          <ul className="space-y-2 list-none">
            <Li>교사·학생 로그인 및 학급 관리 기능 제공</Li>
            <Li>퀴즈 결과 조회 및 학습 현황 확인</Li>
            <Li>서비스 품질 개선을 위한 익명 통계 집계</Li>
          </ul>
        </Section>

        <Section title="광고 서비스 (Google AdSense)">
          본 서비스는 Google AdSense를 통해 광고를 게재할 수 있습니다.
          Google은 쿠키를 사용하여 방문자에게 맞춤형 광고를 표시합니다.
          <ul className="space-y-2 list-none mt-3">
            <Li>Google의 광고 쿠키 사용으로 인해 방문 기록이 수집될 수 있습니다.</Li>
            <Li>맞춤 광고를 원하지 않는 경우 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-black underline">Google 광고 설정</a>에서 거부할 수 있습니다.</Li>
            <Li>Google의 개인정보처리방침: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-black underline">policies.google.com/privacy</a></Li>
          </ul>
        </Section>

        <Section title="쿠키(Cookie) 사용">
          로그인 상태 유지를 위해 브라우저의 로컬 스토리지를 사용합니다.
          광고 서비스(Google AdSense) 운영을 위해 제3자 쿠키가 사용될 수 있습니다.
          브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
        </Section>

        <Section title="정보의 보관 및 파기">
          <ul className="space-y-2 list-none">
            <Li>회원 탈퇴 또는 교사가 학급을 삭제하면 관련 데이터가 함께 삭제됩니다.</Li>
            <Li>비밀번호는 bcrypt로 암호화되어 저장되며, 원문은 보관하지 않습니다.</Li>
          </ul>
        </Section>

        <Section title="제3자 정보 제공">
          수집된 개인정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.
          광고 운영을 위한 Google과의 데이터 처리는 Google의 약관에 따릅니다.
        </Section>

        <Section title="문의">
          개인정보 처리에 관한 문의는 아래로 연락주세요.
          <p className="mt-2 font-medium text-black">kimjjyun8@gmail.com</p>
        </Section>

      </div>

      <div className="pb-10 text-center">
        <p className="text-[11px] text-gray-200">WordDay © 2026</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-black mb-3">{title}</h2>
      <div className="text-[14px] text-gray-500 leading-relaxed">{children}</div>
    </div>
  );
}

function Li({ children }) {
  return (
    <li className="flex gap-2">
      <span className="text-gray-300 shrink-0 mt-0.5">·</span>
      <span>{children}</span>
    </li>
  );
}
