function login(){
	let Username = document.getElementById("Username").value;
	let Password = document.getElementById("Password").value;

	const Body = {Username,Password}
	
	let req = new XMLHttpRequest();
	
	req.onreadystatechange = function () {
	if (this.readyState==4 && this.status==200) {
		alert("Succesfully Logged-In.\n Redirecting to home page.\n");
			window.location = "/users";
	}
	else if(this.readyState==4 && this.status==401) {
        if (this.responseText == "Invalid password"){
            document.getElementById("Err").innerHTML = "Incorrect Password";
        }
        if (this.responseText == "Invalid username"){
        document.getElementById("UserErr").innerHTML = "Incorrect Username";
        }
        else{
            document.getElementById("UserErr").innerHTML = "";
        }

        if (this.responseText == "Invalid credentials" && "Invalid credentials pass"){
            document.getElementById("Err").innerHTML = "Incorrect Password";
            document.getElementById("UserErr").innerHTML = "Incorrect Username";
        }
        
    }
    };
	req.open("POST", "/login", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify(Body));
}


function register(){
	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;

	const Body = {username,password}
	
	let req = new XMLHttpRequest();
	
	req.onreadystatechange = function () {
	if (this.readyState==4 && this.status==200) {
		alert("Succesfully Registered.\n");
			window.location = "/users";
	}
	else if(this.readyState==4 && this.status==401) {
        if (this.responseText == "Username taken"){
            document.getElementById("regErr").innerHTML = "Username taken";
        }
    }
    };
	req.open("POST", "/register", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify(Body));
}

function search(){
    let search = document.getElementById("search").value;
    // console.log(search)

    let req = new XMLHttpRequest();
	let params = "/?username=" + search;
    url = "/users"+params
    req.open("GET", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.send();

    req.onreadystatechange = function () {
        if (this.readyState==4 && this.status==200) {
            let sea = JSON.parse(this.responseText);
            let list = document.getElementById("result");
            list.innerHTML = "<h1>Results</h1>";
            console.log(sea.privacy);
            for (let i = 0; i < sea.length; i++){
                let users = sea[i];
                if(!users.privacy){
                    let seaElement = document.createElement("li");
                    let seaData = document.createElement("a");
                    seaData.className = "users";
                    seaData.innerText = users.username;
                    seaData.href = "http://localhost:3000/users/" + users._id;
                    seaElement.appendChild(seaData);
                    list.appendChild(seaElement);
                }
                else{
                    console.log("no");
                }
            }
        }
        
        };
}
function save(){
    let selected = document.getElementById("on").checked;
    let privacy;
    if (selected){
        privacy = true;
    }
    else{
        privacy = false;
    }
    console.log(privacy);

    let req = new XMLHttpRequest();
	
	req.onreadystatechange = function () {
	if (this.readyState==4 && this.status==200) {
		alert("Success");
			// window.location = "/users";
	}
	else if(this.readyState==4 && this.status==401) {
        alert("error")
    }
    };
    let userid = document.getElementById("profile");
	req.open("POST", "/users/"+userid, true);
	req.setRequestHeader("Content-Type", "application/json");
	req.send(JSON.stringify({privacy: privacy}));
}
