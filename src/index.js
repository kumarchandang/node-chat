const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genMsg } = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirPath = path.join(__dirname, '../public')
app.use(express.static(publicDirPath))

let count = 0
io.on('connection', (socket) => {

	socket.on('join',(options , callback) =>{
		const {error,user} = addUser({id : socket.id, ...options })
		if(error){
			return callback(error)
		}
		console.log(user)
		socket.join(user.room)
		socket.emit('message', genMsg('Admin',`Welcome ${user.username} !`))
		socket.broadcast.to(user.room).emit('message',genMsg('Admin',`${user.username} has joined your room`))
		
		io.to(user.room).emit('roomData',{
			room : user.room,
			users : getUsersInRoom(user.room)
		})

		callback()
	})


	socket.on('sendMessage',(msg,callback) =>{
		const user = getUser(socket.id)
		const filter = new Filter()
		if(filter.isProfane(msg)){
			return callback('This word is not allowed')
		}
		io.to(user.room).emit('message',genMsg(user.username,msg))
		callback()
	})

	socket.on('sendLocation',(coords,callback) =>{
		const user = getUser(socket.id)
		io.to(user.room).emit('locationMessage',genMsg(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
		callback()
	})

	socket.on('disconnect',()=>{
		const user = removeUser(socket.id)
		if(user) {
			io.to(user.room).emit('message',genMsg('Admin', `${user.usename} has left!`))
			io.to(user.room).emit('roomData',{
				room : user.room,
				users : getUsersInRoom(user.room)
			})
		}
		
		
	})

})

server.listen(port, () => {
	console.log(`Server is runnnin on port : ${port}`)
}) 