import db from '../db.js'; // DB 연결 설정

// 1. 친구 팔로우 / 언팔로우 토글 (POST /friends/follow)
export const updateFollowStatus = async (req, res) => {
    // 로그인한 유저 (나 = 팔로워)
    const followerId = req.user.user_id || req.user.id;
    
    // 프론트에서 보낸 데이터 (targetId = 친구 코드, action = 'FOLLOW' | 'UNFOLLOW')
    const { targetId: friendCode, action } = req.body;

    if (!friendCode || !action) {
        return res.status(400).json({ success: false, message: "친구 코드와 액션 정보가 필요합니다." });
    }

    const conn = await db.getConnection();

    try {
        // 1단계: 친구 코드(friend_code)로 상대방의 실제 user_id(PK) 찾기
        const [users] = await conn.query(
            `SELECT user_id, nickname FROM user WHERE friend_code = ?`, 
            [friendCode]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "존재하지 않는 친구 코드입니다." });
        }

        const followingId = users[0].user_id; // 팔로우 할 대상의 ID
        const followingNickname = users[0].nickname;

        // 2단계: 자기 자신을 팔로우하려는 경우 방지
        if (followerId === followingId) {
            return res.status(400).json({ success: false, message: "자기 자신은 팔로우할 수 없습니다." });
        }

        // 3단계: 액션에 따른 처리
        if (action === 'FOLLOW') {
            // 이미 팔로우 중인지 확인 (중복 방지)
            const [existing] = await conn.query(
                `SELECT follow_id FROM follow WHERE follower_id = ? AND following_id = ?`,
                [followerId, followingId]
            );

            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: "이미 팔로우한 사용자입니다." });
            }

            // 팔로우 정보 삽입
            await conn.query(
                `INSERT INTO follow (follower_id, following_id, created_at) VALUES (?, ?, NOW())`,
                [followerId, followingId]
            );

            res.status(200).json({ 
                success: true, 
                message: `${followingNickname}님을 팔로우했습니다.` 
            });

        } else if (action === 'UNFOLLOW') {
            // 팔로우 취소 (삭제)
            const [result] = await conn.query(
                `DELETE FROM follow WHERE follower_id = ? AND following_id = ?`,
                [followerId, followingId]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: "팔로우 상태가 아니어서 취소할 수 없습니다." });
            }

            res.status(200).json({ 
                success: true, 
                message: `${followingNickname}님 팔로우를 취소했습니다.` 
            });
        } else {
            res.status(400).json({ success: false, message: "유효하지 않은 액션입니다." });
        }

    } catch (error) {
        console.error("팔로우 상태 변경 실패:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    } finally {
        if (conn) conn.release(); // 커넥션 반환
    }
};

// 2. 친구 목록 조회 (GET /friends/list)
// (프론트 API fetchFriendsListAndUserId 에 대응)
export const getFriendsList = async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    try {
        // 2-1. 내 고유 친구 코드 조회
        const [me] = await db.query(`SELECT friend_code FROM user WHERE user_id = ?`, [userId]);
        const myUniqueId = me.length > 0 ? me[0].friend_code : null;

        // 2-2. 내가 팔로우하는 사람들 (Following) 조회
        // follow 테이블과 user 테이블을 JOIN하여 정보 가져오기
        const followingQuery = `
            SELECT 
                u.user_id AS id, 
                u.nickname, 
                u.friend_code AS uniqueId, 
                u.profile_image_url AS profileImageUri
            FROM follow f
            JOIN user u ON f.following_id = u.user_id
            WHERE f.follower_id = ?
        `;
        const [followingList] = await db.query(followingQuery, [userId]);

        // 2-3. 나를 팔로우하는 사람들 (Follower) 조회
        const followerQuery = `
            SELECT 
                u.user_id AS id, 
                u.nickname, 
                u.friend_code AS uniqueId, 
                u.profile_image_url AS profileImageUri
            FROM follow f
            JOIN user u ON f.follower_id = u.user_id
            WHERE f.following_id = ?
        `;
        const [followerList] = await db.query(followerQuery, [userId]);

        // 데이터 반환 구조 (프론트엔드 Types에 맞춤)
        res.status(200).json({
            success: true,
            data: {
                userUniqueId: myUniqueId, // 내 친구코드
                following: followingList, // 내가 추가한 친구들
                follower: followerList    // 나를 추가한 친구들
            }
        });

    } catch (error) {
        console.error("친구 목록 조회 실패:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    }
};