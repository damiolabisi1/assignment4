const express = require('express');
const app = express();
const session = require('express-session');
const MongoDBStore = require('connect-mongo');

//creates a new connection
const store = new MongoDBStore({
    mongoUrl: 'mongodb://localhost/a4',
    collection: 'sessions'
})
store.on('error',(error) => {console.log(error)});

let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
app.use(express.static("public"));
app.use(express.json())
app.use(session({ 
    secret: 'some secret key here', 
    store: store,
    resave: true, 
    saveUninitialized:false
})
);
app.set("views");
app.set("view engine", "pug");

app.use(function(request,response,next){
    console.log(`${request.method} for ${request.url}`);
    next();
})
app.use(exposeSession);
function exposeSession(req,res,next){
    if (req.session){
        res.locals.session = req.session;
        next();
    }

}
//provides a response containing the HTML for the home page
app.get(["/","/home"], (request,response) => {
	response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
	response.render("home")
});

/**  provides a response containing the HTML for the users page
  with a list of all users not private in the database */
app.get(["/users"], (request,response) => {
    let search = request.query.username;
    if (search == null){
        db.collection("users").find({}).toArray(function(err, data){    
            if(err) throw err;
            let user = data;

            response.status(200).render("users",{user});
            return;
        });
    }
            
    else if (search =! null){ 
        const d = db.collection("users").find({
           "username": {
                $regex: request.query.username, 
                "$options": "i"
            }
        })
        d.toArray(function(err, data){
            let users = data;
            if (err){
                throw err;
            }
            else{
                response.status(200).json(data);
            }
            response.end();
        })

    }
})

//provides a response containing the HTML for the users profile using the database id
app.get(["/users/:userID"], (request,response) => {
    let id;
    try{
        id = new mongo.ObjectId(request.params.userID)
    } catch{
        response.status(404).send("Wrong Id");
        return;
    }

    db.collection("users").findOne({"_id": id}, function(err, data){
        let info = data;
        if (err) {
			response.status(500).send("Error reading database.");
			return;
		}
        db.collection("orders").find({user: data.username}).toArray(function(error, result){
            if (error) throw error;

            if(data.privacy){
                if(request.session.username != data.username){
                    response.status(403).send("Private ID");
                    return;
                }
            }
		    else if (!data.privacy && request.session.username != data.username) {
                if (err) throw err;
                
                response.status(200).render("profile",{info,result});
			    return;
            }
            else if(!request.session.login || request.session.username != data.username){
                response.status(403).send("Not Authorized");
                return
            }
		response.status(200).render("profile", {result,info});
        return;
    })
    })
});

//provides a response containing the HTML for the users/userID page
//Allows users to update if they want a private or public account  
app.post(["/users/:userID"], (request,response) =>{
    let priv = request.body.privacy;

    db.collection("users").updateOne({username: request.session.username},
        {$set: {privacy: priv}},function(err,data){
            if(err) throw err;

            if(!data){
                response.status(401).send("Error");
            }
            else{
                response.status(200).send();
            }
        })
})

//provides a response containing the HTML for the register page
app.get(["/register"], (request,response) => {
    response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
	response.render("register")
});

/**Checks if the user is in database
  if user is in database alert user
  if user is not in database add user to database */
app.post(["/register"], (request,response) => {
    let username = request.body.username;
    let password = request.body.password;
    let privacy = false;

    if(request.body.username == ""){
        response.status(401).send("Not valid user");
    }
    else if(request.body.password == ""){
        response.status(401).send("Not valid");
    }
    
    else{
        db.collection("users").findOne({username : username},function(err, data){  
            if(err) throw err;

            if(data == null){
                db.collection("users").insertOne({username : username, password :password, privacy: privacy})
                    db.collection("users").findOne({username : username},function(err, result){  
                        if(err) throw err;

                        request.session.login = true;
                        request.session.username = username;
                        request.session.userid = result._id;
                        response.status(200).send(result._id);
                    })
                }
            else{
                response.status(401).send("Username taken");
                return;
        }
        
    })
}

});    

//provides a response containing the HTML for the restaurant order page
app.get(["/orderform"], (request,response) => {
	response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
    response.render("orderform")
});

//Adds users order to order database
app.post(["/orders"], (request,response) =>{ 
    let info = request.body;
    db.collection("orders").insertOne({
        restaurantID : info.restaurantID, 
        restaurantName : info.restaurantName, 
        subtotal : info.subtotal, 
        total : info.total,
        fee : info.fee,
        tax : info.tax,
        order : info.order,
        user : request.session.username
    },function(err, data){ 
        if(err) throw err;

        if (data){
            response.status(200).send("Working");
        }
    });
})

//provides a response containing the HTML for all user's order
app.get(["/orders/:orderID"], (request,response) =>{
    let id;
    try{
        id = new mongo.ObjectId(request.params.orderID)
    } catch{
        response.status(404).send("Wrong Order Id");
        return;
    }
    db.collection("orders").findOne({"_id": id}, function(err, data){
        if (err) throw err;

        db.collection("users").findOne({username: data.user},function(error, result){    
            if(error) throw error;
            
            if(result.privacy){ 
                if(request.session.username != result.user){
                response.status(403).send("Not authorized")
                return;
                }
            }
    
            if(!result.privacy){
                response.status(200).render("order",{data});
                return;
            }
            else if(request.session.username == data.user){
                response.status(200).render("order",{data});
                return;
            }
            
            else{
            response.status(404).send("Error");
            return;
        }
    })
    })
})

//provides a response containing the HTML for the login page
app.get(["/login"], (request,response) => {
    if(request.session.login){
        response.status(200).send("Logged in");
        return;
    }
    response.status(200);
    response.render("login");
});

//Handles post to check if user exists in database 
app.post(["/login"], (request,response) => {
    if(request.session.login){
        response.status(201).send("Logged in");
        return;
    }

    let username = request.body.Username;
    let password = request.body.Password;

    db.collection("users").findOne({username : username},function(err, data){
        if(err) throw err;

        if(data){
            if(data.password == password){
                request.session.login = true;
                request.session.username = data.username;
                request.session.userid = data._id;
                response.send(data._id);
                return;
            }
            if(data.password != password){
                response.status(401).send("Invalid password");
            }
        }
        else{
            response.status(401).send("Invalid username");
            return;
        }
    });

});

//Logs users out if pressed 
app.get(["/logout"], (request,response) => {
    if(request.session.login){
        request.session.login = false;
        request.session.destroy();
        response.status(200);
        response.render("home");
        return;
    }
    response.status(200);
    response.render("home");
});

let db;
MongoClient.connect('mongodb+srv://Assignment4:COMP2406@cluster0.at78s.mongodb.net/a4?retryWrites=true&w=majority',(err, client) => {
    if (err) throw err;

    db = client.db("a4");
    app.listen(process.env.PORT || 3000);
    console.log("Server listening at http://localhost:3000");
});
