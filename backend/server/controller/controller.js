var userdb = require("../model/model");
var Stuser = require("../model/stuModel");
var Slogintuser = require("../model/stuLogin");
var Subjectsatt = require("../model/subjects.js");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.create = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "fill all details" });
    console.log("None of the fields can be empty");
  }
  try {
    const userExists = await userdb.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: "User already exists" });
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
      res.status(400).json({ error: "Registration Failed" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.stucreate = async (req, res) => {
  try {
    const { name, email, phone, roll, branch, subject } = req.body;
    if (!name || !email || !phone || !roll || !subject || !branch) {
      res.status(422).json({ error: "fill in all details" });
    } else {
      console.log(req.body);
      Stuser.findOne({ email: email })
        .then((userexists) => {
          if (userexists) {
            Stuser.findOneAndUpdate(
              { email: email },
              { $push: { subject: subject } },
              (error, data) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log(data);
                }
              }
            );

            Slogintuser.updateOne(
              { email: email },
              { $set: { [subject]: [] } },
              { upsert: false, multi: true },
              (error, data) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log(data);
                }
              }
            );

            return res.status(201).json({ message: "Registration Successful" });
          }

          const stuser = new Stuser({
            name: name,
            email: email,
            phone: phone,
            roll: roll,
            subject: [subject],
            branch: branch,
          });
          stuser
            .save()
            .then(() => {
              const stloginuser = new Slogintuser({
                email: email,
                phone: phone,
                [subject]: [],
              });
              stloginuser
                .save()
                .then(() => {
                  return res
                    .status(201)
                    .json({ message: "student successfully added" });
                })
                .catch((err) =>
                  res.status(500).json({
                    error: "Failed in adding student to student login database",
                  })
                );
            })
            .catch((err) =>
              res.status(500).json({ error: "Failed in adding student" })
            );
        })
        .catch((err) => {
          console.log();
        });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.AbsentDates = async (req, res) => {
  try {
    const { email, subjectName, datee } = req.body;
    if (!email || !subjectName || !datee) {
      res.status(422).json({ error: "fill in all details" });
      console.log("fill in all details");
    } else {
      Slogintuser.findOne({ email: email }).then((StudentExists) => {
        if (StudentExists) {
          Slogintuser.findOneAndUpdate(
            { email: email },
            { $addToSet: { [subjectName]: datee } },
            (error, data) => {
              if (error) {
                console.log(error);
                console.log("There was some error");
              } else {
                console.log(data);
                console.log("Marked");
              }
            }
          );
          return res
            .status(201)
            .json({ message: "Absent Marked SuccessFully" });
        } else {
          res.status(422).json({ error: "Cannot mark Absent" });
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};
exports.find = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      console.log(email);
      console.log(password);
      return res.status(400).json({ error: "None of the feilds can be empty" });
    }

    const emailExists = await userdb.findOne({ email: email });
    console.log(emailExists);
    if (emailExists) {
      const PassMatch = await bcrypt.compare(password, emailExists.password);

      const token = await emailExists.generateAuthToken();
      res.cookie("jwtoken", token, {
        expires: new Date(Date.now() + 25892000000),
        httpOnly: true,
      });

      if (!PassMatch) {
        res.status(400).json({ error: "Please Enter valid User Credentials" });
      } else {
        res.json({ message: "User SignIn Successfully" });
      }
    } else {
      res.status(400).json({ error: "Please Enter valid User Credentials" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.findStud = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      console.log(email);
      console.log(password);
      return res.status(400).json({ error: "None of the feilds can be empty" });
    }
    const emailExists = await Slogintuser.findOne({ email: email });
    const PassMatch = await Slogintuser.findOne({ phone: password });
    console.log(emailExists);
    if (emailExists && PassMatch) {
      console.log("Login as Student Succesfully");
      res.json({ message: "Welcome Student" });
    } else {
      res.status(400).json({ error: "Please Enter valid User Credentials" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.findStudWithFeild = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(404).json({ err: "Feilds cannot be empty" });
    }

    const subj = req.params.subject;
    const branch = req.params.branch;
    Stuser.find({ subject: subj, branch: branch })
      .then((data) => {
        if (!data) {
          res.status(404).json({ err: "No student with a branch found" });
        } else {
          res.send(data);
        }
      })
      .catch((err) => {
        res.status(500).send({ message: "Some error occurred" });
      });
  } catch (err) {
    console.log(err);
  }
};

exports.update = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Data to be updated cannot be empty" });
  }
  const id = req.params.id;
  Stuser.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot Update a user with ${id} , Maybe User not found`,
        });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error Update user false Information " });
    });
};
exports.AllDates = async (req, res) => {
  try {
    const { subjectName, datee,branch } = req.body;
    if (!subjectName || !datee||!branch) {
      res.status(422).json({ error: "fill in all details" });
      console.log("fill in all details");
    } else {
      Subjectsatt.find({ [subjectName+"_"+branch]: { $exists: true } })
        .then((data) => {
          console.log(data);
          if (!data[0]) {
            const newuser = new Subjectsatt({
              [subjectName+"_"+branch]: [datee],
            });
            newuser
              .save()
              .then(() => {
                return res
                  .status(201)
                  .json({ message: "added attendance date to database" });
              })
              .catch((err) => {
                res.status(500).json({
                  error: "Failed in adding attendance date to database",
                });
              });
          } else {
            Subjectsatt.updateOne(
              { [subjectName+"_"+branch]: { $exists: true } },
              { $addToSet: { [subjectName+"_"+branch]: datee } },
              (error, data) => {
                if (error) {
                  console.log(error);
                  console.log("There was some error");
                } else {
                  console.log(data);
                  console.log("addedattendance date to database");
                }
              }
            );
            return res
              .status(201)
              .json({ message: "added attendance date to database" });
          }
        })
        .catch((err) => {
          res.status(500).json({
            error: "Failed in adding attendance date to database",
          });
        });
    }
  } catch (error) {
    console.log(error);
  }
};
