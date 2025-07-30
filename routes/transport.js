const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Mock data for transport management (in a real app, these would be database models)
let vehicles = [
  {
    id: '1',
    vehicleNumber: 'KCA 123A',
    vehicleType: 'Bus',
    capacity: 45,
    driverName: 'John Doe',
    driverPhone: '+254700123456',
    status: 'Active',
    route: 'Route A',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    vehicleNumber: 'KCB 456B',
    vehicleType: 'Minibus',
    capacity: 25,
    driverName: 'Jane Smith',
    driverPhone: '+254700789012',
    status: 'Active',
    route: 'Route B',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let routes = [
  {
    id: '1',
    routeName: 'Route A',
    startPoint: 'Nairobi CBD',
    endPoint: 'Westlands',
    stops: ['CBD', 'Westlands', 'Kilimani', 'Lavington'],
    estimatedTime: '45 minutes',
    vehicleId: '1',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    routeName: 'Route B',
    startPoint: 'Nairobi CBD',
    endPoint: 'Eastlands',
    stops: ['CBD', 'Eastlands', 'Buruburu', 'Donholm'],
    estimatedTime: '30 minutes',
    vehicleId: '2',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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

    // Filter vehicles
    let filteredVehicles = vehicles;
    
    if (search) {
      filteredVehicles = filteredVehicles.filter(vehicle =>
        vehicle.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.driverName.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.route.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === status);
    }
    
    if (vehicleType) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.vehicleType === vehicleType);
    }

    const total = filteredVehicles.length;
    const paginatedVehicles = filteredVehicles.slice(offset, offset + limit);

    res.json({
      vehicles: paginatedVehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

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
    const vehicle = vehicles.find(v => v.id === id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    res.json({ vehicle });

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

    // Check if vehicle number already exists
    const existingVehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
    if (existingVehicle) {
      return res.status(409).json({
        error: 'Vehicle already exists',
        message: 'A vehicle with this number already exists'
      });
    }

    const newVehicle = {
      id: (vehicles.length + 1).toString(),
      vehicleNumber,
      vehicleType,
      capacity,
      driverName,
      driverPhone,
      route: route || '',
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vehicles.push(newVehicle);

    // Create audit log
    await createAuditLog(req.user.id, 'Vehicle Created', { type: 'Vehicle', id: newVehicle.id, vehicleNumber: newVehicle.vehicleNumber }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: newVehicle
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
    const vehicleIndex = vehicles.findIndex(v => v.id === id);

    if (vehicleIndex === -1) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    const vehicle = vehicles[vehicleIndex];
    const { vehicleNumber, vehicleType, capacity, driverName, driverPhone, route, status } = req.body;

    // Check if vehicle number is being changed and if it already exists
    if (vehicleNumber && vehicleNumber !== vehicle.vehicleNumber) {
      const existingVehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
      if (existingVehicle) {
        return res.status(409).json({
          error: 'Vehicle number already exists',
          message: 'A vehicle with this number already exists'
        });
      }
    }

    // Update vehicle
    if (vehicleNumber) vehicle.vehicleNumber = vehicleNumber;
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (capacity) vehicle.capacity = capacity;
    if (driverName) vehicle.driverName = driverName;
    if (driverPhone) vehicle.driverPhone = driverPhone;
    if (route !== undefined) vehicle.route = route;
    if (status) vehicle.status = status;
    vehicle.updatedAt = new Date();

    vehicles[vehicleIndex] = vehicle;

    // Create audit log
    await createAuditLog(req.user.id, 'Vehicle Updated', { type: 'Vehicle', id: vehicle.id, vehicleNumber: vehicle.vehicleNumber }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Vehicle updated successfully',
      vehicle
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
    const vehicleIndex = vehicles.findIndex(v => v.id === id);

    if (vehicleIndex === -1) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'No vehicle found with the provided ID'
      });
    }

    const vehicle = vehicles[vehicleIndex];

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Vehicle Deleted', { type: 'Vehicle', id: vehicle.id, vehicleNumber: vehicle.vehicleNumber }, `Deleted by ${req.user.name}`);

    vehicles.splice(vehicleIndex, 1);

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

    // Filter routes
    let filteredRoutes = routes;
    
    if (search) {
      filteredRoutes = filteredRoutes.filter(route =>
        route.routeName.toLowerCase().includes(search.toLowerCase()) ||
        route.startPoint.toLowerCase().includes(search.toLowerCase()) ||
        route.endPoint.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredRoutes = filteredRoutes.filter(route => route.status === status);
    }

    const total = filteredRoutes.length;
    const paginatedRoutes = filteredRoutes.slice(offset, offset + limit);

    res.json({
      routes: paginatedRoutes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

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
    const route = routes.find(r => r.id === id);

    if (!route) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    res.json({ route });

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

    // Check if route name already exists
    const existingRoute = routes.find(r => r.routeName === routeName);
    if (existingRoute) {
      return res.status(409).json({
        error: 'Route already exists',
        message: 'A route with this name already exists'
      });
    }

    const newRoute = {
      id: (routes.length + 1).toString(),
      routeName,
      startPoint,
      endPoint,
      stops,
      estimatedTime,
      vehicleId: vehicleId || null,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    routes.push(newRoute);

    // Create audit log
    await createAuditLog(req.user.id, 'Route Created', { type: 'Route', id: newRoute.id, routeName: newRoute.routeName }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Route created successfully',
      route: newRoute
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
    const routeIndex = routes.findIndex(r => r.id === id);

    if (routeIndex === -1) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    const route = routes[routeIndex];
    const { routeName, startPoint, endPoint, stops, estimatedTime, vehicleId, status } = req.body;

    // Check if route name is being changed and if it already exists
    if (routeName && routeName !== route.routeName) {
      const existingRoute = routes.find(r => r.routeName === routeName);
      if (existingRoute) {
        return res.status(409).json({
          error: 'Route name already exists',
          message: 'A route with this name already exists'
        });
      }
    }

    // Update route
    if (routeName) route.routeName = routeName;
    if (startPoint) route.startPoint = startPoint;
    if (endPoint) route.endPoint = endPoint;
    if (stops) route.stops = stops;
    if (estimatedTime) route.estimatedTime = estimatedTime;
    if (vehicleId !== undefined) route.vehicleId = vehicleId;
    if (status) route.status = status;
    route.updatedAt = new Date();

    routes[routeIndex] = route;

    // Create audit log
    await createAuditLog(req.user.id, 'Route Updated', { type: 'Route', id: route.id, routeName: route.routeName }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Route updated successfully',
      route
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
    const routeIndex = routes.findIndex(r => r.id === id);

    if (routeIndex === -1) {
      return res.status(404).json({
        error: 'Route not found',
        message: 'No route found with the provided ID'
      });
    }

    const route = routes[routeIndex];

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Route Deleted', { type: 'Route', id: route.id, routeName: route.routeName }, `Deleted by ${req.user.name}`);

    routes.splice(routeIndex, 1);

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
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
    const totalRoutes = routes.length;
    const activeRoutes = routes.filter(r => r.status === 'Active').length;
    const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);

    const vehicleTypes = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.vehicleType] = (acc[vehicle.vehicleType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      statistics: {
        totalVehicles,
        activeVehicles,
        totalRoutes,
        activeRoutes,
        totalCapacity,
        vehicleTypes
      }
    });

  } catch (error) {
    console.error('Get transport statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch transport statistics',
      message: 'An error occurred while fetching transport statistics'
    });
  }
});

module.exports = router; 