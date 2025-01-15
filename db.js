import mongoose from "mongoose";

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://gamesagar85:22446688@gamesagar.5zbd7.mongodb.net/",
  // "mongodb+srv://sanandanghimire6688:pN64WADaTrbru4dG@cluster0.tsqtf.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
});

const User = mongoose.model("User", userSchema);

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  releaseDate: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
  },
});

const Game = mongoose.model("Game", gameSchema);
const billingInfoSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  primary_contact: {
    type: String,
    required: true,
  },
  billing_address: {
    type: String,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["esewa", "khalti", "paypal", "cash"],
    required: true,
  },
  billing_status: {
    type: String,
    enum: ["billed", "pending", "cancelled"],
    default: "pending",
  },
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
    },
  ],
  created_date: {
    type: Date,
    default: Date.now,
  },
});
const BillingInfo = mongoose.model("BillingInfo", billingInfoSchema);

export { userSchema, User, gameSchema, Game, billingInfoSchema, BillingInfo };
