const fs = require('fs');
const path = require('path');

function fixDuplicateIndexes() {
  console.log('🔧 Fixing duplicate index warnings...');
  
  const modelsDir = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    console.log(`📝 Checking ${file}...`);
    
    // Check for common duplicate index patterns
    const patterns = [
      // Remove explicit index for fields that already have unique: true
      { 
        pattern: /\/\/ Index for better query performance \(.*\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g,
        replacement: ''
      },
      // Remove specific duplicate indexes mentioned in warnings
      { 
        pattern: /\/\/ Index for better query performance \(email is already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g,
        replacement: ''
      },
      { 
        pattern: /\/\/ Index for better query performance \(teacherId and email are already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g,
        replacement: ''
      }
    ];
    
    patterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        console.log(`  ✅ Removed duplicate index pattern in ${file}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  💾 Updated ${file}`);
    } else {
      console.log(`  ✅ ${file} - No duplicate indexes found`);
    }
  });
  
  console.log('🎉 Duplicate index fix completed!');
}

fixDuplicateIndexes();



