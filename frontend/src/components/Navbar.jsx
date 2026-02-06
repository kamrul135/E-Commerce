import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Package, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <Package size={28} />
          <span>ShopHub</span>
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>
            Products
          </Link>

          {user ? (
            <>
              <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
                Orders
              </Link>
              <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                <User size={18} />
                {user.name?.split(' ')[0] || 'Profile'}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link nav-admin" onClick={() => setMenuOpen(false)}>
                  <Shield size={18} />
                  Admin
                </Link>
              )}
              <button className="nav-link nav-logout" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <Link to="/cart" className="nav-cart" onClick={() => setMenuOpen(false)}>
              <ShoppingCart size={22} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>
          )}
        </div>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
