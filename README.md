# Taxi App

## Taxi App 프로젝트 소개
- 유저는 출발지와 목적지를 입력하고, 유저의 배차 요청을 서버에 저장하며, 서버에서는 유저에게 택시를 배차해주는 기능이 포함

## 기능
- 핵심 기능
1. 지도 : 지도를 보여주고, 출발지, 도착지를 지정하는 용도
2. 콜 목록 : 내가 호출한 콜의 상태를 확인할 수 있는 페이지

- 다중 사용자 지원
1. 회원가입 : 사용자가 자신의 식별자(ID)를 등록하는 페이지
2. 로그인 : 사용자가 자신의 식별자를 사용할 수 있도록 인증하는 페이지

- 그 외 일반적인 앱이 가지고 있는 기능
1. 환경설정 : 로그아웃, 닉네임 설정 등의 기능이 나열된 페이지
2. 인트로 : 앱의 초기화 및 로그인 과정 스킵 여부를 결정하는 페이지

## Taxi App 화면 구성도
![diagram](https://github.com/user-attachments/assets/e790aed2-7b93-428d-b10f-37d4b3278948)

## 개발환경
1. Restful API 사용을 쉽게 하기 위한 라이브러리[서버] : `npm i -g express-generator` <br />
2. 서버 프로젝트 생성[서버] : `express taxi-server` <br />
3. mysql 인터페이스를 통해 MariaDB에 접근하기 위한 라이브러리[서버] : `npm i mysql` <br />
4. firebase 관련 라이브러리(푸시 알림 서비스 이용하기 위함)[서버] : `npm i firebase-admin` <br />