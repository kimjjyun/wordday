# 운영자 통계 (비공개)

앱 화면에는 전혀 노출되지 않는, 운영자 전용 사용량 통계입니다.

## 무엇이 집계되나
- **교사 / 학급 / 학생 수**, **시험 진행 수 / 제출 결과 수** — 운영 DB에서 실시간 집계
- **로그인 없는 게스트 방문자 수** — 익명 ID 기준, 하루 1회 집계 (개인정보 미수집)
- **최근 30일 일자별 추이** — 게스트 방문 / 신규 교사 / 신규 학생

## 조회 방법
```
GET https://wordday-backend.onrender.com/api/stats/admin?key=<ADMIN_STATS_KEY>
```
또는 헤더 `x-admin-key: <ADMIN_STATS_KEY>`.

- 비밀키는 Render 환경변수 **`ADMIN_STATS_KEY`** 에 저장됩니다. (공개 저장소이므로 키 자체는 여기에 적지 않음)
- 환경변수 미설정 시 엔드포인트는 503으로 비활성화됩니다.

## Claude로 보는 법
Claude Code에게 "워드데이 사용 통계 보여줘" 라고 하면, Claude가 비밀키로 위 엔드포인트를 호출해 숫자를 정리해 드립니다.
(키는 Claude의 비공개 메모리에 저장되어 있어 공개 저장소에는 노출되지 않습니다.)

## 응답 예시
```json
{
  "generatedAt": "2026-06-23T...",
  "totals": {
    "teachers": 3, "classes": 5, "students": 84,
    "tests": 12, "testResults": 210,
    "uniqueGuests": 47, "guestVisitLogs": 96
  },
  "daily": [
    { "date": "2026-06-23", "guests": 5, "newTeachers": 0, "newStudents": 2 }
  ]
}
```

## 전체 초기화 (위험)
```
POST https://wordday-backend.onrender.com/api/stats/admin/reset?key=<ADMIN_STATS_KEY>&confirm=RESET
```
- 모든 교사·학급·학생·단어장·단어·시험·결과·학습기록을 삭제합니다. **방문 통계(Visit)는 보존.**
- `confirm=RESET` 토큰이 없으면 거부(400). 비밀키 필수.
- 되돌릴 수 없습니다.

## 집계 동작 메모
- 게스트 방문은 프론트가 `POST /api/stats/visit` 로 익명 `visitorId`(localStorage)와 날짜를 보냄.
- `Visit` 테이블의 `@@unique([visitorId, date, kind])` 로 하루 1회만 기록 → 날짜별 row 수 = 그날 고유 방문자 수.
