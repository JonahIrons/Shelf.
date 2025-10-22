//Validation done in controller

import UserModel from "../models/userModel.js";
import { registerUser } from "../services/authService.js";
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

export const register = async(req, res) => {
    const {username,email,password} = req.body;

    //Ensure all fields are filled
    if (!username || !email || !password) {
        return res.status(400).json({success:false, message:"All fields are required"});
    }

    //Check if email already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({succcess:false, message: 'Username already in use!' });
    }

    const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
        return res.status(400).json({success:false, message: 'Email already in use!'});
    }
 

    const user = new UserModel({username, email, password});

    try {
        const response = await registerUser(user);

        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(400).json(response)
        }
    }
    catch (error) {
        return {success:false, message:"Registration failed."}
    }

    //Can add email / password format validation here as well
}

export const log = async(req, res) => {
    const {username, password} = req.body;


        //Ensure all fields are filled
        if (!username || !password) {
            return res.status(400).json({success:false, message:"All fields are required"});
        }

        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length === 0) {
            return res.status(400).json({success:false, message: 'That username does not exist!'});
        }

        const user = existingUser[0];

        //Compare entered password to stored hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({success:false, message: 'Incorrect password!'});
        }

        res.status(200).json({success:true, message: 'Login successful!'});

}