// Global Variables
var p1 = null;
var p2 = null;
var player1Name = "";
var player2Name = "";
var playerName = "";
var player1Choice = "";
var player2Choice = "";
var turn = 1;

// Initialize Firebase
var config = {
	apiKey: "AIzaSyDt46wQPA8p0c0ICHhpEPlKUkiCCiuZDiw",
	authDomain: "rps-multiplayer-bd7b8.firebaseapp.com",
	databaseURL: "https://rps-multiplayer-bd7b8.firebaseio.com",
	projectId: "rps-multiplayer-bd7b8",
	storageBucket: "rps-multiplayer-bd7b8.appspot.com",
	messagingSenderId: "737200984789"
};
firebase.initializeApp(config);
// Get a reference to the database service
var database = firebase.database();


// Player 1 and Player2 Existing check
database.ref('/players/').on('value', function (snapshot) {
	// Player1
	if (snapshot.child('p1').exists()) {
		p1 = snapshot.val().p1;
		player1Name = p1.name;
		$('#playerOneName').text(player1Name);
		$('#result1').html('Win: ' + p1.win + ', Loss: ' + p1.loss + ', Tie: ' + p1.tie);
	}
	else {
		p1 = null;
		player1Name = "";
		$('#playerOneName').text('Waiting for Player 1 Name');
		$('#playerPanel1').removeClass("playerPanelTurn");
		$('#playerPanel2').removeClass("playerPanelTurn");
		database.ref().child('/outcome/').remove();
		$("#roundOutcome").html('Rock-Paper-Scissors');
		$('#note').html('');
		$('#result1').html('Win: 0, Loss: 0, Tie: 0');
	}
	// player2
	if (snapshot.child('p2').exists()) {
		p2 = snapshot.val().p2;
		player2Name = p2.name;
		$('#playerTwoName').text(player2Name);
		$('#result2').html('Win: ' + p2.win + ', Loss: ' + p2.loss + ', Tie: ' + p2.tie);
	}
	else {
		p2 = null;
		player2Name = "";
		$('#playerTwoName').text('Waiting for Player 2 Name');
		$('#playerPanel1').removeClass('playerPanelTurn');
		$('#playerPanel2').removeClass('playerPanelTurn');
		database.ref().child('/outcome/').remove();
		$("#roundOutcome").html('Rock-Paper-Scissors');
		$('#note').html('');
		$('#result2').html('Win: 0, Loss: 0, Tie: 0');
	}


	if (p1 && p2) {
		$('#playerPanel1').addClass('playerPanelTurn');
		$('#note').html('Waiting on ' + player1Name + ' to choose...');
	}

	// If both players leave the game, empty the chat session
	if (!p1 && !p2) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref().child('/outcome/').remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("Rock-Paper-Scissors");
		$('#note').html('');
	}

});	  // End of database.ref().child('/players/').on('value', function(snapshot) {})			


database.ref('/players').on('child_removed', function (snapshot) {
	var msg = snapshot.val().name + " has disconnected!";
	var chatKey = database.ref().child('/chat/').push().key;
	database.ref('/chat/' + chatKey).set(msg);
});


