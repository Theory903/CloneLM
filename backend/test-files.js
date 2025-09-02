const fs = require('fs');
const path = require('path');

// Test script to debug file serving issues
console.log('=== File System Debug Test ===\n');

const uploadsDir = path.join(__dirname, 'uploads');
console.log(`Uploads directory: ${uploadsDir}`);
console.log(`Directory exists: ${fs.existsSync(uploadsDir)}`);

if (fs.existsSync(uploadsDir)) {
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`\nTotal files found: ${files.length}`);
    
    if (files.length === 0) {
      console.log('No files found in uploads directory');
    } else {
      console.log('\nFile details:');
      files.forEach((filename, index) => {
        const filePath = path.join(uploadsDir, filename);
        try {
          const stats = fs.statSync(filePath);
          console.log(`${index + 1}. ${filename}`);
          console.log(`   Path: ${filePath}`);
          console.log(`   Size: ${stats.size} bytes`);
          console.log(`   Is file: ${stats.isFile()}`);
          console.log(`   Modified: ${stats.mtime}`);
          console.log(`   Readable: ${fs.accessSync(filePath, fs.constants.R_OK) ? 'Yes' : 'No'}`);
          console.log('');
        } catch (error) {
          console.log(`${index + 1}. ${filename} - ERROR: ${error.message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error.message);
  }
} else {
  console.log('Uploads directory does not exist. Creating it...');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
  } catch (error) {
    console.error('Failed to create uploads directory:', error.message);
  }
}

// Test file access
console.log('\n=== Testing File Access ===');
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
  
  if (files.length > 0) {
    const testFile = files[0];
    const testFilePath = path.join(uploadsDir, testFile);
    
    console.log(`\nTesting access to: ${testFile}`);
    
    try {
      // Test file read
      const stats = fs.statSync(testFilePath);
      console.log(`✓ File stats: ${stats.size} bytes`);
      
      // Test file read stream
      const stream = fs.createReadStream(testFilePath);
      let bytesRead = 0;
      
      stream.on('data', (chunk) => {
        bytesRead += chunk.length;
      });
      
      stream.on('end', () => {
        console.log(`✓ File stream read: ${bytesRead} bytes`);
        console.log(`✓ File is accessible and readable`);
      });
      
      stream.on('error', (error) => {
        console.error(`✗ File stream error: ${error.message}`);
      });
      
    } catch (error) {
      console.error(`✗ File access error: ${error.message}`);
    }
  } else {
    console.log('No PDF files found to test');
  }
}

console.log('\n=== Test Complete ===');
