const fs = require('fs');
const path = require('path');

function comprehensiveIndexFix() {
  console.log('🔧 COMPREHENSIVE INDEX FIX - Removing all duplicate indexes...');
  
  const modelsDir = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
  
  // Define all the specific indexes that are causing warnings
  const duplicateIndexes = [
    // Remove all explicit index definitions for fields that have unique: true
    { pattern: /\/\/ Index for better query performance.*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    
    // Remove specific indexes mentioned in warnings
    { pattern: /\/\/ Index for better query performance \(email is already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    { pattern: /\/\/ Index for better query performance \(teacherId and email are already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    { pattern: /\/\/ Index for better query performance \(name is already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    { pattern: /\/\/ Index for better query performance \(code is already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    { pattern: /\/\/ Index for better query performance \(studentId is already unique in schema\)\s*\n.*\.index\(\{[^}]*\}\);\s*\n/g, replacement: '' },
    
    // Remove specific field indexes that are duplicates
    { pattern: /\.index\(\{ name: 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ code: 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ email: 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ teacherId: 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ studentId: 1 \}\);\s*\n/g, replacement: '' },
    
    // Remove any remaining explicit indexes for unique fields
    { pattern: /\.index\(\{ "name": 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ "code": 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ "email": 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ "teacherId": 1 \}\);\s*\n/g, replacement: '' },
    { pattern: /\.index\(\{ "studentId": 1 \}\);\s*\n/g, replacement: '' },
  ];
  
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    console.log(`📝 Checking ${file}...`);
    
    // Apply all patterns
    duplicateIndexes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        console.log(`  ✅ Removed duplicate index pattern in ${file}`);
      }
    });
    
    // Clean up any double newlines that might have been created
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  💾 Updated ${file}`);
    } else {
      console.log(`  ✅ ${file} - No duplicate indexes found`);
    }
  });
  
  console.log('\n🎉 Comprehensive index fix completed!');
  console.log('📝 All duplicate index warnings should now be resolved.');
}

comprehensiveIndexFix();



