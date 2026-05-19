# 한기부고 컴퓨터응용밀링기능사 CBT

정적 웹앱입니다. GitHub 저장소 `coala7777/hgbgomilling`에 이 폴더 안의 파일을 올린 뒤 Vercel에서 배포할 수 있습니다.

## 파일 구성

- `index.html`: 앱 화면
- `styles.css`: 반응형 디자인
- `app.js`: CBT 진행, 채점, 오답노트, 누적 기록, 대시보드
- `assets/questions`: 2014년 1회차 예제문제 이미지

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

점수 기록은 브라우저 `localStorage`에 저장됩니다. 여러 학생의 점수를 한 교사용 대시보드로 모으려면 Firebase/Firestore 연동이 필요합니다.
