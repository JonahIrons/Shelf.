import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const SignUp = () => {

    return (
        <div className='login-container'>
            <h2>Sign Up</h2>
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
                    <label>Email</label>
                    <input
                        type='email'
                        placeholder='Enter your email'
                        name='email'
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