import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export const SignUp = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const[formValues, setFormValues] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormValues({...formValues,[name]:value}); //Will preserve previous form values
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        try {
            const response = await api.post("/auth/register-user", formValues);
            console.log(response, 'res');

            if (response.data.success && response.data.token) {
                // Use auth context to store user data
                login(response.data.user, response.data.token);

                toast.success(response.data.message);
                // Redirect to profile after successful signup
                navigate('/profile');
            }
        }
        catch (error) {
            if (error.response) {
                toast.error(error.response.data.message || 'Registration failed');
            }
            else {
                toast.error("Server unavailable. Please try again later.")
            }
            
            console.error('Error during registration:', error);
        }
    }


    return (
        <div className='login-container'>
            <h2>Sign Up</h2>
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
                    <label>Email</label>
                    <input
                        type='email'
                        placeholder='Enter your email'
                        name='email'
                        value={formValues.email}
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
                    Sign Up
                </button>
            </form>
            <p>
                Already have an account?{" "}
                <Link
                    to='/login'
                    className='toggle-link'
                >
                    Login
                </Link>
            </p>
        </div>
    );
};