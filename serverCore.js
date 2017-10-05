var clientList = {}; // object containing clients
var game = null; // will eventually be an object containing the game info

window.addEventListener("message", receiveMessage, false); //waits for messages and calls receiveMessage when it receives one, passing on the event as its parameters

function receiveMessage(event) { //accepts the message event as parameters and deals with the message accordingly
	var m = JSON.parse(event.data);
	
	if (m.type == "status" && m.data == "init") { //if the client sends the server a status message saying that it wishes to initialize
		clientList[m.name] = { //creates object in client list with the client's name and the following properties
			name: m.name, //unique ID
			location: "lobby", //current location
			lastMessage: m.data.sent, //most recent message date
			source: event.source //source, used as a target when sending messages
		}; 
		
		console.log("initialized %c" + m.name, "color: #" + m.name); //prints to the console "initialized {clientName}" with {clientName} being uniquely colored.
		
		if (game === null) { //if no game exists
			createGame(m.name); //I think you know what this does
		} else {
			game.clientList.push(clientList[m.name].name); //if a game does exist, add this new client to the game
		}
		cm("joinGame", game.ID, m.name); //tell the client which game it just joined 
	}
	
	if (clientList[m.name]) { //if the client is already on the client list
		clientList[m.name].lastMessage = m.data.sent; //set its last message date to this one
		
		if (m.type == "chatMessage") { //if it's a chat message
			var newMessage = "<div class='message'><div class='chatname' style='color: #" + m.name + "'>" + m.name + ":</div><div class='messagebody'>" + m.data + "</div></div>"; //format chat item
			console.log(m.name + ": %c" + m.data, "color: #" + m.name); //log to console
			game.chat.push(newMessage); //add to chat message array
			document.getElementById("console").innerHTML = game.chat.join("<br>"); //update current chat display
			broadcast("chatMessage", newMessage); //send latest message to all clients
		}
		
		if (m.type == "request") {
			console.log(m.name + " requested game data from game " + m.data);
			updateGame(); //now that the client has joined, update connected clients with current game data
		}
		
		if (m.type == "status" && m.data == "close") { //if the client wants to close its connection
			delete clientList[m.name]; //delete client from list
			game.clientList.splice(game.clientList.indexOf(m.name), 1) // deletes client from game info
			console.log("closed %c" + m.name, "color: #" + m.name);
			updateGame();
		}
	}
}

function cm(type, message, target) { //sends message to a specific client
	var packet = {
		name: target,
		type: type,
		data: message,
		sent: new Date().getTime(),
	}
	var JSONpacket = JSON.stringify(packet); //puts data in JSON format
	clientList[target].source.postMessage(JSONpacket, "*"); //sends JSON-ified message to specific client
}

function tellAll() { //sends text message to all clients, for testing purposes mostly
	if (document.getElementById("textinput").value !== "") { //if the input isn't empty
		var newMessage = "<div class='message' style='background: #000; color: #fff'><div class='chatname'>SERVER:<div class='messagebody'>" + document.getElementById("textinput").value + "</div></div>" //format message
		document.getElementById("textinput").value = ""; //clear input field
		game.chat.push(newMessage); //add to chat message array
		document.getElementById("console").innerHTML = game.chat.join("<br>"); //update console
		broadcast("chatMessage", newMessage); //send message to all clients
	}
}

function broadcast(type,data) { //sends a message to all clients
	for (prop in clientList) {
		cm(type, data, prop);
	}
}


function addClient() {
	window.open("./client.html", "_blank", "toolbar=0,location=0,menubar=0");
}

function closeclientList() { //if the server closes, close the clients too
	for (client in clientList) {
		clientList[client].source.close();
	}
}

window.onunload = closeclientList; //calls above function if window is unloaded 


function createGame(cl) { //creates a game
	game = {
		ID: ("000000" + Math.floor(Math.random()*16777215).toString(16)).substr(-6), //random 6-digit hex ID, just because
		clientList: [cl], //populates array with the creator of the game
		status: "lobby", //you can read
		turn: 0, //ditto
		chat: [], // chat history
	} 
	return game.ID; //returning the game's ID isn't currently used for anything, but could be useful
}

function updateGame(info) { //updates game info across all clients and updates server display
	broadcast("gameData", game);
	document.getElementById("gametitle").innerHTML = "game title: " + game.ID;
	document.getElementById("gamedescription").innerHTML = "game status: " + game.status;
	document.getElementById("clientlist").innerHTML = "client list: <br>" + game.clientList.join("<br>");
}
