const socket = io()

// Elements
const $messageForm = document.querySelector('#msg-form') 
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocBtn = document.querySelector('#send-location')
const $msgDiv = document.querySelector('#chat-msg')

// Templates
const msgTemplate = document.querySelector('#msg-template').innerHTML
const locMsgTemplate = document.querySelector('#loc-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () =>{
	// New Message element
	const $newMessage = $msgDiv.lastElementChild

	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	const visibleHeight = $msgDiv.offsetHeight

	const containerHeight = $msgDiv.scrollHeight
    
	const scrollOffset = $msgDiv.scrollTop + visibleHeight
	//console.log(scrollOffset)
	if(containerHeight - newMessageHeight <= scrollOffset){
		$msgDiv.scrollTop = $msgDiv.scrollHeight
	}
}

socket.on('CountUpdate', (count)=>{
	console.log('Count has been updated',count)
})



socket.on('message', (msg)=>{
	const html = Mustache.render(msgTemplate,{
		username : msg.username,
		message : msg.text,
		createdAt : moment(msg.createdAt).format('h:mm a') 
	})
	$msgDiv.insertAdjacentHTML('beforeend',html)
	autoScroll()
})

socket.on('roomData',({room, users}) =>{
	const html = Mustache.render(sidebarTemplate,{
		room,
		users
	})
	document.querySelector('#chat-sidebar').innerHTML = html
})

socket.on('locationMessage', (url)=>{
	const html = Mustache.render(locMsgTemplate,{
		username : msg.username,
		url : url.text,
		createdAt : moment(url.createdAt).format('h:mm a')
	})
	$msgDiv.insertAdjacentHTML('beforeend',html)
	autoScroll()
})

$messageForm.addEventListener('submit',(e) =>{
	e.preventDefault()
	$messageFormButton.setAttribute('disabled', 'disabled')
	const msg = e.target.elements.msg.value
	socket.emit('sendMessage',msg, (error) =>{
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus()
		if(error){  
			return console.log(error)
		}
	})
})

document.querySelector('#send-location').addEventListener('click', (e) =>{
	if(!navigator.geolocation){
		return alert('Geolocation is not supported on your browser')
	}
	$sendLocBtn.setAttribute('disabled','disabled')
	navigator.geolocation.getCurrentPosition((position) =>{
		socket.emit('sendLocation',{
			latitude : position.coords.latitude,
			longitude : position.coords.longitude
		},(error) =>{
			console.log('Location Shared')
			$sendLocBtn.removeAttribute('disabled')
		})

	})
})

socket.emit('join',{username,room}, (error) => {
	if(error){
		alert(error)
		location.href = '/'
	}
})