database.ref('/chat/').on('child_added', function (snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	// Change the color of the chat message depending on user or connect/disconnect event
	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("chatColorDisconnected");
	}
	else if (chatMsg.includes("joined")) {
		chatEntry.addClass("chatColorJoined");
	}
	else if (chatMsg.startsWith(playerName)) {
		chatEntry.addClass("chatColor1");
	}
	else {
		chatEntry.addClass("chatColor2");
	}

	$("#chatDisplay").append(chatEntry);
	$("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});




database.ref('/turn/').on('value', function (snapshot) {

	if (snapshot.val() === 1) {
		turn = 1;
		if (p1 && p2) {
			$('#playerPanel1').addClass('playerPanelTurn');
			$('#playerPanel2').removeClass('playerPanelTurn');
			$('#note').html('Waiting on ' + player1Name + 'to choose...');
		}
	}
	else if (snapshot.val() === 2) {
		turn = 2;
		if (p1 && p2) {
			$('#playerPanel1').removeClass('playerPanelTurn');
			$('#playerPanel2').addClass('playerPanelTurn');
			$('#note').html('Waiting on ' + player2Name + 'to choose...');
		}
	}
});



database.ref('/outcome/').on('value', function (snapshot) {
	$('#roundOutcome').html(snapshot.val());
});



// Attach an event handler to the "Submit" button to add a new user to the database
$('#nameInput').on('click', function (event) {
	event.preventDefault();

	// First, make sure that the name field is non-empty and we are still waiting for a player
	if (($("#name-input").val().trim() !== "") && !(p1 && p2)) {
		// Adding player1
		if (p1 === null) {
			playerName = $('#name-input').val().trim();
			p1 = {
				name: playerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};
			database.ref().child('/players/p1').set(p1);
			database.ref().child('/turn').set(1);
			database.ref('/players/p1').onDisconnect().remove();
		}

		else if ((p1 !== null) && (p2 === null)) {
			playerName = $('#name-input').val().trim();
			p2 = {
				name: playerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};
			database.ref().child('/players/p2').set(p2);
			database.ref('/players/p2').onDisconnect().remove();
		}

		var msg = playerName + ' has joined!';
		var chatKey = database.ref().child('/chat/').push().key;
		database.ref('/chat/' + chatKey).set(msg);
		$('#name-input').val("");
	}
});


$('#chat-send').on('click', function (event) {
	event.preventDefault();
	if ((playerName !== "") && ($('#name-input').val().trim() !== "")) {
		var msg = playerName + ': ' + $('#name-input').val().trim();
		$('#name-input').val("");
		var chatKey = database.ref().child('/chat/').push().key;
		database.ref('/chat/' + chatKey).set(msg);
	}
});


$('#playerPanel1').on('click', '.panelOption', function (event) {
	event.preventDefault();

	if (p1 && p2 && (playerName === p1.name) && (turn === 1)) {
		var choice = $(this).text().trim();
		player1Choice = choice;
		database.ref().child('/players/p1/choice').set(choice);
		turn = 2;
		database.ref().child('/turn').set(2);
	}
});



$('#playerPanel2').on('click', '.panelOption', function (event) {
	event.preventDefault();

	if (p1 && p2 && (playerName === p2.name) && (turn === 2)) {
		var choice = $(this).text().trim();
		player2Choice = choice;
		database.ref().child("/players/p2/choice").set(choice);
		compareFunction();
	}
});


function compareFunction() {
	if (p1.choice === "Rock") {
		if (p2.choice === "Rock") {
			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		}

		else if (p2.choice === "Paper") {
			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		}

		else {
			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		}

	}
	else if (p1.choice === "Paper") {
		if (p2.choice === "Rock") {

			database.ref().child("/outcome/").set("Paper wins!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		}
		else if (p2.choice === "Paper") {


			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		}
		else {
			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		}

	}
	else if (p1.choice === "Scissors") {
		if (p2.choice === "Rock") {
			database.ref().child("/outcome/").set("Rock wins!");
			database.ref().child("/players/p1/loss").set(p1.loss + 1);
			database.ref().child("/players/p2/win").set(p2.win + 1);
		}
		else if (p2.choice === "Paper") {

			database.ref().child("/outcome/").set("Scissors win!");
			database.ref().child("/players/p1/win").set(p1.win + 1);
			database.ref().child("/players/p2/loss").set(p2.loss + 1);
		}
		else {
			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/p1/tie").set(p1.tie + 1);
			database.ref().child("/players/p2/tie").set(p2.tie + 1);
		}

	}

	// Set the turn value to 1, as it is now player1's turn
	turn = 1;
	database.ref().child('/turn').set(1);
}
