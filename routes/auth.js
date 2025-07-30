const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const Student = require('../models/Student');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Register validation
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('admissionNumber').optional().isString(),
  body('guardianPhone').optional().isMobilePhone('any')
];

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with role
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      await createAuditLog(null, 'Login Failure', { type: 'Auth', name: email }, `IP: ${req.ip}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is active
    if (user.status !== 'Active') {
      await createAuditLog(null, 'Login Failure', { type: 'Auth', name: email }, `IP: ${req.ip} - Account ${user.status}`);
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await createAuditLog(null, 'Login Failure', { type: 'Auth', name: email }, `IP: ${req.ip}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Create audit log
    await createAuditLog(user.id, 'Login Success', { type: 'Auth', name: email }, `IP: ${req.ip}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.json({
        message: 'Two-factor authentication required',
        requires2FA: true,
        userId: user.id
      });
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        avatarUrl: user.avatarUrl,
        studentId: user.studentId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, email, password, admissionNumber, guardianPhone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Find student role
    const studentRole = await Role.findOne({ where: { name: 'Student' } });
    if (!studentRole) {
      return res.status(500).json({
        error: 'Role not found',
        message: 'Student role not configured'
      });
    }

    // Find student by admission number
    let student = null;
    if (admissionNumber) {
      student = await Student.findOne({ where: { admissionNumber } });
      if (!student) {
        return res.status(404).json({
          error: 'Student not found',
          message: 'No student found with this admission number'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      roleId: studentRole.id,
      studentId: student?.id || null
    });

    // Update student registration if found
    if (student) {
      await student.update({
        isRegistered: true,
        registrationDate: new Date(),
        guardianPhone: guardianPhone || student.guardianPhone
      });
    }

    // Create audit log
    await createAuditLog(user.id, 'User Created', { type: 'User', id: user.id, name: user.name }, 'Student registration');

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'Student',
        status: user.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// Two-factor authentication verification
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and OTP are required'
      });
    }

    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'User not found or 2FA not enabled'
      });
    }

    // Verify OTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 2 // Allow 2 time steps in case of slight time difference
    });

    if (!verified) {
      return res.status(401).json({
        error: 'Invalid OTP',
        message: 'The provided OTP is invalid or expired'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Two-factor authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        avatarUrl: user.avatarUrl,
        studentId: user.studentId
      }
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      error: '2FA verification failed',
      message: 'An error occurred during verification'
    });
  }
});

// Setup two-factor authentication
router.post('/setup-2fa', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and OTP are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify OTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({
        error: 'Invalid OTP',
        message: 'The provided OTP is invalid or expired'
      });
    }

    // Enable 2FA
    await user.update({
      twoFactorEnabled: true
    });

    // Create audit log
    await createAuditLog(user.id, 'System Settings Changed', { type: 'System', name: 'Two-Factor Authentication' }, '2FA enabled');

    res.json({
      message: 'Two-factor authentication enabled successfully'
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      error: '2FA setup failed',
      message: 'An error occurred during setup'
    });
  }
});

// Get QR code for 2FA setup
router.get('/qr-code/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Generate secret if not exists
    if (!user.twoFactorSecret) {
      const secret = speakeasy.generateSecret({
        name: `JafaSol:${user.email}`,
        issuer: 'JafaSol'
      });

      await user.update({
        twoFactorSecret: secret.base32
      });
    }

    // Generate QR code
    const qrCodeUrl = `otpauth://totp/JafaSol:${user.email}?secret=${user.twoFactorSecret}&issuer=JafaSol`;
    const qrCodeDataUrl = await qrcode.toDataURL(qrCodeUrl);

    res.json({
      qrCode: qrCodeDataUrl,
      secret: user.twoFactorSecret
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      error: 'QR code generation failed',
      message: 'An error occurred while generating QR code'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    });
  }
});

module.exports = router; 