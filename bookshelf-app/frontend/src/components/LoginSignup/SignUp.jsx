import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const SignUp = () => {
    const[formValues, setFormValues] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormValues({...formValues,[name]:value}); //Will preserve previous form values
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formValues);
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