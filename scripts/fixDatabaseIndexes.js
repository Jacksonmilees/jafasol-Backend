const mongoose = require('mongoose');

async function fixDatabaseIndexes() {
  try {
    console.log('🔧 FIXING DATABASE INDEXES...');
    
    // Connect to the school database
    const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    
    console.log('📝 Step 1: Checking current indexes...');
    
    // Get the database instance
    const db = connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections found:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check indexes for specific collections that might have duplicate indexes
    const collectionsToCheck = ['subjects', 'roles', 'schoolclasses', 'students', 'teachers'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`\n📝 Checking indexes for ${collectionName}...`);
        const indexes = await db.collection(collectionName).indexes();
        
        console.log(`  Indexes in ${collectionName}:`);
        indexes.forEach((index, i) => {
          console.log(`    ${i}: ${JSON.stringify(index.key)}`);
        });
        
        // Check for duplicate indexes on name and code fields
        const nameIndexes = indexes.filter(index => 
          Object.keys(index.key).includes('name') && index.key.name === 1
        );
        
        const codeIndexes = indexes.filter(index => 
          Object.keys(index.key).includes('code') && index.key.code === 1
        );
        
        if (nameIndexes.length > 1) {
          console.log(`  ⚠️  Found ${nameIndexes.length} indexes on 'name' field`);
          // Drop duplicate indexes (keep the first one)
          for (let i = 1; i < nameIndexes.length; i++) {
            const indexName = nameIndexes[i].name;
            console.log(`  🗑️  Dropping duplicate index: ${indexName}`);
            await db.collection(collectionName).dropIndex(indexName);
          }
        }
        
        if (codeIndexes.length > 1) {
          console.log(`  ⚠️  Found ${codeIndexes.length} indexes on 'code' field`);
          // Drop duplicate indexes (keep the first one)
          for (let i = 1; i < codeIndexes.length; i++) {
            const indexName = codeIndexes[i].name;
            console.log(`  🗑️  Dropping duplicate index: ${indexName}`);
            await db.collection(collectionName).dropIndex(indexName);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error checking ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n📝 Step 2: Rebuilding indexes...');
    
    // Rebuild indexes for the main collections
    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`  🔄 Rebuilding indexes for ${collectionName}...`);
        await db.collection(collectionName).createIndexes();
        console.log(`  ✅ Indexes rebuilt for ${collectionName}`);
      } catch (error) {
        console.log(`  ❌ Error rebuilding ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database index fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

fixDatabaseIndexes();



