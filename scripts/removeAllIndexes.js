const fs = require('fs');
const path = require('path');

function removeAllIndexes() {
  console.log('🔧 REMOVING ALL EXPLICIT INDEXES...');
  
  const modelsDir = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    console.log(`📝 Processing ${file}...`);
    
    // Remove all .index() calls
    const indexPattern = /^\s*[a-zA-Z]+Schema\.index\(\{[^}]+\}\);\s*$/gm;
    const matches = content.match(indexPattern);
    
    if (matches && matches.length > 0) {
      console.log(`  🗑️  Removing ${matches.length} index definitions:`);
      matches.forEach(match => {
        console.log(`    - ${match.trim()}`);
      });
      
      content = content.replace(indexPattern, '');
      modified = true;
    }
    
    // Clean up any double newlines that might have been created
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${file}`);
    } else {
      console.log(`  ✅ ${file} - No indexes to remove`);
    }
  });
  
  console.log('\n🎉 All explicit indexes removed!');
  console.log('📝 Mongoose will create only the necessary indexes automatically.');
}

removeAllIndexes();



