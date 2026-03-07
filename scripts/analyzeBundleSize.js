#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to get file size in bytes
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// Function to recursively get all JS files and their sizes
function analyzeDirectory(dirPath, basePath = '') {
  const results = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.expo', 'android', 'ios', '.git'].includes(item)) {
          results.push(...analyzeDirectory(fullPath, relativePath));
        }
      } else if (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx')) {
        results.push({
          path: relativePath,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100
        });
      }
    }
  } catch (error) {
    console.error(`Error analyzing directory ${dirPath}:`, error.message);
  }
  
  return results;
}

// Function to format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main analysis function
function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const results = analyzeDirectory(projectRoot);
  
  // Sort by size (largest first)
  results.sort((a, b) => b.size - a.size);
  
  // Calculate total size
  const totalSize = results.reduce((sum, file) => sum + file.size, 0);
  
  console.log('📊 Bundle Size Analysis Results\n');
  console.log('=' * 50);
  
  // Show top 20 largest files
  console.log('\n🔥 Top 20 Largest Files:');
  console.log('-'.repeat(80));
  console.log('Size'.padEnd(12) + 'File Path');
  console.log('-'.repeat(80));
  
  results.slice(0, 20).forEach(file => {
    console.log(formatBytes(file.size).padEnd(12) + file.path);
  });
  
  // Show summary by directory
  console.log('\n📁 Size by Directory:');
  console.log('-'.repeat(50));
  
  const directorySizes = {};
  results.forEach(file => {
    const dir = path.dirname(file.path);
    const topLevelDir = dir.split(path.sep)[0] || 'root';
    directorySizes[topLevelDir] = (directorySizes[topLevelDir] || 0) + file.size;
  });
  
  Object.entries(directorySizes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([dir, size]) => {
      console.log(formatBytes(size).padEnd(12) + dir);
    });
  
  // Show memory optimization recommendations
  console.log('\n💡 Memory Optimization Recommendations:');
  console.log('-'.repeat(50));
  
  const largeFiles = results.filter(file => file.size > 50000); // Files > 50KB
  if (largeFiles.length > 0) {
    console.log('⚠️  Large files that could benefit from lazy loading:');
    largeFiles.slice(0, 10).forEach(file => {
      console.log(`   • ${file.path} (${formatBytes(file.size)})`);
    });
  }
  
  const componentFiles = results.filter(file => 
    file.path.includes('components/') && file.size > 20000
  );
  if (componentFiles.length > 0) {
    console.log('\n🧩 Large components that should be lazy-loaded:');
    componentFiles.slice(0, 5).forEach(file => {
      console.log(`   • ${file.path} (${formatBytes(file.size)})`);
    });
  }
  
  console.log('\n📈 Summary:');
  console.log('-'.repeat(30));
  console.log(`Total files analyzed: ${results.length}`);
  console.log(`Total bundle size: ${formatBytes(totalSize)}`);
  console.log(`Average file size: ${formatBytes(Math.round(totalSize / results.length))}`);
  console.log(`Files > 50KB: ${largeFiles.length}`);
  console.log(`Files > 100KB: ${results.filter(f => f.size > 100000).length}`);
  
  // Memory optimization score
  const score = Math.max(0, 100 - (largeFiles.length * 5) - (totalSize > 5000000 ? 20 : 0));
  console.log(`\n🎯 Memory Optimization Score: ${score}/100`);
  
  if (score < 70) {
    console.log('❌ Consider implementing more lazy loading and code splitting');
  } else if (score < 85) {
    console.log('⚠️  Good, but there\'s room for improvement');
  } else {
    console.log('✅ Excellent memory optimization!');
  }
}

// Run the analysis
if (require.main === module) {
  analyzeBundleSize();
}

module.exports = { analyzeBundleSize };