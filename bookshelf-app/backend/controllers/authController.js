//Validation done in controller

import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

export const register = async(req, res) => {
    const {username, email, password} = req.body;

    //Ensure all fields are filled
    if (!username || !email || !password) {
        return res.status(400).json({success: false, message: "All fields are required"});
    }

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();
    

    // Transaction for user registration, ensuring two users cannot register at the same time with the same username/email.
    try {
        //Transaction uses MySQL default isolation level (REPEATABLE READ)
        await connection.beginTransaction();

        // Check if username already exists
        const [existingUser] = await connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existingUser.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({success: false, message: 'Username already in use!'});
        }

        // Check if email already exists
        const [existingEmail] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        if (existingEmail.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({success: false, message: 'Email already in use!'});
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await connection.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Commit transaction
        await connection.commit();

        // Get newly created user
        const newUser = {
            id: result.insertId,
            username: username,
            email: email
        };
        
        // Generate JWT token
        const token = generateToken(newUser);
        
        // Release connection and return success
        connection.release();
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
    catch (error) {
        // Rollback transaction on any error
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }
        
        // Always release connection
        try {
            connection.release();
        } catch (releaseError) {
            console.error('Connection release error:', releaseError);
        }
        
        console.error('Registration error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a duplicate entry error (MySQL unique constraint violation)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: error.message.includes('username') 
                    ? 'Username already in use!' 
                    : 'Email already in use!'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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