const express = require('express')
const app = express()
const port = 5000
const cookieParser = require('cookie-parser')

const config = require('./config/key')

const { User } = require('./models/User')

app.use(express.urlencoded( {extended : true } ));
app.use(express.json())
app.use(cookieParser())

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))

app.get('/', (req, res) => res.send('Hello world'))

app.post('/register', (req, res) => {
  const user = new User(req.body)
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err })
    return res.status(200).json({
      success: true
    })
  })
})

app.post('/login', (req, res) => {

  // 요청된 이메일을 데이터베이스에서 있는지 찾는다.
  User.findOne({ email: req.body.email }, (err, user) => {
    if(!user) {
      return res.json({
        loginSuccess: false,
        message: "입력한 이메일을 찾을수 없습니다."
      })
    }

    // 요청된 이메일이 데이터베이스에 있다면 비밀번호를 확인한다.
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch) return res.json( {loginSuccess: false, message: '비밀번호가 틀렸습니다.'} )

      // 비밀번호가 까지 맞다면 토큰을 생성하기.
      user.generateToken((err, user) => {
        if(err) return res.status(400).send(err);
        
        // 토큰을 저장한다. 어디에?? 쿠키, 로컬스토리지, 세션
        res.cookie("x_auth", user.token)
        .status(200)
        .json({ loginSuccess: true, userId: user._id })
      })
    })
  })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))