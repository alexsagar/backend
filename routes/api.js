import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // If you want to hash passwords
import { User, Game } from "../db.js";
import { BillingInfo } from "../db.js";
const router = express.Router();
const JWT_SECRET_KEY = "godlysana"; // Replace with a secure key for JWT

import mongoose from "mongoose";

// Example API endpoint
router.get("/", (req, res) => {
  res.send({ message: "Welcome to the API!" });
});

router.post("/submit", (req, res) => {
  const { name, email } = req.body;
  res.send({
    success: true,
    message: `Hello, ${name}! Your email is ${email}.`,
  });
});

router.post("/new-user", async (req, res) => {
  let { fullname, password, email } = req.body;

  try {
    // Optional: Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullname, password: hashedPassword, email });

    await newUser.save();
    res.send({ success: true, message: "User created successfully!" });
  } catch (error) {
    res
      .status(400)
      .send({ success: false, message: "Error creating user.", error });
  }
});

// Login validation route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "User not found!" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid credentials!" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    res.send({ success: true, message: "Login successful!", token });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error.", error });
  }
});

router.post("/create-game", async (req, res) => {
  const {
    name,
    rating,
    description,
    releaseDate,
    category,
    platform,
    price,
    imageUrl,
  } = req.body;

  try {
    const newGame = new Game({
      name,
      rating,
      description,
      releaseDate,
      category,
      platform,
      price,
      imageUrl,
    });

    await newGame.save();
    res.send({ success: true, message: "Game created successfully!" });
  } catch (error) {
    res
      .status(400)
      .send({ success: false, message: "Error creating game.", error });
  }
});

router.get("/games", async (req, res) => {
  try {
    const games = await Game.find();
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching games.", error });
  }
});

router.post("/games/info", async (req, res) => {
  const { gameIds } = req.body;
  if (!Array.isArray(gameIds)) {
    return res.status(400).json({
      success: false,
      message: "Invalid input, expected an array of game IDs.",
    });
  }

  try {
    const games = await Game.find({ _id: { $in: gameIds } });
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching game information.",
      error,
    });
  }
});

// Add this before the export default router

router.post("/create-new-billing", async (req, res) => {
  const {
    fullname,
    primary_contact,
    billing_address,
    payment_method,
    billing_status,
    cart, // Array of game IDs to add to cart
  } = req.body;
  const gameIds = cart;

  // Validate required fields
  if (!fullname || !primary_contact || !billing_address || !payment_method) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: fullname, primary_contact, billing_address, payment_method",
    });
  }

  // Validate payment method
  const validPaymentMethods = ["esewa", "khalti", "paypal", "cash"];
  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid payment method. Must be one of: Esewa, Khalti, Paypal, Cash",
    });
  }

  try {
    // Validate game IDs

    if (!gameIds || !Array.isArray(gameIds)) {
      return res.status(400).json({
        success: false,
        message: "Cart must be an array of game IDs",
      });
    }
    if (gameIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart must not be empty",
      });
    }

    // Check if all IDs are valid ObjectIds
    const validObjectIds = gameIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (!validObjectIds) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID format in cart",
      });
    }

    // Verify all games exist
    const existingGames = await Game.find({
      _id: { $in: gameIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (existingGames.length !== gameIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more games in cart not found",
      });
    }

    const newBilling = new BillingInfo({
      fullname,
      primary_contact,
      billing_address,
      payment_method,
      billing_status,
      cart: gameIds.map((id) => new mongoose.Types.ObjectId(id)),
    });

    const savedBilling = await newBilling.save();

    res.status(201).json({
      success: true,
      message: "Billing information created successfully",
      data: savedBilling,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/remove-game/:id", async (req, res) => {
  const { id } = req.params;

  // Validate the game ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid game ID format",
    });
  }

  try {
    // Check if the game exists
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Remove the game
    await Game.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Game removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing game",
      error,
    });
  }
});

router.get("/billings", async (req, res) => {
  try {
    const { billing_status } = req.query;
    const filter = billing_status ? { billing_status } : {};
    const billings = await BillingInfo.find(filter).populate("cart");
    res.status(200).json(billings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/billing/:id", async (req, res) => {
  try {
    const billingId = req.params.id;
    const billingInfo = await BillingInfo.findByIdAndUpdate(
      billingId,
      { billing_status: "billed" },
      { new: true }
    );

    if (!billingInfo) {
      return res.status(404).send({ message: "Billing info not found" });
    }

    res.send(billingInfo);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// JWT token validation route
router.post("/check-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .send({ success: false, message: "No token provided." });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ success: false, message: "Failed to authenticate token." });
    }

    // If token is valid
    res.send({ success: true, message: "User is logged in." });
  });
});

export default router;
