import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

export const registerUser = async(user) => {
    console.log(user);

    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const query = `INSERT INTO users (username,email,password_hash) VALUES (?,?,?)`
        const values = [user.username, user.email, hashedPassword];

        await pool.query(query, values);

        return {success:true, message:"User Registered Successfully!"}
    }
    catch (error) {
        console.log(error);
        return {success:false, message:"Registration failed. Please try again later.", error}
    }
}