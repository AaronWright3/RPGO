var server = window.opener;
var game = {ID: null};
var clientName = null;

window.addEventListener("message", receiveMessage, false);

function sm(type, message) {
	var packet = {
		name: clientName,
		game: game.ID,
		type: type,
		data: message,
		sent: new Date().getTime(),
	}
	var JSONpacket = JSON.stringify(packet);
	server.postMessage(JSONpacket, "*");
}

function loadGame(gameID) {
	game = {
		ID: gameID,
		status: "loading",
	}
	sm("request", game.ID);
}

function receiveMessage(event) {
	var m = JSON.parse(event.data);
	if (m.name == clientName) {
	
		if (m.type == "joinGame") {
			console.log("SERVER: joined game " + m.data);
			loadGame(m.data);
			document.getElementById("userinfo").innerHTML = "joined as " + "<div style='display: inline-block; color: #" + clientName + "'>" + clientName + "</div>";
			document.getElementById('login').remove();
			document.getElementById('interface').style = "filter: none !important";
		} else if (m.type == "gameData") {
			game = m.data;
			document.getElementById("chat").innerHTML = game.chat.join("<br>");
			updateGame();
			console.log("Game data received: ", m.data);
		} else if (m.type == "chatMessage") {
			if (document.getElementById("chat").innerHTML !== "") {
				document.getElementById("chat").innerHTML = document.getElementById("chat").innerHTML + "<br>" + m.data;
			} else {
				document.getElementById("chat").innerHTML = m.data;
			}
		}
		
	} else {
		console.log("Error! Client name does not match!");
	}
}

function sendMessage() {
	if (document.getElementById("textinput").value !== "") {
		var text = document.getElementById("textinput").value;
		document.getElementById("textinput").value = "";
		sm("chatMessage", text);
	}
}
			
function updateGame(info) { //updates game info across all clients and updates server display
	document.getElementById("gametitle").innerHTML = "game title: " + game.ID;
	document.getElementById("gamedescription").innerHTML = "game status: " + game.status;
	document.getElementById("clientlist").innerHTML = "client list: <br>" + game.clientList.join("<br>");
}

function init() {
	clientName = document.getElementById('nameinput').value;
	document.getElementById('nameinput').value = "";
	sm("status", "init");
}

window.onunload = close;
function close() {
	sm("status", "close");
}
