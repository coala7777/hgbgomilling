# 한기부고 컴퓨터응용밀링기능사 CBT

정적 웹앱입니다. GitHub 저장소 `coala7777/hgbgomilling`에 이 폴더 안의 파일을 올린 뒤 Vercel에서 배포할 수 있습니다.

## 파일 구성

- `index.html`: 앱 화면
- `styles.css`: 반응형 디자인
- `app.js`: CBT 진행, 연습/실전 모드, 해설, 오답노트, 누적 기록, 대시보드
- `data/explanations.js`: 전체 문항 해설 데이터
- `data/question-ocr.json`: 문제 이미지 OCR 원문
- `tools/ocr.swift`, `tools/build-explanations.mjs`: 해설 데이터 재생성 도구
- `assets/exams/2014_1`: 2014년 1회차 문제 이미지
- `assets/exams/2014_2`: 2014년 2회차 문제 이미지
- `assets/exams/2014_3`: 2014년 3회차 문제 이미지
- `assets/exams/2014_4`: 2014년 4회차 문제 이미지

## 계정

- 학생 ID: `1101`~`1121`, `1201`~`1221`
- 학생 초기 PW: ID와 동일
- 교사용 ID/PW: `0000` / `0000`

교사용 계정은 로그인 후 바로 전체 대시보드로 이동합니다.

## Vercel 설정

GitHub 저장소 루트에 이 파일들이 바로 올라가 있다면:

- Framework Preset: `Other`
- Build Command: 비워둠
- Output Directory: 비워둠 또는 `.`

저장소 안에 `cbt_app` 폴더째로 올렸다면:

- Root Directory: `cbt_app`
- Framework Preset: `Other`
- Build Command: 비워둠
- Output Directory: 비워둠 또는 `.`

## 현재 저장 방식

Supabase 설정이 되어 있으면 실전 점수 기록, 연습/실전 학습시간, 접속 기록, 오답 통계가 Supabase에 저장됩니다.

`supabase-config.js`에 Supabase 프로젝트 값을 넣으세요.

```js
window.HGBGO_SUPABASE = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

Supabase SQL Editor에서 `supabase/schema.sql` 내용을 한 번 실행하면 필요한 테이블과 `mode` 컬럼이 만들어집니다. 기존 테이블이 있어도 실행할 수 있습니다.

설정값이 비어 있으면 개발 확인용으로 브라우저 `localStorage`에 저장됩니다.
