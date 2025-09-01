#!/usr/bin/env node

// Simple start script for Render
console.log('Starting CloneLM Backend...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Files in directory:', require('fs').readdirSync('.'));

// Start the server
require('./server.js');
