const express = require('express');
const fs = require("fs");
// const { response, request } = require("express");
const app = express();
const session = require('express-session')
// const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongo');

//creates a new connection
const store = new MongoDBStore({
    mongoUrl: 'mongodb://localhost/a4',
    collection: 'sessions'
})
store.on('error',(error) => {console.log(error)});


let mongo = require('mongodb');
const { compile } = require('pug');
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
app.get(["/","/home"], (request,response) => {
	response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
	response.render("home")
});

// app.get(["/users"], (request,response) => {
//     // db.collection("users").distinct("username", function(err, data){
//         // if(err) throw err;
//         // let user = data;
//         console.log(request.query);
//         // response.format({
//             // "application/json": function () {
//     //     response.status(200).render("users",{user});
//     // })
//         //let search = "";
//         let search = request.query.username;
//         console.log(search);
//         if (search =! null){
//             console.log("here "+ search); 
//             const d = db.collection("users").find({
//                 "username": {
//                     $regex: `${search}`, 
//                     "$options": "i"
//                 }
//             })
//             d.toArray(function(err, data){
//                 if (err){
//                     throw err;
//                 }
//                 // else if (data.length == 0){
//                 //     response.status(401).send("Username");
//                 // }
//                 else{
// 		        response.status(200).json(data).render("users");
//                 response.end();
//                 }
// 	            // response.end();
//             })
//         }
    
//         // else{
//         //     response.status(401).send("Username");
//         //     return;
//         // }
//         // else if (search == null){
//         //     response.status(200).render("users",{user});
//         //     return;
//         // }
//     // },
//     //     "text/html": function () {
//         // else{
//         //     response.status(200).render("users",{user});
//         //     return;
//         // }
//         // },
//         // "default": function () {
// 			// response.status(406).send("Not acceptable");
// 		// }
//     // })
//     // })
// });

// app.get(["/users"], (request,response) => {
//     db.collection("users").distinct("username", function(err, data){
//     // db.collection("users").find(),function(err, data){
//         if(err) throw err;
//         let user = data;
//         response.status(200).render("users",{user});
//     })

// });

// app.get(["/user"], (request,response) => {
//     let search = "";
//     search = request.query.username;
//     console.log(search);
// const d = db.collection("users").find({
//     "username": {
//         $regex: search, 
//         "$options": "i"
//     }
// })
// d.toArray(function(err, data){
//     if (err) throw err;
// 		response.statusCode = 200;
// 		response.json(data);
// 		response.end();
//     })
// });        

app.get(["/users"], (request,response) => {
    console.log(request.query);

    let search = request.query.username;
    if (search == null){
        // db.collection("users").distinct("username", function(err, data){
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
                // response.status(200).render("user", {users});
                response.status(200).json(data);
                // response.end();
                // return;
            }
        
            //response.status(200).json(data);
            response.end();
        })

    }
})

app.get(["/users/:userID"], (request,response) => {
    let id;
    try{
        id = new mongo.ObjectId(request.params.userID)
        console.log(id);
    } catch{
        response.status(404).send("Wrong Id");
        return;
    }

    db.collection("users").findOne({"_id": id}, function(err, data){
        console.log(data);
        let info = data;
        if (err) {
			response.status(500).send("Error reading database.");
			return;
		}
		if (!info) {
			response.status(404).send("Unknown ID");
			return;
		}
		response.status(200).render("profile", {info});
    })
});

app.get(["/register"], (request,response) => {
    response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
	response.render("register")
});

app.post(["/register"], (request,response) => {
    let username = request.body.username;
    let password = request.body.password;
    let privacy = false;
    console.log(username);

    db.collection("users").findOne({username : username},function(err, data){  
        if(err) throw err;

        if(data == null){
            db.collection("users").insertOne({username : username, password :password, privacy: privacy},function(err, data){ 
                if(err) throw err;

                if (data){
                    request.session.login = true;
                    request.session.username = username;
                    response.status(200).send("Working");
                }
            });
        }
        else{
            response.status(401).send("Username taken");
            return;
        }
    })

});
    

app.get(["/orderform"], (request,response) => {
    // let data = fs.readFileSync("public/orderform.html")
	response.statusCode = 200;
	response.setHeader("Content-Type", "text/html");
    response.render("orderform")
	// response.write(data);
    // response.end();
});
app.get(["/login"], (request,response) => {
    if(request.session.login){
        response.status(200).send("Logged in");
        return;
    }
    response.status(200);
    response.render("login");
});

app.post(["/login"], (request,response) => {
    if(request.session.login){
        response.status(201).send("Logged in");
        return;
    }

    let username = request.body.Username;
    let password = request.body.Password;

    db.collection("users").findOne({username : username},function(err, data){
        if(err) throw err;
        console.log(data);

        if(data){
            if(data.password == password){
                console.log(data);
                request.session.login = true;
                request.session.username = data.username;
                console.log(request.session.username);
                request.session.userid = data._id;
                console.log(request.session.userid);
                response.redirect("/home");
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
MongoClient.connect('mongodb://localhost/a4',(err, client) => {
    if (err) throw err;

    db = client.db("a4");
    app.listen(3000);
    console.log("Server listening at http://localhost:3000");
});
