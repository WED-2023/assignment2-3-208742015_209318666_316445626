var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");



router.post("/register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
      profilePic: req.body.profilePic || null  // Handle null if not provided
    };
    
    let users = [];
    users = await DButils.execQuery("SELECT username from users");

    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users (username, firstname, lastname, country, password, email, profilePic) 
       VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}', '${user_details.country}', '${hash_password}', '${user_details.email}', '${user_details.profilePic}')`
    );
    
    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    const username = req.body.username;

    const users = await DButils.execQuery(`SELECT * FROM users WHERE username = ?`, [username]);

    if (users.length === 0) {
      return res.status(401).send({ message: "Username or Password incorrect" });
    }

    const user = users[0];
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).send({ message: "Username or Password incorrect" });
    }

    // Set the session with the user_id
    req.session.user_id = user.user_id;

    // Respond with success
    res.status(200).send({ message: "Login succeeded", success: true });

  } catch (error) {
    next(error);
  }
});


router.post("/Logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;