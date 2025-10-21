import { Link } from 'react-router-dom';
import './NavBar.css';

export const NavBar = () => {
    return (
        <nav className='navbar'>
            <h2 className='logo'><Link to='/'>Shelf.</Link></h2>
            <ul className='nav-links'>
                <li><Link to='/login'>Login</Link></li>
                <li><Link to='/signup'>Sign Up</Link></li>
            </ul>
        </nav>
    );
};