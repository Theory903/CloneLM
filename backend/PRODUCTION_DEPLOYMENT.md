# Production Deployment Checklist for CloneLM

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Set `NODE_ENV=production`
- [ ] Configure production environment variables
- [ ] Set appropriate file size limits (25MB recommended for production)
- [ ] Configure CORS origins for production domain

### 2. File Storage Configuration
- [ ] Ensure uploads directory has proper permissions (755)
- [ ] Verify PDF files have read permissions (644)
- [ ] Check disk space availability
- [ ] Test file read/write access

### 3. Server Configuration
- [ ] Set appropriate memory limits
- [ ] Configure file cleanup intervals
- [ ] Enable production logging
- [ ] Set up health check endpoints

## 🚀 Deployment Steps

### Step 1: Prepare Production Environment
```bash
# Set production environment
export NODE_ENV=production

# Create necessary directories
mkdir -p uploads logs temp

# Set proper permissions
chmod 755 uploads logs temp
chmod 644 uploads/*.pdf 2>/dev/null || true
```

### Step 2: Install Dependencies
```bash
# Install production dependencies only
npm ci --only=production

# Or if using yarn
yarn install --production
```

### Step 3: Configure Environment
```bash
# Copy production environment file
cp .env.production .env

# Verify environment variables
cat .env | grep -E "(NODE_ENV|PORT|MAX_FILE_SIZE)"
```

### Step 4: Test File System Access
```bash
# Run file system tests
node -e "
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
const testFile = path.join(uploadsDir, 'test.txt');

try {
    // Test directory access
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
```

### Step 5: Start Production Server
```bash
# Start with PM2 (recommended)
pm2 start server.js --name "clonelm-backend" --env production

# Or start directly
NODE_ENV=production node server.js

# Or with increased memory
NODE_ENV=production node --max-old-space-size=4096 server.js
```

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl -I https://your-domain.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-02T05:54:10.000Z",
  "uptime": 123.45,
  "memory": {
    "rss": 45,
    "heapUsed": 23,
    "heapTotal": 34
  },
  "uploads": {
    "directory": "/app/uploads",
    "exists": true,
    "writable": "Yes",
    "fileCount": 18
  }
}
```

### 2. File Storage Check
```bash
curl https://your-domain.com/api/debug/files
```

**Expected Response:**
```json
{
  "uploadsDir": "/app/uploads",
  "totalFiles": 18,
  "files": [...],
  "directoryExists": true,
  "directoryStats": {...}
}
```

### 3. PDF File Access Test
```bash
# Test specific file access
curl -I "https://your-domain.com/api/files/filename.pdf"
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 24681
Content-Disposition: inline; filename="filename.pdf"
Cache-Control: public, max-age=3600
Accept-Ranges: bytes
```

### 4. File Upload Test
```bash
# Test file upload
curl -X POST -F "pdf=@test.pdf" https://your-domain.com/api/upload
```

## 🚨 Common Production Issues & Solutions

### Issue 1: PDFs Return 404
**Cause:** File permissions or directory access issues
**Solution:**
```bash
# Check permissions
ls -la uploads/

# Fix permissions
chmod 755 uploads/
chmod 644 uploads/*.pdf

# Check ownership
ls -la uploads/ | head -5
```

### Issue 2: Large Files Fail to Upload
**Cause:** File size limits or memory constraints
**Solution:**
```bash
# Increase file size limit
export MAX_FILE_SIZE=50MB

# Increase Node.js memory
node --max-old-space-size=4096 server.js
```

### Issue 3: Files Disappear After Restart
**Cause:** Ephemeral storage in cloud environments
**Solution:**
- Use persistent volumes (AWS EBS, Google Persistent Disk)
- Implement external storage (AWS S3, Google Cloud Storage)
- Set up file backup and restoration

### Issue 4: Memory Issues
**Cause:** Large PDF processing or file handling
**Solution:**
```bash
# Monitor memory usage
pm2 monit

# Restart with more memory
pm2 restart clonelm-backend --node-args="--max-old-space-size=4096"
```

## 📊 Monitoring & Maintenance

### 1. Regular Health Checks
```bash
# Set up cron job for health monitoring
*/5 * * * * curl -f https://your-domain.com/api/health || echo "Server down at $(date)" >> /var/log/clonelm-health.log
```

### 2. File Cleanup
```bash
# Monitor file count
curl -s https://your-domain.com/api/debug/files | jq '.totalFiles'

# Clean up old files if needed
find uploads/ -name "*.pdf" -mtime +7 -delete
```

### 3. Log Monitoring
```bash
# Monitor error logs
tail -f logs/app.log | grep -E "(error|fail|404)"

# Monitor access logs
tail -f logs/app.log | grep "Serving file"
```

## 🔧 Emergency Procedures

### 1. Server Restart
```bash
# Restart with PM2
pm2 restart clonelm-backend

# Or kill and restart
pkill -f "node server.js"
NODE_ENV=production node server.js
```

### 2. File Recovery
```bash
# Backup files
cp -r uploads uploads_backup_$(date +%Y%m%d_%H%M%S)

# Recreate directory
rm -rf uploads
mkdir uploads
chmod 755 uploads

# Restore files
cp uploads_backup_*/uploads/* uploads/
```

### 3. Rollback
```bash
# Revert to previous version
git checkout HEAD~1
npm ci --only=production
pm2 restart clonelm-backend
```

## 📞 Support & Troubleshooting

### Quick Diagnostic Commands
```bash
# 1. Check server status
curl -I https://your-domain.com/api/health

# 2. Check file storage
curl https://your-domain.com/api/debug/files

# 3. Test file access
curl -I https://your-domain.com/api/files/filename.pdf

# 4. Check server logs
tail -f logs/app.log | grep -E "(error|fail|404|PDF)"

# 5. Verify file permissions
ls -la uploads/ | head -5
```

### Log Analysis
```bash
# Search for specific errors
grep -i "file not found" logs/app.log
grep -i "permission denied" logs/app.log
grep -i "404" logs/app.log

# Monitor real-time errors
tail -f logs/app.log | grep -E "(ERROR|error|Error)"
```

## 🎯 Success Criteria

Your production deployment is successful when:

1. ✅ Health check endpoint returns 200 OK
2. ✅ File upload endpoint accepts PDFs up to configured size limit
3. ✅ PDF files are accessible via `/api/files/:filename`
4. ✅ File listing endpoint returns correct file count
5. ✅ No 404 errors for existing PDF files
6. ✅ Server handles multiple concurrent requests
7. ✅ Memory usage remains stable
8. ✅ File cleanup runs without errors

## 📚 Additional Resources

- [Production Troubleshooting Guide](./PRODUCTION_TROUBLESHOOTING.md)
- [File System Test Script](./test-files.js)
- [Production Deployment Script](./deploy-production.sh)
- [Environment Configuration](./.env.production)

---

**Remember:** Always test in a staging environment before deploying to production!
