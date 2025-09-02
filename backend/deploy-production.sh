#!/bin/bash

# Production Deployment Script for CloneLM Backend
echo "🚀 Deploying CloneLM Backend to Production..."

# Set production environment
export NODE_ENV=production

# Create necessary directories
echo "📁 Creating production directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 755 uploads
chmod 755 logs
chmod 755 temp
chmod 644 .env.production

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Create production environment file
echo "⚙️  Setting up production environment..."
if [ ! -f .env.production ]; then
    echo "❌ Production environment file not found!"
    echo "Please create .env.production with proper configuration"
    exit 1
fi

# Copy production environment
cp .env.production .env

# Test file system access
echo "🧪 Testing file system access..."
node -e "
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
const testFile = path.join(uploadsDir, 'test.txt');

try {
    // Test directory creation
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Test file write
    fs.writeFileSync(testFile, 'test');
    
    // Test file read
    const content = fs.readFileSync(testFile, 'utf8');
    
    // Test file delete
    fs.unlinkSync(testFile);
    
    console.log('✅ File system tests passed');
} catch (error) {
    console.error('❌ File system tests failed:', error.message);
    process.exit(1);
}
"

# Start the application
echo "🚀 Starting production server..."
echo "Environment: $NODE_ENV"
echo "Uploads directory: $(pwd)/uploads"
echo "Logs directory: $(pwd)/logs"

# Start with PM2 if available, otherwise use node
if command -v pm2 &> /dev/null; then
    echo "📊 Using PM2 for process management..."
    pm2 start server.js --name "clonelm-backend" --env production
    pm2 save
    pm2 startup
else
    echo "📝 Starting with Node.js..."
    node server.js
fi

echo "✅ Production deployment complete!"
echo "📊 Monitor logs with: tail -f logs/app.log"
echo "🌐 Health check: curl http://localhost:8080/api/health"
