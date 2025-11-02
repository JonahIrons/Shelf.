//Validation done in controller

import UserModel from "../models/userModel.js";
import { registerUser } from "../services/authService.js";
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

export const register = async(req, res) => {
    const {username, email, password} = req.body;

    //Ensure all fields are filled
    if (!username || !email || !password) {
        return res.status(400).json({success: false, message: "All fields are required"});
    }

    //Check if username already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
        return res.status(400).json({success: false, message: 'Username already in use!'});
    }

    //Check if email already exists
    const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
        return res.status(400).json({success: false, message: 'Email already in use!'});
    }

    const user = new UserModel({username, email, password});

    try {
        const response = await registerUser(user);

        if (response.success) {
            // Get the newly created user to generate token
            const [newUsers] = await pool.query('SELECT id, username, email FROM users WHERE username = ?', [username]);
            const newUser = newUsers[0];
            
            // Generate JWT token
            const token = generateToken(newUser);
            
            return res.status(200).json({
                success: true,
                message: "User Registered Successfully!",
                token: token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email
                }
            });
        }
        else {
            return res.status(400).json(response);
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({success: false, message: "Registration failed."});
    }

    //Can add email / password format validation here as well
}

export const log = async(req, res) => {
    const {username, password} = req.body;

    //Ensure all fields are filled
    if (!username || !password) {
        return res.status(400).json({success: false, message: "All fields are required"});
    }

    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length === 0) {
            return res.status(400).json({success: false, message: 'That username does not exist!'});
        }

        const user = existingUser[0];

        //Compare entered password to stored hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({success: false, message: 'Incorrect password!'});
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            username: user.username
        });

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({success: false, message: 'Login failed. Please try again.'});
    }
}

// Verify token and return user info (useful for checking if user is still logged in)
export const verify = async(req, res) => {
    // This endpoint should be protected by auth middleware
    // req.user will be set by the middleware
    res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
    });
}