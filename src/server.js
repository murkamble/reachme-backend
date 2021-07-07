const express = require('express')
const connectDB = require('./config/db')
const env = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const socketServer = require('./utils/socketServer')
const { ExpressPeerServer } = require('peer')
const path = require('path')

// environment variable or you can say constants
const app = express()
env.config()
app.use(express.json())
app.use(cors())
app.use(cookieParser())

// mongoose Databases connection string
connectDB()

// Socket
const http = require('http').createServer(app)
const io = require('socket.io')(http)

io.on('connection', socket => {
    socketServer(socket)
})

// Create peer server
ExpressPeerServer(http, { path: '/' })

// Routes
app.use('/api', require('./routes/auth.router'))
app.use('/api', require('./routes/user.router'))
app.use('/api', require('./routes/post.router'))
app.use('/api', require('./routes/comment.router'))
app.use('/api', require('./routes/notify.router'))
app.use('/api', require('./routes/message.router'))


// 
// if(process.env.NODE_ENV === 'production'){
//     app.use(express.static('client/build'))
//     app.get('*', (req, res) => {
//         res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
//     })
// }

// Listing Port
http.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})