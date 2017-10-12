var server = window.opener;
var clientLocation = "browser";
var game = {};
var name = randomHex();
var nickname = null;
var ID = null;
var character = {
	name: null, 
	race: null,
	age: null,
	color: null,
	gender: null,
	orientation: null,
	alignment: null,
}
var waitFor = []; // types of messages the client is currently prepared to receive


function randomHex() { // generates random hex between 000000 and ffffff, useful for generating unique IDs
	return ("000000" + Math.floor(Math.random()*16777215).toString(16)).substr(-6);
}

function augment(obj, properties){ //applies properties to an object
    for (var key in properties){
        obj[key] = properties[key]
    }
}

window.addEventListener("message", receiveMessage, false);

function sm(type, message) { //sends a message to the server
	var packet = {
		name: name,
		nickname: nickname,
		ID: ID,
		game: game.ID,
		type: type,
		data: message,
		sent: new Date().getTime(),
	}
	var JSONpacket = JSON.stringify(packet);
	server.postMessage(JSONpacket, "*");
	return JSONpacket;
}


function receiveMessage(event) {
	var m = JSON.parse(event.data);
	console.log(m);
	if (m.name == name) {
		if (m.type == "gameList") {
			ID = m.ID;
			switchTo('browser');
			listGames(m.data);
		}
		if (m.ID == ID) {
			if (m.type == "joinGame") {
				game.ID = m.data;
				switchTo('createCharacter');
			}
			
			if (m.type == "gameData") {
				augment(game, m.data);
				switchTo('game');
				updateGame();
			}
			
			if (m.type == "chatMessage") {
				if (document.getElementById("chat").innerHTML !== "") {
					document.getElementById("chat").innerHTML = document.getElementById("chat").innerHTML + "<br>" + m.data;
				} else {
					document.getElementById("chat").innerHTML = m.data;
				}
			}
			
		}
	} else {
		console.log("Error! Client name does not match!");
	}
}

function sendChat() {
	if (document.getElementById("textinput").value !== "") {
		var text = document.getElementById("textinput").value;
		document.getElementById("textinput").value = "";
		sm("chatMessage", text);
	}
}
			
function updateGame(info) { 
	document.getElementById("gametitle").innerHTML =  game.name;
	document.getElementById("gamedescription").innerHTML = "game status: " + game.status;
	function updateClientList() {
		var runningList = [];
			for (i=0; i < game.clientList.length; i++) {
				runningList.push("<div style='display: inline-block; color: " + game.party.characters[game.clientList[i]].color + "'>" + game.party.characters[game.clientList[i]].name + "</div>");
			}
			console.log(runningList);
		return runningList;
	}
	document.getElementById("clientlist").innerHTML = "client list: <br>" + updateClientList().join("<br>");
}


function switchTo(context) {
	var nicknameW = document.getElementById('nickname');
	var browserW = document.getElementById('browser');
	var createGameW = document.getElementById('createGame');
	var createCharacterW = document.getElementById('createCharacter');
	var interfaceW = document.getElementById('interface');
	function showNode(node) {
		node.style = "display: block";
	}
	function hideNode(node) {
		node.style = "display: none";
	}
	function blurNode(node) {
		node.style = "filter: blur(16px)";
	}
	function unblurNode(node) {
		node.style = "filter: none";
	}
	function hideAll() {
		hideNode(nicknameW);
		hideNode(browserW);
		hideNode(createGameW);
		hideNode(createCharacterW);
	}
	switch (context) {
		case 'browser':
			hideAll();
			showNode(browserW);
		break;
		case 'createGame':
			hideAll();
			showNode(createGameW);
		break;
		case 'createCharacter':
			hideAll();
			showNode(createCharacterW);
		break;
		case 'game':
			hideAll();
			unblurNode(interfaceW);
	}
}

function init() {
	var nick = document.getElementById('nicknameinput').value;
	if (nick !== "") {
		if (nick.length <= 32) {
			nickname = nick;
			sm("init", nickname);
		} else {
			alert('nickname must be 32 characters or less');
		}
	} else {
		alert('nickname cannot be blank');
	}
}

function listGames(gL) {
	var gLNode = document.getElementById('gameList');
	var list = [];
	if (typeof gL === 'object') {
		for (prop in gL) {
			list.push('<div class="item" id="' + prop + '"><div class="gametitle">' + gL[prop].name + '</div><div class="options"><button class="joingame" id=game' + prop + ' onclick="joinGame(\'' + prop + '\')">join</button></div></div>')
		}
		gLNode.innerHTML = list.join("");
	} else {
		alert('error: received game list is not an object')
	}
}

function createGame() {
	var gameName = document.getElementById('gamenameinput').value;
	var gameInfo = {
		rules: "these are some dummy rules",
	};
	if (gameName !== "") {
		if (gameName.length <= 120) {
			gameInfo.name = gameName;
			sm("createGame", gameInfo);
		} else {
			alert('nickname must be 32 characters or less');
		}
	} else {
		alert('nickname cannot be blank');
	}
}

function sendCharacter() {
	function collectInfo() {
		var chara = {};
		chara.name = document.getElementById('nameinput').value;
		chara.race = document.getElementById('raceinput').value;
		chara.age = Math.floor(document.getElementById('ageinput').value);
		chara.color = document.getElementById('colorinput').value;
		chara.gender = document.querySelector('input[name = "gender"]:checked').value;
		chara.orientation = document.querySelector('input[name = "orientation"]:checked').value;
		chara.alignment = [document.getElementById('aligninput1').value, document.getElementById('aligninput2').value];
		
		if (typeof chara.name !== 'string' || chara.name == "") {
			return "Please enter your name"
		}
		if (typeof chara.race !== 'string' || chara.race == "") {
			return "Please select your race"
		}
		if (chara.age < 0 || chara.age > 4 || isNaN(chara.age)) {
			return "Please input a valid age"
		}
		if (/^#[0-9A-F]{6}$/i.test(chara.color) !== true ) {
			return "Please select a valid color"
		}
		if (chara.gender !== "he" && chara.gender !== "she" && chara.gender !== "they") {
			return "Please select a valid gender"
		}
		if (chara.orientation !== "he" && chara.orientation !== "she" && chara.orientation !== "both" && chara.orientation !== "none") {
			return "Please select a valid interest"
		}
		if (Array.isArray(chara.alignment) !== true || isNaN(chara.alignment[0]) == true || isNaN(chara.alignment[1]) == true || (Math.abs(chara.alignment[0]) + Math.abs(chara.alignment[1])) > 2 ) {
			return "Please select a valid alignment"
		}
		character = chara;
		return true;
		
	}
	var valid = collectInfo();
	if (valid == true) {
		sm("characterData", character);
	} else {
		alert(valid);
	}
}

function newGame() {
	switchTo('createGame');
}

function joinGame(gameID) {
	sm("joinGame", gameID);
}


window.onunload = close;
function close() {
	sm("status", "close");
}
