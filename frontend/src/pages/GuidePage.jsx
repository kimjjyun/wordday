import { Link } from 'react-router-dom';

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white px-6">

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <Link to="/solo" className="text-[12px] text-gray-300 hover:text-black transition font-medium">← 돌아가기</Link>
        <span className="text-[13px] font-bold text-black tracking-tight">영어 단어 학습 가이드</span>
      </div>

      <div className="py-8 space-y-8 text-[14px] leading-relaxed text-gray-600">

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Guide</p>
          <h1 className="text-2xl font-black text-black tracking-tight leading-snug">
            매일 10분, 영어 단어를<br />오래 기억하는 법
          </h1>
        </div>

        <Section title="왜 매일 조금씩이 더 효과적일까">
          하루에 100단어를 몰아서 외우면 대부분 다음 날 잊어버립니다. 우리 뇌는 한 번에 받아들인 정보보다
          <b> 일정한 간격을 두고 반복한 정보</b>를 장기 기억으로 옮깁니다. 이를 '간격 반복(spaced repetition)'이라고 합니다.
          WordDay가 하루 20단어, 90일 과정으로 구성된 이유도 여기에 있습니다. 짧게, 그러나 매일 꾸준히가 핵심입니다.
        </Section>

        <Section title="단어는 예문과 함께 외우세요">
          단어와 뜻만 1:1로 외우면 실제 문장에서 그 단어를 만났을 때 바로 떠오르지 않습니다.
          WordDay의 모든 단어에는 실제 쓰임을 보여주는 영어 예문이 함께 제공됩니다.
          예문 속에서 단어가 어떤 맥락으로 쓰이는지 보면, 뜻뿐 아니라 어감과 활용까지 자연스럽게 익힐 수 있습니다.
        </Section>

        <Section title="암기 → 퀴즈 → 복습 3단계">
          <ul className="space-y-2 list-none">
            <Li><b>1단계 암기:</b> 단어 카드를 넘기며 영어 단어, 뜻, 예문을 가볍게 읽습니다. 외우려 애쓰기보다 먼저 익숙해지세요.</Li>
            <Li><b>2단계 퀴즈:</b> 같은 단어를 퀴즈로 풀어 스스로 떠올려 봅니다. '인출 연습'은 단순히 다시 읽는 것보다 기억에 훨씬 강하게 남습니다.</Li>
            <Li><b>3단계 복습:</b> 다음 날 또는 며칠 뒤 같은 범위를 다시 풀어 틀린 단어를 집중적으로 보완합니다.</Li>
          </ul>
        </Section>

        <Section title="분야별로 나눠서 공략하기">
          WordDay는 단어를 감정·성격, 사회·문화, 자연·환경, 학문·사고, 경제·일상, 건강·신체, 기술·과학,
          행동·동작, 문화·예술 등 9개 분야로 나눠 제공합니다. 관심 있는 분야나 시험에 자주 나오는 분야부터
          골라 학습하면, 관련 단어들이 서로 연결되며 더 오래 기억됩니다.
        </Section>

        <Section title="선생님을 위한 교실 모드">
          WordDay는 혼자 하는 솔로 학습 외에도, 선생님이 학급을 만들고 학생들과 함께 실시간으로 단어 시험을
          진행할 수 있는 교실 모드를 제공합니다. 시험 결과는 자동으로 집계되어 학생별 학습 현황을 한눈에 확인할 수 있습니다.
        </Section>

        <Section title="지금 바로 시작하기">
          가입 없이도 추천 단어로 학습을 시작할 수 있습니다. 아래 버튼을 눌러 오늘의 단어를 만나보세요.
          <div className="mt-4">
            <Link to="/solo"
              className="inline-block bg-black text-white font-bold py-3 px-6 rounded-full text-[14px] tracking-tight">
              단어 학습 시작하기 →
            </Link>
          </div>
        </Section>

      </div>

      <div className="pb-10 text-center space-y-2">
        <Link to="/privacy" className="text-[11px] text-gray-300 hover:text-gray-500 transition block">개인정보처리방침</Link>
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
