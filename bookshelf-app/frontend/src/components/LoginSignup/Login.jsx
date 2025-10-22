import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css'
import axios from 'axios';
import { toast } from 'react-toastify';

export const Login = () => {

    const[formValues, setFormValues] = useState({
        username: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormValues({...formValues,[name]:value}); //Will preserve previous form values
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        console.log(formValues);
        try {
            const response = await axios.post("http://localhost:3001/api/auth/log-user", formValues);
            console.log(response, 'res');

            toast.success(response.data.message);
        }
        catch (error) {
            if (error.response) {
                toast.error(error.response.data.message);
            }
            else {
                toast.error("Server unavailable. Please try again later.")
            }
            
            console.error('Error during login:', error);
        }
    }

    return (
        <div className='login-container'>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className='form-group'>
                    <label>Username</label>
                    <input
                        type='text'
                        placeholder='Enter your username'
                        name='username'
                        value={formValues.username}
                        onChange={handleInputChange}
                    />
                </div>
                <div className='form-group'>
                    <label>Password</label>
                    <input
                        type='password'
                        placeholder='Enter your password'
                        name='password'
                        value={formValues.password}
                        onChange={handleInputChange}
                    />
                </div>
                <button type='submit' className='login-btn'>
                    Login
                </button>
            </form>
            <p>
                Don't have an account?{" "}
                <Link
                    to='/signup'
                    className='toggle-link'
                >
                    SignUp
                </Link>
            </p>
        </div>
    );
};