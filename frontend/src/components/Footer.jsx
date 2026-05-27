import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Mail } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <BrandLogo />
            <span className="footer-wordmark">KH Nexa</span>
          </Link>
          <p>Your one-stop shop for quality products at great prices.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/products">All Products</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-links">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/profile">My Profile</Link>
        </div>

        <div className="footer-links">
          <h4>Contact</h4>
          <a href="mailto:support@khnexa.com">
            <Mail size={14} /> support@khnexa.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} KH Nexa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
