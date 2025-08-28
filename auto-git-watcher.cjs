const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

class AutoGitWatcher {
  constructor() {
    this.isProcessing = false;
    this.pendingChanges = new Set();
    this.debounceTimer = null;
    this.lastCommitTime = 0;
    this.minCommitInterval = 5000; // Minimum 5 seconds between commits
    
    // Files/directories to ignore
    this.ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/package-lock.json',
      '**/*.log',
      '**/auto-git-watcher.js',
      '**/auto-git-watcher.cjs',
      '**/auto-commit.ps1',
      '**/auto-commit.bat'
    ];
    
    this.setupWatcher();
    this.setupProcessHandlers();
  }

  setupWatcher() {
    console.log('🚀 Starting Auto Git Watcher...');
    console.log('📁 Watching for changes in project directory...');
    
    const watcher = chokidar.watch('.', {
      ignored: this.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
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
        console.log('💡 Make changes to any file and they will be automatically committed!');
      });
  }

  handleFileChange(changeType, filePath) {
    if (this.isProcessing) {
      this.pendingChanges.add(`${changeType}:${filePath}`);
      return;
    }

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${changeType}: ${relativePath}`);
    
    this.pendingChanges.add(`${changeType}:${filePath}`);
    this.scheduleCommit();
  }

  scheduleCommit() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processChanges();
    }, 2000); // Wait 2 seconds after last change before committing
  }

  async processChanges() {
    if (this.isProcessing || this.pendingChanges.size === 0) {
      return;
    }

    this.isProcessing = true;
    const changes = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    try {
      console.log('\n🔄 Processing changes...');
      console.log(`📊 Total changes: ${changes.length}`);
      
      // Check git status
      const gitStatus = await this.runCommand('git status --porcelain');
      
      if (!gitStatus.trim()) {
        console.log('✅ No changes to commit');
        this.isProcessing = false;
        return;
      }

      // Add all changes
      console.log('📦 Adding changes to git...');
      await this.runCommand('git add .');
      
      // Create commit message
      const commitMessage = this.generateCommitMessage(changes);
      console.log(`💬 Committing with message: ${commitMessage}`);
      
      // Commit changes
      await this.runCommand(`git commit -m "${commitMessage}"`);
      
      // Push to remote
      console.log('🚀 Pushing to GitHub...');
      await this.runCommand('git push origin master');
      
      console.log('✅ Successfully committed and pushed to GitHub!');
      this.lastCommitTime = Date.now();
      
    } catch (error) {
      console.error('❌ Error during auto-commit:', error.message);
      
      // If there's an error, add changes back to pending
      changes.forEach(change => this.pendingChanges.add(change));
    } finally {
      this.isProcessing = false;
      
      // Process any new changes that came in while we were processing
      if (this.pendingChanges.size > 0) {
        setTimeout(() => this.processChanges(), 1000);
      }
    }
  }

  generateCommitMessage(changes) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    
    // Group changes by type
    const added = changes.filter(c => c.startsWith('added:')).length;
    const modified = changes.filter(c => c.startsWith('modified:')).length;
    const deleted = changes.filter(c => c.startsWith('deleted:')).length;
    
    let message = `Auto-commit at ${timestamp}`;
    
    if (added > 0) message += ` | +${added} new`;
    if (modified > 0) message += ` | ~${modified} modified`;
    if (deleted > 0) message += ` | -${deleted} deleted`;
    
    // Add some context about what changed
    const fileTypes = changes.map(c => {
      const filePath = c.split(':')[1];
      const ext = path.extname(filePath);
      return ext || 'file';
    });
    
    const uniqueTypes = [...new Set(fileTypes)].slice(0, 3);
    if (uniqueTypes.length > 0) {
      message += ` | Types: ${uniqueTypes.join(', ')}`;
    }
    
    return message;
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${command}\nError: ${error.message}\nStderr: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  setupProcessHandlers() {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Auto Git Watcher...');
      
      if (this.pendingChanges.size > 0) {
        console.log('📝 Processing final changes before shutdown...');
        await this.processChanges();
      }
      
      console.log('👋 Auto Git Watcher stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      
      if (this.pendingChanges.size > 0) {
        await this.processChanges();
      }
      
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  // Method to manually trigger a commit (useful for testing)
  async manualCommit() {
    console.log('🔄 Manual commit triggered...');
    await this.processChanges();
  }
}

// Start the watcher
const watcher = new AutoGitWatcher();

// Export for potential external use
module.exports = watcher;

// Keep the process alive
console.log('🔄 Auto Git Watcher is running... Press Ctrl+C to stop');
console.log('📝 Any file changes will be automatically committed and pushed to GitHub!');
