테스트 

1-1 테스트 유저 한 줄 (필수 컬럼만)
INSERT INTO `user` (nickname, provider) VALUES ('테스트유저', 'KAKAO');
SELECT user_id INTO @uid FROM `user` ORDER BY user_id DESC LIMIT 1;


1-2 Access 토큰 발급 → 만료 자동 +5분
INSERT INTO auth_account (user_id, provider, provider_uid, access_token)
VALUES (@uid, 'kakao', 'demo_uid_001', UNHEX('DEADBEEF'));

SELECT id, provider_uid, token_expires_at,
       TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), token_expires_at) AS sec_left
FROM auth_account
ORDER BY id DESC
LIMIT 1;   -- sec_left가 300 초면 정상


1-3 토큰 갱신(rotate) → 만료 재설정 +5분
UPDATE auth_account
SET access_token = UNHEX('FEEDFACE')
WHERE user_id=@uid AND provider='kakao' AND provider_uid='demo_uid_001';

SELECT id, token_expires_at,
       TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), token_expires_at) AS sec_left
FROM auth_account
WHERE user_id=@uid AND provider='kakao' AND provider_uid='demo_uid_001';
