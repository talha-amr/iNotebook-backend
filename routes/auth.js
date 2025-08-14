const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/login');
require('dotenv').config(); // Load environment variables

const JWT_KEY = process.env.JWT_SECRET; // Now using env variable

router.post('/createUser', 
    [  
        body('name', 'Enter a Valid Name').isLength({ min: 3 }),
        body('email', 'Enter a Valid email').isEmail(),
        body('password', 'Enter a Valid password.minimum of 5').isLength({ min: 5 })
    ],
    async (req, res) => {
        let success = false; 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success, 
                error: errors.array()[0].msg
            });
        }

        try {
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ 
                    success, 
                    error: "User with this email already exists" 
                });
            }

            const salt = await bcrypt.genSalt(10);
            const secPassword = await bcrypt.hash(req.body.password, salt);

            user = await User.create({
                name: req.body.name,
                email: req.body.email,
                password: secPassword
            });

            const authToken = jwt.sign({ user: { id: user.id } }, JWT_KEY);
            
            return res.json({ 
                success: true, 
                authToken 
            });

        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ 
                success: false, 
                error: "Registration failed" 
            });
        }
    }
);

// Login route (unchanged except for JWT_KEY)
router.post('/login', 
    [
        body('email', 'Enter a Valid email').isEmail(),
        body('password', 'Password cannot be blank and should be minimum 5 letters').isLength({ min: 5 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);  
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {email, password} = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user){
                return res.status(400).json({ success: false, error: "Invalid credentials" });
            }

            const pwCompare = await bcrypt.compare(password, user.password);
            if (!pwCompare){
                return res.status(400).json({ success: false, error: "Invalid credentials" });
            }

            const payload = {
                user: {
                    id: user.id
                }
            };

            const authToken = jwt.sign(payload, JWT_KEY);

            res.json({ success: true, authToken });

        } catch (error) {
            console.error(error.message);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    }
);

router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;