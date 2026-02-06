const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, password: hashedPassword });
      const token = generateToken(user);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken(user);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ user });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const user = await User.update(req.user.id, req.body);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ message: 'Profile updated', user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByEmail(req.user.email);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.updatePassword(req.user.id, hashedPassword);
      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  },
};

module.exports = authController;
