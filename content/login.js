//variable to identify the currently logged in user
let user_key = null;

(function () {

	//little function to check the response header of a request - prevents code repetition
	function parseResponse(response) {
		if (response.status == 401) {
			document.getElementById("private_msg").innerHTML = "";
			document.getElementById("private").style.display = "none";
			alert("Invalid username or password!");
			return null;
		}
		else {
			return response.json();
		}
	}

	function login() {
		// Make a key-value pair from the username & password elements & convert them to base 64 (needed for transmission to server)
		user_key = btoa(document.getElementById("name").value + ":" + document.getElementById("pass").value);

		const username = document.getElementById("name").value;
		const password = document.getElementById("pass").value;

		// nameP1 = document.getElementById("name").value;
		// nameP2 = document.getElementById("name").value;


			fetch("/login", {
				method: 'POST',
				headers: {
				  'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			  })
			  .then(response => {
				if (response.ok) {
					document.getElementById("name").value = "";
					document.getElementById("pass").value = "";		
					document.getElementById("login").style.display = "none";
					document.getElementById("letslogin").style.display = "none";
					document.getElementById("letsregister").style.display = "none";
					document.getElementById("register").style.display = "none";
					document.getElementById("winRecords").style.display = "block";
					document.getElementById("title").style.display = "none";
					document.getElementById("gameContainer").style.display = "grid";
					document.getElementById("menu").style.display = "grid";
					document.getElementById("logout_button").style.display = "block";
				} else {
				  console.log("fail to login")
				}
			  });
	}

	function getID(){

		// Send login request to the server
		fetch('/getId', { method: 'POST' })
			.then(response => {
				if (response.ok) {
					return response.json();
				} 
			})
			.then(data => {
				// get id from server
				playerId = data.playerId;
				// assign player id
				if (playerId === 1) {
					player1();
				} else if (playerId === 2) {
					player2();
				} 
			})
	}


	function player1() {
		fetch("/player1", {
			method: 'GET',
			headers: { "Authorization": "Basic " + user_key }
		})
			.then(res => parseResponse(res))
			.then(jsn => {
				if (jsn && jsn.msg) {
					const username = jsn.msg.split(': ')[1];
					nameP1 = username;
					document.getElementById("private").style.display = "block";
					document.getElementById("private_msg").innerHTML = jsn.msg;
					// document.getElementById("menu").style.display = "grid";
				}
			});
	}

	function player2() {
		fetch("/player2", {
			method: 'GET',
			headers: { "Authorization": "Basic " + user_key }
		})
			.then(res => parseResponse(res))
			.then(jsn => {
				if (jsn && jsn.msg) {
					const username = jsn.msg.split(': ')[1];
					nameP2 = username;
					document.getElementById("private").style.display = "block";
					document.getElementById("private_msg").innerHTML = jsn.msg;
					// document.getElementById("menu").style.display = "grid";
				}
			});
	}
	


	//handler for the logout button
	function logout() {
		fetch("/logout", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			// body: JSON.stringify({ playerId: playerId })
		}).then(() => {
			//just clear the user key - if we were doing something smarter on the server we would need to tell it to log the user out too
			user_key = null;
			document.getElementById("name").value = "";
			document.getElementById("pass").value = "";		
			document.getElementById("login").style.display = "block";
			document.getElementById("letslogin").style.display = "block";
			document.getElementById("winRecords").style.display = "none";
			document.getElementById("private_msg").style.display = "none";
			document.getElementById("title").style.display = "block";
			document.getElementById("gameContainer").style.display = "none";
			document.getElementById("menu").style.display = "none";
			document.getElementById("logout_button").style.display = "none";
			
			
			if (playerId === 1) {
				nameP1 = "Player 1";
			} else if (playerId === 2) {
				nameP2 = "Player 2";
			}
		});
	}



	//when the page loads
	document.addEventListener('DOMContentLoaded', function() {
		document.getElementById("login_button").addEventListener('click', login);
		document.getElementById("login_button").addEventListener('click', getID);
		document.getElementById("logout_button").addEventListener('click', logout);
		document.getElementById("private").style.display = "none";
	});

})();