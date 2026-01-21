#!/usr/bin/env node

import { spawn } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevAutoRunner {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
    this.restartQueue = [];
    this.debounceTimer = null;
    
    // Files to watch for changes
    this.watchPatterns = [
      'src/**/*',
      'public/**/*',
      '*.html',
      '*.css',
      '*.js',
      '*.ts',
      '*.tsx',
      '*.json',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js'
    ];
    
    // Files to ignore
    this.ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/*.log',
      '**/auto-git-watcher.js',
      '**/dev-auto.js'
    ];
    
    this.setupWatcher();
    this.startDevServer();
  }

  setupWatcher() {
    console.log('🚀 Starting Development Auto-Runner...');
    console.log('📁 Watching for changes in project files...');
    
    const watcher = chokidar.watch(this.watchPatterns, {
      ignored: this.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('modified', filePath))
      .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
      .on('error', (error) => console.error('❌ Watcher error:', error))
      .on('ready', () => {
        console.log('✅ File watcher is ready and monitoring changes...');
        console.log('💡 Make changes to any file and the dev server will automatically restart!');
      });
  }

  handleFileChange(changeType, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${changeType}: ${relativePath}`);
    
    // Queue restart with debouncing
    this.queueRestart();
  }

  queueRestart() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.restartDevServer();
    }, 1000); // Wait 1 second after last change before restarting
  }

  async startDevServer() {
    if (this.isRunning) {
      console.log('⚠️  Dev server is already running');
      return;
    }

    console.log('🚀 Starting development server...');
    this.isRunning = true;

    try {
      // Start frontend
      const frontend = spawn('npm', ['run', 'dev:frontend'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      this.processes.set('frontend', frontend);

      frontend.on('error', (error) => {
        console.error('❌ Frontend error:', error);
        this.isRunning = false;
      });

      frontend.on('exit', (code) => {
        console.log(`🔄 Frontend exited with code ${code}`);
        this.processes.delete('frontend');
        this.isRunning = false;
        
        // Auto-restart if not manually stopped
        if (code !== 0) {
          setTimeout(() => this.startDevServer(), 2000);
        }
      });

      // Start backend if it exists
      try {
        const backend = spawn('npm', ['run', 'dev:backend'], {
          stdio: 'inherit',
          shell: true,
          cwd: process.cwd()
        });

        this.processes.set('backend', backend);

        backend.on('error', (error) => {
          console.error('❌ Backend error:', error);
        });

        backend.on('exit', (code) => {
          console.log(`🔄 Backend exited with code ${code}`);
          this.processes.delete('backend');
          
          // Auto-restart backend if not manually stopped
          if (code !== 0) {
            setTimeout(() => {
              if (this.isRunning) {
                const newBackend = spawn('npm', ['run', 'dev:backend'], {
                  stdio: 'inherit',
                  shell: true,
                  cwd: process.cwd()
                });
                this.processes.set('backend', newBackend);
              }
            }, 2000);
          }
        });
      } catch (error) {
        console.log('⚠️  Backend not available, running frontend only');
      }

    } catch (error) {
      console.error('❌ Failed to start dev server:', error);
      this.isRunning = false;
    }
  }

  async restartDevServer() {
    if (this.restartQueue.length > 0) {
      return; // Already queued
    }

    console.log('🔄 Restarting development server...');
    
    // Stop all processes
    for (const [name, process] of this.processes) {
      console.log(`🛑 Stopping ${name}...`);
      process.kill('SIGTERM');
    }

    this.processes.clear();
    this.isRunning = false;

    // Wait a bit then restart
    setTimeout(() => {
      this.startDevServer();
    }, 1000);
  }

  stop() {
    console.log('🛑 Stopping development server...');
    
    for (const [name, process] of this.processes) {
      console.log(`🛑 Stopping ${name}...`);
      process.kill('SIGTERM');
    }

    this.processes.clear();
    this.isRunning = false;
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  if (devRunner) {
    devRunner.stop();
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  if (devRunner) {
    devRunner.stop();
  }
});

// Start the auto-runner
const devRunner = new DevAutoRunner();
