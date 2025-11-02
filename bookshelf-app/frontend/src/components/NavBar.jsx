import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NavBar.css';

export const NavBar = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <nav className='navbar'>
            <h2 className='logo'><Link to='/'>Shelf.</Link></h2>
            <ul className='nav-links'>
                {isAuthenticated ? (
                    <>
                        <li>
                            <Link to='/profile' className='user-name'>
                                {user?.username}
                            </Link>
                        </li>
                    </>
                ) : (
                    <>
                        <li><Link to='/login'>Login</Link></li>
                        <li><Link to='/signup'>Sign Up</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};
