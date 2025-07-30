const express = require('express');
const { body, validationResult } = require('express-validator');
const multiTenantManager = require('../config/multiTenant');
const tenantOnboarding = require('../utils/tenantOnboarding');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation for tenant creation
const createTenantValidation = [
  body('tenantId').isString().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9-]+$/),
  body('name').isString().isLength({ min: 2, max: 100 }),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isMobilePhone('any'),
  body('domain').optional().isURL(),
  body('subscriptionPlan').optional().isIn(['basic', 'premium', 'enterprise']),
  body('expiresAt').optional().isISO8601()
];

// Create new tenant (admin only)
router.post('/create', authenticateToken, createTenantValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { tenantId, ...tenantInfo } = req.body;

    // Check if tenant already exists
    const existingTenant = await multiTenantManager.getTenantInfo(tenantId);
    if (existingTenant) {
      return res.status(409).json({
        error: 'Tenant already exists',
        message: `Tenant '${tenantId}' already exists`
      });
    }

    // Create new tenant
    const tenant = await multiTenantManager.createTenant(tenantId, tenantInfo);

    // Automatically onboard the tenant
    const onboardingResult = await tenantOnboarding.onboardTenant(tenantId, tenantInfo);

    res.status(201).json({
      message: 'Tenant created and onboarded successfully',
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        status: tenant.status,
        createdAt: tenant.createdAt
      },
      onboarding: {
        roles: onboardingResult.roles,
        subjects: onboardingResult.subjects,
        classes: onboardingResult.classes,
        superAdmin: onboardingResult.superAdmin,
        settings: onboardingResult.settings
      }
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({
      error: 'Tenant creation failed',
      message: error.message
    });
  }
});

// List all tenants (admin only)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const tenants = await multiTenantManager.listTenants();
    
    res.json({
      message: 'Tenants retrieved successfully',
      tenants: tenants.map(tenant => ({
        tenantId: tenant.tenantId,
        databaseName: tenant.databaseName,
        sizeOnDisk: tenant.sizeOnDisk
      }))
    });
  } catch (error) {
    console.error('Tenant listing error:', error);
    res.status(500).json({
      error: 'Failed to list tenants',
      message: error.message
    });
  }
});

// Get tenant info
router.get('/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await multiTenantManager.getTenantInfo(tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `Tenant '${tenantId}' does not exist`
      });
    }

    res.json({
      message: 'Tenant info retrieved successfully',
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        domain: tenant.domain,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        subscriptionPlan: tenant.subscriptionPlan,
        status: tenant.status,
        createdAt: tenant.createdAt,
        expiresAt: tenant.expiresAt,
        settings: tenant.settings
      }
    });
  } catch (error) {
    console.error('Tenant info error:', error);
    res.status(500).json({
      error: 'Failed to get tenant info',
      message: error.message
    });
  }
});

// Update tenant
router.put('/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    const updatedTenant = await multiTenantManager.updateTenant(tenantId, updates);
    
    if (!updatedTenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `Tenant '${tenantId}' does not exist`
      });
    }

    res.json({
      message: 'Tenant updated successfully',
      tenant: {
        tenantId: updatedTenant.tenantId,
        name: updatedTenant.name,
        status: updatedTenant.status,
        updatedAt: updatedTenant.updatedAt
      }
    });
  } catch (error) {
    console.error('Tenant update error:', error);
    res.status(500).json({
      error: 'Failed to update tenant',
      message: error.message
    });
  }
});

// Delete tenant (with data cleanup)
router.delete('/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check if tenant exists
    const tenant = await multiTenantManager.getTenantInfo(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `Tenant '${tenantId}' does not exist`
      });
    }

    // Delete tenant
    await multiTenantManager.deleteTenant(tenantId);

    res.json({
      message: 'Tenant deleted successfully',
      tenantId: tenantId
    });
  } catch (error) {
    console.error('Tenant deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete tenant',
      message: error.message
    });
  }
});

// Get tenant onboarding status
router.get('/:tenantId/onboarding-status', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const status = await tenantOnboarding.getOnboardingStatus(tenantId);
    
    res.json({
      message: 'Onboarding status retrieved successfully',
      status
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({
      error: 'Failed to get onboarding status',
      message: error.message
    });
  }
});

// Get tenant statistics
router.get('/:tenantId/stats', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Get tenant connection
    const connection = await multiTenantManager.getTenantConnection(tenantId);
    
    // Get database stats
    const dbStats = await connection.connection.db.stats();
    
    // Get collection counts
    const collections = await connection.connection.db.listCollections().toArray();
    const collectionStats = {};
    
    for (const collection of collections) {
      const count = await connection.connection.db.collection(collection.name).countDocuments();
      collectionStats[collection.name] = count;
    }

    res.json({
      message: 'Tenant statistics retrieved successfully',
      tenantId: tenantId,
      stats: {
        databaseSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        collections: collections.length,
        collectionStats: collectionStats
      }
    });
  } catch (error) {
    console.error('Tenant stats error:', error);
    res.status(500).json({
      error: 'Failed to get tenant statistics',
      message: error.message
    });
  }
});

module.exports = router; 