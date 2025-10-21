import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css'

export const Login = () => {

    return (
        <div className='login-container'>
            <h2>Login</h2>
            <form>
                <div className='form-group'>
                    <label>Username</label>
                    <input
                        type='text'
                        placeholder='Enter your username'
                        name='username'
                    />
                </div>
                <div className='form-group'>
                    <label>Password</label>
                    <input
                        type='password'
                        placeholder='Enter your password'
                        name='password'
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