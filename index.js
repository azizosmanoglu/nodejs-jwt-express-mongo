const express = require("express");
const User = require("./models/user");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const db = require("./config/config").get(process.env.NODE_ENV);
const { info } = require("./utils/mailSender");
const { auth } = require("./middlewares/auth");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
// database connection
mongoose.Promise = global.Promise;
mongoose.connect(
  db.DATABASE,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  function (err) {
    if (err) console.log(err);
    console.log("database is connected");
  }
);
// adding new user (sign-up route)
app.post("/api/signup", function (req, res) {
  // taking a user
  const newuser = new User(req.body);

  if (newuser.password != newuser.password2)
    return res.status(400).json({
      message: "password not match",
    });

  User.findOne(
    {
      email: newuser.email,
    },
    function (err, user) {
      if (user)
        return res.status(400).json({
          auth: false,
          message: "email exits",
        });

      newuser.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            success: false,
          });
        }
        res.status(200).json({
          succes: true,
          user: doc,
        });
          
        //mailsender method will work
      });
    }
  );
});
// login user
app.post("/api/login", function (req, res) {
  let token = req.cookies.auth;
  User.findByToken(token, (err, user) => {
    if (err) return res(err);
    if (user)
      return res.status(400).json({
        error: true,
        message: "You are already logged in",
      });
    else {
      User.findOne(
        {
          email: req.body.email,
        },
        function (err, user) {
          if (!user)
            return res.json({
              isAuth: false,
              message: " Auth failed ,email not found",
            });

          user.comparepassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
              return res.json({
                isAuth: false,
                message: "password doesn't match",
              });

            user.generateToken((err, user) => {
              if (err) return res.status(400).send(err);
              res.cookie("auth", user.token).json({
                isAuth: true,
                id: user._id,
                email: user.email,
              });
            });
          });
        }
      );
    }
  });
});
// get logged in user
app.get("/api/my-profile", auth, function (req, res) {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.firstname + req.user.lastname,
  });
});
//logout user
app.get("/api/logout", auth, function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});
// main page (login & signup)
app.get("/", (req, res) => {
  res.status(200).send(`login & register`);
});
const port = process.env.port || 3000;
app.listen(port, () => {
  console.log(`server running port : ${port} `);
});
