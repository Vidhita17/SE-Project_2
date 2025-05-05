const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    console.log('Received signup request:', req.body);
    const { email, password, role, name } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: { 
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          role: !role ? 'Role is required' : null,
          name: !name ? 'Name is required' : null
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate email domain (except for admins)
    if (role !== 'admin' && !email.endsWith('@mahindrauniversity.edu.in')) {
      console.log('Invalid email domain:', email);
      return res.status(400).json({ message: 'Email must be a valid Mahindra University email' });
    }

    // Validate password length
    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      ...req.body,
      password: hashedPassword,
    };

    console.log('Creating new user with data:', { ...userData, password: '[HIDDEN]' });

    const newUser = new User(userData);
    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    console.log('User created successfully:', newUser._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error details:', error);
    
    // Return specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: messages 
      });
    }
    
    // Database errors (like unique constraint violations)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// @desc    Login user and get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  signup,
  login
};
