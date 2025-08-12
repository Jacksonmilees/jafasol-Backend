const fs = require('fs');
const path = require('path');

function findRemainingIndexes() {
  console.log('🔍 FINDING REMAINING INDEXES...');
  
  const modelsDir = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all .index() calls
    const indexMatches = content.match(/\.index\([^)]+\)/g);
    
    if (indexMatches && indexMatches.length > 0) {
      console.log(`\n📝 ${file}:`);
      indexMatches.forEach(match => {
        console.log(`  - ${match}`);
      });
    }
  });
  
  console.log('\n🔍 SEARCHING FOR UNIQUE FIELDS...');
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all unique: true fields
    const uniqueMatches = content.match(/unique:\s*true/g);
    
    if (uniqueMatches && uniqueMatches.length > 0) {
      console.log(`\n📝 ${file} has ${uniqueMatches.length} unique fields:`);
      
      // Find the field names with unique: true
      const fieldMatches = content.match(/(\w+):\s*\{[^}]*unique:\s*true[^}]*\}/g);
      if (fieldMatches) {
        fieldMatches.forEach(match => {
          console.log(`  - ${match}`);
        });
      }
    }
  });
}

findRemainingIndexes();



