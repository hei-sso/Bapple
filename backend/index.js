const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

const PORT = process.env.PORT || 3000; // Railway가 주는 포트 사용

app.use(cors()); // 모든 접근 허용 (앱 통신 위함)
app.use(bodyParser.json()); // JSON 형태의 요청 본문 파싱

app.get('/', (req, res) => {
  res.send('Backend Server 가동 중');
});

app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});