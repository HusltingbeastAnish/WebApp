const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

//For Hashing the password

Schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Generation of the user token
Schema.method.generateAuthToken= async function ()
{
  try
  {
    let token=jwt.sign({_id:this._id},process.env.SECRET_KEY)
  }
}

const UserDB = mongoose.model("userdb", Schema);

module.exports = UserDB;
