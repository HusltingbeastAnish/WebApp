var userdb = require("../model/model");

exports.create = async (req, res) => {
  // If users submits an empty form while registering
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ error: "None of the fields can be empty" });
  }
  try {
    // To check whether we have a user with same email existing
    const userExists = await userdb.findOne({ email: req.body.email });
    if (userExists) {
      return res.status(422).json({ message: "The email alreaedy Exists" });
    }
    const user = new userdb({
      name,
      email,
      password,
    });

    const signUp = await user.save();
    if (signUp) {
      res.status(201).json({ message: "Registration Successful" });
    } else {
      res.status(500).json({ error: "Registration Failed" });
    }
  } catch (err) {
    console.log(err);
  }
};

// To find if the user is with us
exports.find = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === null || password === null) {
      return res.status(400).json({ error: "None of the feilds can be empty" });
    }

    const emailExists = await userdb.findOne({ email: req.body.email }).exec();

    if (emailExists === null) {
      res.status(500).json({ errr: "Login Failed" });
    } else {
      res.status(201).json({ message: "User Successfully Logged In" });
      console.log("User Successfully Logged In");
    }
  } catch (err) {
    console.log(err);
  }
};