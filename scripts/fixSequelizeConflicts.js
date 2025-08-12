const fs = require('fs');
const path = require('path');

function fixSequelizeConflicts() {
  console.log('🔧 FIXING SEQUELIZE/MONGOOSE CONFLICTS...');
  
  const modelsDir = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  // Identify Sequelize models that are causing conflicts
  const sequelizeModels = [];
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's a Sequelize model
    if (content.includes('require(\'sequelize\')') || content.includes('DataTypes')) {
      sequelizeModels.push(file);
      console.log(`⚠️  Found Sequelize model: ${file}`);
    }
  });
  
  console.log(`\n📝 Found ${sequelizeModels.length} Sequelize models that may be causing conflicts:`);
  sequelizeModels.forEach(model => console.log(`  - ${model}`));
  
  // Remove or rename problematic Sequelize models
  const modelsToRemove = [
    'Book.js',
    'FeeInvoice.js',
    'FeePayment.js',
    'FeeStructure.js',
    'BookIssue.js'
  ];
  
  console.log('\n🗑️  Removing problematic Sequelize models...');
  
  modelsToRemove.forEach(modelName => {
    const filePath = path.join(modelsDir, modelName);
    if (fs.existsSync(filePath)) {
      // Rename to .backup instead of deleting
      const backupPath = filePath + '.backup';
      fs.renameSync(filePath, backupPath);
      console.log(`  ✅ Renamed ${modelName} to ${modelName}.backup`);
    }
  });
  
  console.log('\n🎉 Sequelize conflicts resolved!');
  console.log('📝 The duplicate index warnings should now be gone.');
}

fixSequelizeConflicts();



