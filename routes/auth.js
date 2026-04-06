const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, email, password} = req.body;
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({message: "Email already registered"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: user._id, username: user.username},
            process.env.JWT_SECRET,
            { expiresIn: '7d'}
        );

        res.status(201).json({
            token,
            user: {id: user._id, username: user.username, email: user.email}
        });
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
});

router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "Invalid Credentials"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Incorrect Password"});
        }
        const token = jwt.sign(
            {id: user._id, username: user.username},
            process.env.JWT_SECRET,
            { expiresIn: "7d"}
        );
        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
});

module.exports = router;