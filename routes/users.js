const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all users with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('role').optional().isString(),
  query('status').optional().isIn(['Active', 'Inactive', 'On-leave'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    // Build include clause
    const includeClause = [{
      model: Role,
      as: 'role',
      where: role ? { name: role } : undefined
    }];

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        avatarUrl: user.avatarUrl,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user'
    });
  }
});

// Create new user
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('roleId').isUUID(),
  body('status').optional().isIn(['Active', 'Inactive', 'On-leave'])
], requirePermission('User Management', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, email, password, roleId, status = 'Active' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'The specified role does not exist'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      roleId,
      status
    });

    // Create audit log
    await createAuditLog(req.user.id, 'User Created', { type: 'User', id: user.id, name: user.name }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: 'An error occurred while creating user'
    });
  }
});

// Update user
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('roleId').optional().isUUID(),
  body('status').optional().isIn(['Active', 'Inactive', 'On-leave'])
], requirePermission('User Management', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, roleId, status } = req.body;

    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'An account with this email already exists'
        });
      }
    }

    // Verify role exists if being changed
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'The specified role does not exist'
        });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (roleId) updateData.roleId = roleId;
    if (status) updateData.status = status;

    await user.update(updateData);

    // Create audit log
    await createAuditLog(req.user.id, 'User Updated', { type: 'User', id: user.id, name: user.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'An error occurred while updating user'
    });
  }
});

// Delete user
router.delete('/:id', requirePermission('User Management', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'User Deleted', { type: 'User', id: user.id, name: user.name }, `Deleted by ${req.user.name}`);

    await user.destroy();

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'An error occurred while deleting user'
    });
  }
});

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }))
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: 'An error occurred while fetching roles'
    });
  }
});

// Update role permissions
router.put('/roles/:id/permissions', [
  body('permissions').isObject()
], requireRole(['Admin']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'No role found with the provided ID'
      });
    }

    await role.update({ permissions });

    // Create audit log
    await createAuditLog(req.user.id, 'Role Updated', { type: 'Role', id: role.id, name: role.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Role permissions updated successfully',
      role: {
        id: role.id,
        name: role.name,
        permissions: role.permissions
      }
    });

  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      error: 'Failed to update role permissions',
      message: 'An error occurred while updating role permissions'
    });
  }
});

module.exports = router; 