const express = require("express");

const app = express(); // create app
app.set("view engine", "ejs"); // set view engine to ejs. Create a new folder named views and place the .ejs files there
app.use(express.urlencoded({extended: true}));
app.use(express.static("public")); // to tell express that the static css files are present in the public folder

// passport
const session = require("express-session"); // for session cookies
const passport = require("passport"); // for dealing with authentication
const passportLocalMongoose = require("passport-local-mongoose");
app.use(session({ // for express-session
    secret: "This is my secret string", // SECRET is written in .env file
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/timeDB', {useNewUrlParser: true, useUnifiedTopology: true}); // create a new database named personsDB

const taskSchema = new mongoose.Schema({
    title: String,
    desc: String,
    startTime: Number,
    endTime: Number,
    duration: Number,
    sTime: Number,
    importance: Number
});
const Task = mongoose.model("Task", taskSchema);

function compare(a, b) {
    if ( a.endTime < b.endTime ){
        return 1;
    }
    if ( a.endTime > b.endTime ){
        return -1;
    }
    if ( a.startTime < b.startTime ){
        return 1;
    }
    if ( a.startTime > b.startTime ){
        return -1;
    }
    if ( a.importance < b.importance ){
        return 1;
    }
    if ( a.importance > b.importance ){
        return -1;
    }
    return 0;
};

function scheduleFunc( arr ){
    arr.sort(compare);
    console.log(arr);
    var l = arr.length;
    var i = 0, sLen = 0 ;
  
    const sched = [];
    while( i < l ){
        if( sLen == 0 ){
            arr[i].sTime = arr[i].endTime - arr[i].duration ;
            sLen = sched.push(arr[i]);
        }
        else{
            console.log("sLen:"+sLen);
            if( arr[i].endTime <= sched[sLen-1].sTime ){
                arr[i].sTime = arr[i].endTime - arr[i].duration ;
                sLen = sched.push(arr[i]);
            }
            else if( arr[i].startTime + arr[i].duration <= sched[sLen-1].sTime ){
                arr[i].sTime = sched[sLen-1].sTime - arr[i].duration ;
                sLen = sched.push(arr[i]);
            }
            else{
                var j = sLen -1;
                var impt = arr[i].importance;
                while( j >= 0 && impt >= 0 ){
                    if( arr[i].startTime + arr[i].duration <= sched[j].sTime ){
                        var k = 0, sumDuration = 0 ;
                        var flag = 1 ;
                        if( impt == 0 ){
                            for( k = j+1; k < sLen ; k++ ){
                                sumDuration += sched[k].duration ;
                            }
                            if( sumDuration <= arr[i].duration ){
                                flag = 0 ;
                            }
                        }
                        if( flag == 1 ){
                            for( k = sLen -j -1; k > 0; k-- ){
                                sched.pop();
                                sLen-- ;
                            }
                            sLen = sched.length ;
                            if( arr[i].endTime <=  sched[sLen-1].sTime ){
                                arr[i].sTime = arr[i].endTime - arr[i].duration ;
                            }
                            else{
                                arr[i].sTime = sched[sLen-1].sTime - arr[i].duration ;
                            }
                            sLen = sched.push(arr[i]);
                        }
                        break ;
                    }
                    impt -= sched[j].importance ;
                    j-- ;
                }
                if( j == -1 && impt >= 0 ){
                    var k = 0, sumDuration = 0 ;
                    var flag = 1 ;
                    if( impt == 0 ){
                        for( k = 0; k < sLen ; k++ ){
                            sumDuration += arr[k].duration ;
                        }
                        if( sumDuration <= arr[i].duration ){
                            flag = 0 ;
                        }
                    }
                    if( flag == 1 ){
                        for( k = sLen ; k > 0; k-- ){
                            sched.pop();
                            sLen-- ;
                        }
                        arr[i].sTime = arr[i].endTime - arr[i].duration ;
                        sLen = sched.push(arr[i]);
                    }
                }
            }
        }
        i++ ;
    }
    return sched.reverse() ;
};

const scheduleSchema = new mongoose.Schema({
    name: String,
    type: String,
    breakInterval: Number,
    tasks: [taskSchema]
});
const Schedule = mongoose.model("Schedule", scheduleSchema);

const userSchema = new mongoose.Schema({
    username: String, // email id of user
    name: String,
    password: String,
    occupation: String,
    mobileNumber: Number,
    schedules: [scheduleSchema]
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) { // serialize - set up the session cookie and stuff user data onto the cookie
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) { // deserialize - crumble the cookie and get user data back for authentication
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.get("/", function (req, res) {
    if (req.user)
        res.render("home", {currYear: new Date().getFullYear(), username: req.user.name});
    else
        res.render("home", {currYear: new Date().getFullYear(), username: ""});
    return;
});

app.route("/login")
.get(function (req, res) {
    if (req.user)
        res.render("login", {currYear: new Date().getFullYear(), username: req.user.name});
    else
        res.render("login", {currYear: new Date().getFullYear(), username: ""});
})
.post(passport.authenticate("local"), function (req, res) {
    res.redirect("/see-schedules");
});

app.route("/register")
.get(function (req, res) { // register get request on port /register
    if (req.user)
        res.render("register", {currYear: new Date().getFullYear(), username: req.user.name});
    else 
        res.render("register", {currYear: new Date().getFullYear(), username: ""});
})
.post(function (req, res) { // normal user registration (other than Sign up with google)

    ////////////////////////////////////// IMP //////////////////////////////////
    /*
    If we have more than 2 fields (namely username and password) in our userSchema then we can initialise them
    in the object in the first argument to User.register()
    eg User.register({username: req.body.username, email:req.body.email}, req.body.password, function (err, user) {..})
    */

    User.register({username: req.body.username, occupation: req.body.occupation, mobileNumber: req.body.mobileNumber, schedules: [], name: req.body.name}, req.body.password, function(err, user) { // register the user with email and password
        if (err) { // redirect to /register if there is an error
            res.send(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                // this callback is only executed if the user is authenticated and a session cookie has been successfully set for the user

                res.redirect("/see-schedules");
            });
        }
    });
});

app.get("/home", function (req, res) {
    res.send("<h1>Show all user schedules. Keep a link to redirect to create schedule. Allow to edit/import schedule</h1>")
    return;
});

app.get("/profile", function (req, res) {
    res.send("<h1>Show the user profile and allow edits</h1>")
});

function extractTasks(body) {
    var tasks = [];
    for (var i = 0; i < body.title.length; i++)
        tasks.push(new Task({
            title: body.title[i],
            desc: body.desc[i],
            startTime: body.start_time[i],
            endTime: body.end_time[i],
            duration: body.duration[i],
            sTime: 0,
            importance: body.importance[i]
        }));
    return tasks;
}

app.route("/create-schedule")
.get(function (req, res) {
    if (req.isAuthenticated()) {
        res.render("create-schedule", {currYear: new Date().getFullYear(), username: req.user.name});
    } else
        res.redirect("/login");
    return;
})
.post(function (req, res) {
    if (req.isAuthenticated()) {
        var tasks = extractTasks(req.body);
        tasks = scheduleFunc(tasks);
        console.log(tasks);
        var schedule = new Schedule({
            name: req.body.scheduleName,
            type: req.body.scheduleType,
            breakInterval: 0,
            tasks: tasks
        });
        req.user.schedules.push(schedule);
        req.user.save();
        res.redirect("/see-schedules");
    } else
        res.redirect("/login");
    return;
});

app.get("/see-schedules", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("see-schedules", {currYear: new Date().getFullYear(), username: req.user.name, schedules: req.user.schedules});
    } else
        res.redirect("/login");
    return;
});

app.get("/see-schedule/:scheduleId", function (req, res) {
    if (req.isAuthenticated()) {
        var i;
        for (i = 0; i < req.user.schedules.length; i++)
            if (req.user.schedules[i]._id == req.params.scheduleId)
                break;
        if (i === req.user.schedules.length) {
            res.redirect("/see-schedules");
            return;
        }
        res.render("see-schedule", {currYear: new Date().getFullYear(), username: req.user.name, schedule: req.user.schedules[i]});
    } else
        res.redirect("/login");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.listen(3000, function () { // tells the app to listen on the port 3000 and once server has started, it will execute the callback
    console.log("Server started on port 3000");
    return;
});
