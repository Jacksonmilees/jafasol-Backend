const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Vehicle, Route } = require('../models');
const redis = require('redis');

const router = express.Router();

// Redis client for caching
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Cache helper functions
const cacheKey = (prefix, schoolSubdomain, params = '') => {
  return `${prefix}:${schoolSubdomain}:${params}`;
};

const getCachedData = async (key) => {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const setCachedData = async (key, data, expireTime = 300) => {
  try {
    await redisClient.setEx(key, expireTime, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

const invalidateCache = async (prefix, schoolSubdomain) => {
  try {
    const keys = await redisClient.keys(`${prefix}:${schoolSubdomain}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
};

// Get all vehicles with pagination and filtering
router.get('/vehicles', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['Active', 'Inactive', 'Maintenance']),
  query('vehicleType').optional().isString()
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
    const { search, status, vehicleType } = req.query;
    const schoolSubdomain = req.schoolSubdomain;

    // Try to get from cache first
    const cacheParams = `page=${page}&limit=${limit}&search=${search || ''}&status=${status || ''}&vehicleType=${vehicleType || ''}`;
    const cacheKeyName = cacheKey('vehicles', schoolSubdomain, cacheParams);
    const cachedData = await getCachedData(cacheKeyName);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build query
    const whereClause = { schoolSubdomain };
    
    if (search) {
      whereClause.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (vehicleType) {
      whereClause.vehicleType = vehicleType;
    }

    // Execute query
    const [vehicles, total] = await Promise.all([
      Vehicle.find(whereClause)
        .populate('route', 'routeName')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(whereClause)
    ]);

    const result = {
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the result
    await setCachedData(cacheKeyName, result);

    res.json(result);

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      message: 'An error occurred while fetching vehicles'
    });
  }
});

// Get vehicle by ID
router.get('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schoolSubdomain = req.schoolSubdomain;

    // Try to get from cache first
    const cacheKeyName = cacheKey('vehicle', schoolSubdomain, id);
    const cachedData = await getCachedData(cacheKeyName);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const vehicle = await Vehicle.findOne({ _id: id, schoolSubdomain })
      .populate('route', 'routeName startPoint endPoint')
      .lean();

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    const result = { data: vehicle };

    // Cache the result
    await setCachedData(cacheKeyName, result);

    res.json(result);

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle',
      message: 'An error occurred while fetching vehicle'
    });
  }
});

// Create new vehicle
router.post('/vehicles', [
  body('vehicleNumber').trim().isLength({ min: 3, max: 20 }),
  body('vehicleType').isIn(['Bus', 'Minibus', 'Van', 'Car']),
  body('capacity').isInt({ min: 1, max: 100 }),
  body('driverName').trim().isLength({ min: 2, max: 50 }),
  body('driverPhone').matches(/^\+254\d{9}$/),
  body('route').optional().trim().isLength({ min: 2, max: 50 }),
  body('status').optional().isIn(['Active', 'Inactive', 'Maintenance'])
], requirePermission('Transport Management', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { vehicleNumber, vehicleType, capacity, driverName, driverPhone, route, status = 'Active' } = req.body;
    const schoolSubdomain = req.schoolSubdomain;

    // Check if vehicle number already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNumber, schoolSubdomain });
    if (existingVehicle) {
      return res.status(409).json({
        error: 'Vehicle already exists',
        message: 'A vehicle with this number already exists'
      });
    }

    const newVehicle = new Vehicle({
      vehicleNumber,
      vehicleType,
      capacity,
      driverName,
      driverPhone,
      route: route || null,
      status,
      schoolSubdomain
    });

    await newVehicle.save();

    // Invalidate cache
    await invalidateCache('vehicles', schoolSubdomain);
    await invalidateCache('vehicle', schoolSubdomain);

    // Create audit log
    await createAuditLog(req.user.id, 'Vehicle Created', { 
      type: 'Vehicle', 
      id: newVehicle._id, 
      vehicleNumber: newVehicle.vehicleNumber 
    }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Vehicle created successfully',
      data: newVehicle
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      error: 'Failed to create vehicle',
      message: 'An error occurred while creating vehicle'
    });
  }
});

// Update vehicle
router.put('/vehicles/:id', [
  body('vehicleNumber').optional().trim().isLength({ min: 3, max: 20 }),
  body('vehicleType').optional().isIn(['Bus', 'Minibus', 'Van', 'Car']),
  body('capacity').optional().isInt({ min: 1, max: 100 }),
  body('driverName').optional().trim().isLength({ min: 2, max: 50 }),
  body('driverPhone').optional().matches(/^\+254\d{9}$/),
  body('route').optional().trim().isLength({ min: 2, max: 50 }),
  body('status').optional().isIn(['Active', 'Inactive', 'Maintenance'])
], requirePermission('Transport Management', 'edit'), async (req, res) => {
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
    const schoolSubdomain = req.schoolSubdomain;
    const updateData = req.body;

    const vehicle = await Vehicle.findOne({ _id: id, schoolSubdomain });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    // Check if vehicle number is being changed and if it already exists
    if (updateData.vehicleNumber && updateData.vehicleNumber !== vehicle.vehicleNumber) {
      const existingVehicle = await Vehicle.findOne({ 
        vehicleNumber: updateData.vehicleNumber, 
        schoolSubdomain,
        _id: { $ne: id }
      });
      if (existingVehicle) {
        return res.status(409).json({
          error: 'Vehicle number already exists',
          message: 'A vehicle with this number already exists'
        });
      }
    }

    // Update vehicle
    Object.assign(vehicle, updateData);
    await vehicle.save();

    // Invalidate cache
    await invalidateCache('vehicles', schoolSubdomain);
    await invalidateCache('vehicle', schoolSubdomain);

    // Create audit log
    await createAuditLog(req.user.id, 'Vehicle Updated', { 
      type: 'Vehicle', 
      id: vehicle._id, 
      vehicleNumber: vehicle.vehicleNumber 
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Vehicle updated successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      error: 'Failed to update vehicle',
      message: 'An error occurred while updating vehicle'
    });
  }
});

// Delete vehicle
router.delete('/vehicles/:id', requirePermission('Transport Management', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const schoolSubdomain = req.schoolSubdomain;

    const vehicle = await Vehicle.findOne({ _id: id, schoolSubdomain });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Vehicle Deleted', { 
      type: 'Vehicle', 
      id: vehicle._id, 
      vehicleNumber: vehicle.vehicleNumber 
    }, `Deleted by ${req.user.name}`);

    await Vehicle.findByIdAndDelete(id);

    // Invalidate cache
    await invalidateCache('vehicles', schoolSubdomain);
    await invalidateCache('vehicle', schoolSubdomain);

    res.json({
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      error: 'Failed to delete vehicle',
      message: 'An error occurred while deleting vehicle'
    });
  }
});

// Get all routes with pagination and filtering
router.get('/routes', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['Active', 'Inactive'])
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
    const { search, status } = req.query;
    const schoolSubdomain = req.schoolSubdomain;

    // Try to get from cache first
    const cacheParams = `page=${page}&limit=${limit}&search=${search || ''}&status=${status || ''}`;
    const cacheKeyName = cacheKey('routes', schoolSubdomain, cacheParams);
    const cachedData = await getCachedData(cacheKeyName);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build query
    const whereClause = { schoolSubdomain };
    
    if (search) {
      whereClause.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { startPoint: { $regex: search, $options: 'i' } },
        { endPoint: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Execute query
    const [routes, total] = await Promise.all([
      Route.find(whereClause)
        .populate('vehicleId', 'vehicleNumber driverName')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Route.countDocuments(whereClause)
    ]);

    const result = {
      data: routes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the result
    await setCachedData(cacheKeyName, result);

    res.json(result);

  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({
      error: 'Failed to fetch routes',
      message: 'An error occurred while fetching routes'
    });
  }
});

// Get route by ID
router.get('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schoolSubdomain = req.schoolSubdomain;

    // Try to get from cache first
    const cacheKeyName = cacheKey('route', schoolSubdomain, id);
    const cachedData = await getCachedData(cacheKeyName);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const route = await Route.findOne({ _id: id, schoolSubdomain })
      .populate('vehicleId', 'vehicleNumber driverName')
      .lean();

    if (!route) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    const result = { data: route };

    // Cache the result
    await setCachedData(cacheKeyName, result);

    res.json(result);

  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({
      error: 'Failed to fetch route',
      message: 'An error occurred while fetching route'
    });
  }
});

// Create new route
router.post('/routes', [
  body('routeName').trim().isLength({ min: 2, max: 50 }),
  body('startPoint').trim().isLength({ min: 2, max: 100 }),
  body('endPoint').trim().isLength({ min: 2, max: 100 }),
  body('stops').isArray({ min: 1 }),
  body('estimatedTime').trim().isLength({ min: 2, max: 50 }),
  body('vehicleId').optional().isString(),
  body('status').optional().isIn(['Active', 'Inactive'])
], requirePermission('Transport Management', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { routeName, startPoint, endPoint, stops, estimatedTime, vehicleId, status = 'Active' } = req.body;
    const schoolSubdomain = req.schoolSubdomain;

    // Check if route name already exists
    const existingRoute = await Route.findOne({ routeName, schoolSubdomain });
    if (existingRoute) {
      return res.status(409).json({
        error: 'Route already exists',
        message: 'A route with this name already exists'
      });
    }

    const newRoute = new Route({
      routeName,
      startPoint,
      endPoint,
      stops,
      estimatedTime,
      vehicleId: vehicleId || null,
      status,
      schoolSubdomain
    });

    await newRoute.save();

    // Invalidate cache
    await invalidateCache('routes', schoolSubdomain);
    await invalidateCache('route', schoolSubdomain);

    // Create audit log
    await createAuditLog(req.user.id, 'Route Created', { 
      type: 'Route', 
      id: newRoute._id, 
      routeName: newRoute.routeName 
    }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Route created successfully',
      data: newRoute
    });

  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({
      error: 'Failed to create route',
      message: 'An error occurred while creating route'
    });
  }
});

// Update route
router.put('/routes/:id', [
  body('routeName').optional().trim().isLength({ min: 2, max: 50 }),
  body('startPoint').optional().trim().isLength({ min: 2, max: 100 }),
  body('endPoint').optional().trim().isLength({ min: 2, max: 100 }),
  body('stops').optional().isArray({ min: 1 }),
  body('estimatedTime').optional().trim().isLength({ min: 2, max: 50 }),
  body('vehicleId').optional().isString(),
  body('status').optional().isIn(['Active', 'Inactive'])
], requirePermission('Transport Management', 'edit'), async (req, res) => {
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
    const schoolSubdomain = req.schoolSubdomain;
    const updateData = req.body;

    const route = await Route.findOne({ _id: id, schoolSubdomain });

    if (!route) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    // Check if route name is being changed and if it already exists
    if (updateData.routeName && updateData.routeName !== route.routeName) {
      const existingRoute = await Route.findOne({ 
        routeName: updateData.routeName, 
        schoolSubdomain,
        _id: { $ne: id }
      });
      if (existingRoute) {
        return res.status(409).json({
          error: 'Route name already exists',
          message: 'A route with this name already exists'
        });
      }
    }

    // Update route
    Object.assign(route, updateData);
    await route.save();

    // Invalidate cache
    await invalidateCache('routes', schoolSubdomain);
    await invalidateCache('route', schoolSubdomain);

    // Create audit log
    await createAuditLog(req.user.id, 'Route Updated', { 
      type: 'Route', 
      id: route._id, 
      routeName: route.routeName 
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Route updated successfully',
      data: route
    });

  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({
      error: 'Failed to update route',
      message: 'An error occurred while updating route'
    });
  }
});

// Delete route
router.delete('/routes/:id', requirePermission('Transport Management', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const schoolSubdomain = req.schoolSubdomain;

    const route = await Route.findOne({ _id: id, schoolSubdomain });

    if (!route) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Route Deleted', { 
      type: 'Route', 
      id: route._id, 
      routeName: route.routeName 
    }, `Deleted by ${req.user.name}`);

    await Route.findByIdAndDelete(id);

    // Invalidate cache
    await invalidateCache('routes', schoolSubdomain);
    await invalidateCache('route', schoolSubdomain);

    res.json({
      message: 'Route deleted successfully'
    });

  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      error: 'Failed to delete route',
      message: 'An error occurred while deleting route'
    });
  }
});

// Get transport statistics
router.get('/statistics', async (req, res) => {
  try {
    const schoolSubdomain = req.schoolSubdomain;

    // Try to get from cache first
    const cacheKeyName = cacheKey('transport_stats', schoolSubdomain);
    const cachedData = await getCachedData(cacheKeyName);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const [
      totalVehicles,
      activeVehicles,
      totalRoutes,
      activeRoutes,
      vehicleTypes,
      totalCapacity
    ] = await Promise.all([
      Vehicle.countDocuments({ schoolSubdomain }),
      Vehicle.countDocuments({ schoolSubdomain, status: 'Active' }),
      Route.countDocuments({ schoolSubdomain }),
      Route.countDocuments({ schoolSubdomain, status: 'Active' }),
      Vehicle.aggregate([
        { $match: { schoolSubdomain } },
        { $group: { _id: '$vehicleType', count: { $sum: 1 } } }
      ]),
      Vehicle.aggregate([
        { $match: { schoolSubdomain } },
        { $group: { _id: null, total: { $sum: '$capacity' } } }
      ])
    ]);

    const vehicleTypesMap = vehicleTypes.reduce((acc, type) => {
      acc[type._id] = type.count;
      return acc;
    }, {});

    const result = {
      data: {
        totalVehicles,
        activeVehicles,
        totalRoutes,
        activeRoutes,
        totalCapacity: totalCapacity[0]?.total || 0,
        vehicleTypes: vehicleTypesMap
      }
    };

    // Cache the result for 5 minutes
    await setCachedData(cacheKeyName, result, 300);

    res.json(result);

  } catch (error) {
    console.error('Get transport statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch transport statistics',
      message: 'An error occurred while fetching transport statistics'
    });
  }
});

module.exports = router; 