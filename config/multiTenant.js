const mongoose = require('mongoose');

// Tenant configuration
class MultiTenantManager {
  constructor() {
    this.connections = new Map();
    this.defaultConnection = null;
  }

  // Get tenant-specific database connection
  async getTenantConnection(tenantId) {
    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId);
    }

    // Create new connection for tenant
    const tenantDbName = `jafasol_${tenantId}`;
    const tenantURI = process.env.MONGODB_URI.replace('/jafasol?', `/${tenantDbName}?`);
    
    try {
      const connection = await mongoose.createConnection(tenantURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      // Store connection
      this.connections.set(tenantId, connection);
      
      console.log(`✅ Tenant ${tenantId} database connected: ${tenantDbName}`);
      return connection;
    } catch (error) {
      console.error(`❌ Failed to connect tenant ${tenantId}:`, error.message);
      throw error;
    }
  }

  // Get default connection (for system-wide operations)
  async getDefaultConnection() {
    if (!this.defaultConnection) {
      const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
      
      this.defaultConnection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    return this.defaultConnection;
  }

  // Close all tenant connections
  async closeAllConnections() {
    for (const [tenantId, connection] of this.connections) {
      await connection.close();
      console.log(`✅ Closed connection for tenant ${tenantId}`);
    }
    this.connections.clear();
    
    if (this.defaultConnection) {
      await mongoose.disconnect();
      this.defaultConnection = null;
    }
  }

  // List all tenants
  async listTenants() {
    const connection = await this.getDefaultConnection();
    const adminDb = connection.connection.db.admin();
    const databases = await adminDb.listDatabases();
    
    return databases.databases
      .filter(db => db.name.startsWith('jafasol_'))
      .map(db => ({
        tenantId: db.name.replace('jafasol_', ''),
        databaseName: db.name,
        sizeOnDisk: db.sizeOnDisk
      }));
  }

  // Create new tenant
  async createTenant(tenantId, tenantInfo) {
    try {
      // Get tenant connection (this will create the database)
      const connection = await this.getTenantConnection(tenantId);
      
      // Create tenant record in system database
      const systemConnection = await this.getDefaultConnection();
      const Tenant = systemConnection.model('Tenant', new mongoose.Schema({
        tenantId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        domain: { type: String },
        contactEmail: { type: String },
        contactPhone: { type: String },
        subscriptionPlan: { type: String, default: 'basic' },
        status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
        settings: { type: mongoose.Schema.Types.Mixed, default: {} }
      }));

      const tenant = new Tenant({
        tenantId,
        ...tenantInfo
      });

      await tenant.save();
      
      console.log(`✅ Tenant ${tenantId} created successfully`);
      return tenant;
    } catch (error) {
      console.error(`❌ Failed to create tenant ${tenantId}:`, error.message);
      throw error;
    }
  }

  // Get tenant info
  async getTenantInfo(tenantId) {
    const connection = await this.getDefaultConnection();
    const Tenant = connection.model('Tenant');
    
    return await Tenant.findOne({ tenantId });
  }

  // Update tenant
  async updateTenant(tenantId, updates) {
    const connection = await this.getDefaultConnection();
    const Tenant = connection.model('Tenant');
    
    return await Tenant.findOneAndUpdate(
      { tenantId },
      updates,
      { new: true }
    );
  }

  // Delete tenant (with data cleanup)
  async deleteTenant(tenantId) {
    try {
      // Delete tenant database
      const connection = await this.getTenantConnection(tenantId);
      await connection.connection.db.dropDatabase();
      
      // Remove tenant record
      const systemConnection = await this.getDefaultConnection();
      const Tenant = systemConnection.model('Tenant');
      await Tenant.findOneAndDelete({ tenantId });
      
      // Close connection
      await connection.close();
      this.connections.delete(tenantId);
      
      console.log(`✅ Tenant ${tenantId} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete tenant ${tenantId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const multiTenantManager = new MultiTenantManager();

module.exports = multiTenantManager; 