# Bapple 밥플

<div align="center">
  <img src="https://github.com/hei-sso/Bapple/blob/main/Frontend/assets/images/splash-icon.png" alt="Bapple Logo" width="250" />
</div>

## 📘 개요
Bapple은 사용자의 냉장고에 남아있는 식재료를 기반으로 AI가 맞춤형 레시피를 추천해 주는 모바일 애플리케이션입니다.\
TensorFlow 기반 AI 모델과 FastAPI를 활용하여, 사용자가 가진 재료에 맞는 요리 아이디어를 빠르게 제공합니다.

## 🧩 주요 기능
- Kakao API 연동으로 간편 로그인 가능
- 사용자가 가진 식재료 추가 및 삭제 기능
- AI 기반 레시피 추천
- 추천 레시피 상세 정보 제공 (재료, 조리 방법, 시간 등)
- 직관적인 모바일 UI

## 📦 기술 스택
- **Frontend**: React Native (Expo), TypeScript
- **Backend/Server**: Node.js (Express.js), REST API
- **AI/ML**: Python, FastAPI, TensorFlow
- **DB**: MySQL

## 📝 Developer Notes (참고용)
> 브랜치 설명 및 유의사항

### main 
- **목적**: 프로덕션 배포용 안정 버전
- **설명**: 기능이 완성되어 검증을 마친 후, `Dev` 브랜치에서 Merge됩니다.

### Dev
- **목적**: 개발 및 기능 구현
- **설명**: Dev 브랜치는 새로운 기능이나 수정 사항이 포함되어 있으며, 실험적인 변경이 포함될 수 있습니다.

🚨 각 Dev 브랜치 수정 전에 main에서 pull하기 (2026.01.07)
