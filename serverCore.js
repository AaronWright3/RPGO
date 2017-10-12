var clientList = {}; // object containing clients
var gameList = {};

function randomHex() {
	return ("000000" + Math.floor(Math.random()*16777215).toString(16)).substr(-6);
}

function augment(obj, properties){
    for (var key in properties){
        obj[key] = properties[key]
    }
}

function game(ID, name, creator, rules) { //creates a game
	this.name = name;
	this.ID = ID;
	this.host = creator;
	this.clientList = [];
	this.status = "setup";
	this.publicProperties = {
		round: 0,
		turn: 0,
		space: 0,
	};
	this.privateProperties = {};
	this.chat = [];
	this.party = {
			characters: {},
			publicProperties: {},
			privateProperties: {},
		};
	this.rules = rules;
	this.getData = function(){ //returns client-friendly game data
		return {
			name: this.name,
			ID: this.ID,
			clientList: this.clientList,
			status: this.status,
			properties: this.publicProperties,
			chat: this.chat,
			party: {
				characters: this.party.characters,
			},
			rules: this.rules,
		}
	};
}

function createGame(name, rules, creator) {
	var ID = randomHex();
	gameList[ID] = new game(ID, name, creator, rules)
	return ID;
}


window.addEventListener("message", receiveMessage, false);


function cm(type, message, target) { //sends message to a specific client
	var packet = {
		name: clientList[target].name,
		location: clientList[target].location,
		ID: target,
		type: type,
		data: message,
		sent: new Date().getTime(),
	}
	console.log("packet:", packet);
	var JSONpacket = JSON.stringify(packet); //puts data in JSON format
	clientList[target].source.postMessage(JSONpacket, "*"); //sends JSON-ified message to specific client
}

function receiveMessage(event) { //accepts the message event as parameters and deals with the message accordingly
	var m = JSON.parse(event.data);
	console.log(m);
	function addClient() {
		var privateID = randomHex(); //generates unique ID for the client
		clientList[privateID] = { //creates object in client list with the client's name and the following properties
			name: m.name, //internal client name
			nickname: m.nickname,
			ID: privateID, // unique ID
			game: null,
			location: "lobby",
			lastMessage: m.data.sent, //most recent message date
			source: event.source, //source, used as a target when sending messages
			joinTime: m.data.sent,
		}; 
		console.log("initialized %c" + m.name, "color: #" + m.name);
		return privateID;
	}
	
	if (m.type == "init" && m.data == m.nickname) {
		var newID = addClient();
		cm("gameList", gameList, newID);
	}
	
	if (clientList[m.ID]) { //if the client is already on the client list
		clientList[m.ID].lastMessage = m.data.sent; //set its last message date to this one
		
		if (m.type == "createGame") {
			gameID = createGame(m.data.name, m.data.rules, m.ID);
			cm("joinGame", gameID, m.ID);
		}
		
		if (m.type == "joinGame" && gameList[m.data]) {
			cm("joinGame", gameID, m.ID);
		}
		
		if (gameList[m.game]) { //if referenced game actually exists
			var game = gameList[m.game];
			if (m.type == "characterData") { //if the client sends the server a status message saying that it wishes to join
				console.log("characterData");
					if (game.clientList.indexOf(m.name) == -1) {
						if ((game.status == "setup" && game.host == m.ID) || game.status == "lobby") { //|| game.status == "lobby") && game.clientList.indexOf(m.name) == -1
							game.clientList.push(m.name);
							game.party.characters[m.name] = m.data;
							clientList[m.ID].location = game.ID;
							if (game.status = "lobby") {
								updateGame(game);
							};
							if (game.status == "setup") {
								game.status = "lobby";
							}
							cm("gameData", game.getData(), m.ID);
						}
					} else if (game.status == "running") {
						cm("error", "game is already in progress", m.ID)
					} else if (game.clientList.indexOf(m.name) !== -1) {
						cm("gameData", game.getData(), m.ID);
					}
			}
		
			if (m.type == "chatMessage") { //if it's a chat message
			var newMessage = "<div class='message'><div class='chatname' style='color: " + game.party.characters[clientList[m.ID].name].color + "'>" + clientList[m.ID].nickname + " (" + game.party.characters[clientList[m.ID].name].name + "):</div><div class='messagebody'>" + m.data + "</div></div>"; //format chat item
				console.log(+ clientList[m.ID].nickname + " (" + game.party.characters[clientList[m.ID].name].name + "): %c" + m.data, "color: " + game.party.characters[clientList[m.ID].name].color ); //log to console
				addToChat(game, newMessage);
			}
		}
		
		if (m.type == "status" && m.data == "close") { //if the client wants to close its connection
			if (gameList[m.game]) {
				var game = gameList[m.game]
				delete game.party.characters[clientList[m.ID].name];
				game.clientList.splice(game.clientList.indexOf(clientList[m.ID].name), 1) // deletes client from game info
				updateGame(game);
			}
			delete clientList[m.ID]; //delete client from list
		}
	}
}

function tellAll() { //sends text message to all clients, for testing purposes mostly
	if (document.getElementById("textinput").value !== "") { //if the input isn't empty
		var newMessage = "<div class='message' style='background: #000; color: #fff'><div class='chatname'>SERVER:<div class='messagebody'>" + document.getElementById("textinput").value + "</div></div></div>" //format message
		document.getElementById("textinput").value = ""; //clear input field
		game.chat.push(newMessage); //add to chat message array
		document.getElementById("console").innerHTML = game.chat.join("<br>"); //update console
		broadcast("chatMessage", newMessage); //send message to all clients
	}
}

function addToChat(g, message) {
			g.chat.push(message); //add to chat message array
			document.getElementById("console").innerHTML = g.chat.join("<br>"); //update current chat display
			broadcast("chatMessage", message, g.ID); //send latest message to all clients
}

function broadcast(type,data, gID) { //sends a message to all clients
	console.log(type, data, gID);
	if (!gID) {
		for (prop in clientList) {
			cm(type, data, prop);
		}
	} else {
		for (prop in clientList) {
			if (gameList[gID].clientList.indexOf(clientList[prop].name) !== -1) {
				cm(type, data, prop);
			}
		}
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

function updateGame(g, info) { //updates game info across all clients and updates server display
	broadcast("gameData", g.getData(), g.ID);
}
