# WordDay — 고등학교 영단어 학습 앱

> 매일 아침 10분, 단어 하나씩

담임교사를 위한 초간단 학급 영단어 관리 솔루션입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TailwindCSS + Vite |
| 백엔드 | Node.js + Express 5 |
| DB (로컬) | SQLite (Prisma) |
| DB (프로덕션) | PostgreSQL (Railway) |
| 실시간 | Socket.io |
| SRS 알고리즘 | FSRS v4 |
| 인증 | JWT + bcryptjs |

## 로컬 실행

### 요구사항
- Node.js 20+

### 백엔드
```bash
cd backend
cp .env.example .env   # 환경변수 설정
npm install
npm run db:push        # SQLite DB 생성
npm run dev            # http://localhost:3001
```

### 프론트엔드
```bash
cd frontend
npm install
npx vite               # http://localhost:5173
```

## 배포

- **프론트엔드**: Vercel (GitHub 연동 자동 배포)
- **백엔드 + DB**: Railway (PostgreSQL 포함)

환경변수:
- `DATABASE_URL` — PostgreSQL 연결 문자열 (Railway 자동 제공)
- `JWT_SECRET` — 임의의 긴 문자열
- `FRONTEND_URL` — Vercel 배포 URL

## 주요 기능

- 플래시카드 (FSRS 간격반복 알고리즘)
- 4지선다 퀴즈
- 실시간 조회 테스트 (Socket.io)
- 교사 관리 패널 (CSV 단어 업로드, 학생 일괄 등록)
