# Production Troubleshooting Guide for CloneLM

## Common Production Issues and Solutions

### 1. PDF Files Not Loading (404 Errors)

**Symptoms:**
- Frontend shows "Failed to load PDF" error
- Backend returns 404 for `/api/files/:filename`
- Files work locally but not in production

**Root Causes:**
- File storage permissions
- Different file system structure
- Ephemeral storage in cloud environments
- File cleanup removing needed files

**Solutions:**

#### A. Check File Storage
```bash
# SSH into production server
ssh your-server

# Check uploads directory
ls -la /path/to/your/app/uploads/

# Check file permissions
ls -la /path/to/your/app/uploads/*.pdf

# Check if files exist
find /path/to/your/app/uploads/ -name "*.pdf" -type f
```

#### B. Verify File Permissions
```bash
# Set proper permissions
chmod 755 uploads/
chmod 644 uploads/*.pdf

# Check ownership
ls -la uploads/
```

#### C. Test File Access
```bash
# Test file reading
node -e "
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
const files = fs.readdirSync(uploadsDir);
console.log('Files found:', files);
files.forEach(f => {
  const filePath = path.join(uploadsDir, f);
  try {
    const stats = fs.statSync(filePath);
    console.log(\`\${f}: \${stats.size} bytes, readable: \${fs.accessSync(filePath, fs.constants.R_OK) ? 'Yes' : 'No'}\`);
  } catch (e) {
    console.log(\`\${f}: ERROR - \${e.message}\`);
  }
});
"
```

### 2. File Size Limits

**Issue:** Large PDFs fail to upload or process

**Solution:**
```bash
# Check current file size limit
grep "fileSize" server.js

# Update file size limit in production
export MAX_FILE_SIZE=50MB  # or your preferred limit
```

### 3. Memory Issues

**Symptoms:**
- Server crashes when processing large PDFs
- Out of memory errors
- Slow PDF processing

**Solutions:**

#### A. Increase Node.js Memory
```bash
# Start with more memory
node --max-old-space-size=4096 server.js

# Or in PM2
pm2 start server.js --name "clonelm" --node-args="--max-old-space-size=4096"
```

#### B. Optimize File Processing
```javascript
// Use streaming for large files
const stream = fs.createReadStream(filePath);
stream.pipe(res);

// Add memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
  });
}, 60000);
```

### 4. Environment-Specific Issues

#### Render.com
```bash
# Check if using persistent storage
# Render uses ephemeral storage by default
# Consider using external storage (AWS S3, etc.)

# Set environment variables
NODE_ENV=production
UPLOADS_DIR=/tmp/uploads  # Use temp directory
```

#### Heroku
```bash
# Heroku has ephemeral filesystem
# Files are lost on restart
# Use external storage or database

# Check dyno type
heroku ps:scale web=1
```

#### AWS EC2
```bash
# Use EBS volumes for persistent storage
# Mount volume to /app/uploads
sudo mount /dev/xvdf /app/uploads

# Check volume status
df -h
lsblk
```

### 5. Debugging Production Issues

#### A. Enable Detailed Logging
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production') {
  console.log('Production mode enabled');
  console.log('Uploads directory:', uploadsDir);
  console.log('Current working directory:', process.cwd());
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    UPLOADS_DIR: process.env.UPLOADS_DIR
  });
}
```

#### B. Test File Endpoints
```bash
# Test file listing
curl https://your-domain.com/api/files

# Test specific file
curl -I https://your-domain.com/api/files/filename.pdf

# Test file upload
curl -X POST -F "pdf=@test.pdf" https://your-domain.com/api/upload
```

#### C. Check Server Logs
```bash
# View real-time logs
tail -f logs/app.log

# Search for errors
grep -i "error\|fail\|404" logs/app.log

# Check system logs
journalctl -u your-service -f
```

### 6. Production Best Practices

#### A. Use External Storage
```javascript
// Consider using AWS S3, Google Cloud Storage, or similar
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Upload to S3 instead of local filesystem
const uploadToS3 = async (file) => {
  const params = {
    Bucket: 'your-bucket',
    Key: file.filename,
    Body: fs.createReadStream(file.path),
    ContentType: 'application/pdf'
  };
  return s3.upload(params).promise();
};
```

#### B. Implement File Cleanup
```javascript
// Clean up old files periodically
setInterval(() => {
  const files = fs.readdirSync(uploadsDir);
  if (files.length > MAX_FILES) {
    // Remove oldest files
    const fileStats = files.map(f => ({
      name: f,
      path: path.join(uploadsDir, f),
      mtime: fs.statSync(path.join(uploadsDir, f)).mtime
    }));
    
    fileStats.sort((a, b) => a.mtime - b.mtime);
    const toRemove = fileStats.slice(0, fileStats.length - MAX_FILES);
    
    toRemove.forEach(f => {
      try {
        fs.unlinkSync(f.path);
        console.log(`Cleaned up: ${f.name}`);
      } catch (e) {
        console.error(`Failed to clean up ${f.name}:`, e.message);
      }
    });
  }
}, CLEANUP_INTERVAL);
```

#### C. Health Checks
```javascript
// Add comprehensive health check
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    uploads: {
      directory: uploadsDir,
      exists: fs.existsSync(uploadsDir),
      writable: fs.accessSync(uploadsDir, fs.constants.W_OK) ? 'Yes' : 'No',
      fileCount: fs.readdirSync(uploadsDir).length
    }
  };
  
  res.json(health);
});
```

### 7. Emergency Recovery

#### A. Restart Services
```bash
# Restart Node.js process
pm2 restart clonelm-backend

# Or kill and restart
pkill -f "node server.js"
node server.js
```

#### B. Recreate Uploads Directory
```bash
# Backup existing files
cp -r uploads uploads_backup_$(date +%Y%m%d_%H%M%S)

# Recreate directory
rm -rf uploads
mkdir uploads
chmod 755 uploads

# Restore files if needed
cp uploads_backup_*/uploads/* uploads/
```

#### C. Check Disk Space
```bash
# Check available disk space
df -h

# Check directory sizes
du -sh uploads/
du -sh logs/
```

## Quick Diagnostic Commands

```bash
# 1. Check server status
curl -I https://your-domain.com/api/health

# 2. Check file storage
curl https://your-domain.com/api/debug/files

# 3. Test file upload
curl -X POST -F "pdf=@test.pdf" https://your-domain.com/api/upload

# 4. Check server logs
tail -f logs/app.log | grep -E "(error|fail|404|PDF)"

# 5. Verify file permissions
ls -la uploads/ | head -5
```

## Support Contacts

- **Backend Issues:** Check server logs and file permissions
- **Frontend Issues:** Check browser console and network tab
- **Storage Issues:** Verify file system and permissions
- **Performance Issues:** Monitor memory usage and file sizes

Remember: **Always backup your files before making changes in production!**
