const fs = require('fs');
const path = require('path');

const filesToRevert = [
  'Strategies.tsx',
  'Portfolio.tsx',
  'BrokerIntegration.tsx',
  'AdvancedTrading.tsx',
  'CustomTools.tsx',
  'Settings.tsx',
  'UserManagement.tsx',
  'Leads.tsx',
  'SalesAnalytics.tsx',
  'Demos.tsx',
  'SupportCenter.tsx',
  'SupportTickets.tsx',
  'UserAssistance.tsx',
  'KnowledgeBase.tsx',
  'Login.tsx',
  'Register.tsx',
  'VerifyEmail.tsx'
];

const pagesDir = 'C:\\Users\\ADMIN\\Documents\\Chinmay Technosoft Work\\Sharewise-AI-DEVnew-repo\\frontend\\src\\pages';

const glassmorphismReplacements = {
  // Background gradients
  "background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'": "background: '#f5f7fa'",
  'background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"': 'background: "#f5f7fa"',
  
  // Glassmorphism containers
  "background: 'rgba(255,255,255,0.1)'": "background: 'white'",
  'background: "rgba(255,255,255,0.1)"': 'background: "white"',
  "background: 'rgba(255,255,255,0.05)'": "background: 'white'",
  'background: "rgba(255,255,255,0.05)"': 'background: "white"',
  "background: 'rgba(255,255,255,0.08)'": "background: 'white'",
  'background: "rgba(255,255,255,0.08)"': 'background: "white"',
  
  // Remove backdrop filter
  "backdropFilter: 'blur(10px)',": "",
  'backdropFilter: "blur(10px)",': "",
  "backdropFilter: 'blur(20px)',": "",
  'backdropFilter: "blur(20px)",': "",
  
  // Border changes
  "border: '1px solid rgba(255,255,255,0.2)'": "border: '1px solid #e0e0e0'",
  'border: "1px solid rgba(255,255,255,0.2)"': 'border: "1px solid #e0e0e0"',
  "border: '1px solid rgba(255,255,255,0.1)'": "border: '1px solid #e0e0e0'",
  'border: "1px solid rgba(255,255,255,0.1)"': 'border: "1px solid #e0e0e0"',
  
  // Text color changes
  "color: 'white'": "color: '#1F2937'",
  'color: "white"': 'color: "#1F2937"',
  "color: 'rgba(255,255,255,0.8)'": "color: '#374151'",
  'color: "rgba(255,255,255,0.8)"': 'color: "#374151"',
  "color: 'rgba(255,255,255,0.7)'": "color: '#6B7280'",
  'color: "rgba(255,255,255,0.7)"': 'color: "#6B7280"',
  "color: 'rgba(255,255,255,0.6)'": "color: '#9CA3AF'",
  'color: "rgba(255,255,255,0.6)"': 'color: "#9CA3AF"',
  
  // Add box shadow where glassmorphism was removed
  "background: 'white'": "background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'",
  'background: "white"': 'background: "white", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"'
};

function revertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [old, replacement] of Object.entries(glassmorphismReplacements)) {
      if (content.includes(old)) {
        content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Reverted: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`- No changes needed: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('🔄 Starting glassmorphism revert process...\n');

let processedCount = 0;
let revertedCount = 0;

filesToRevert.forEach(fileName => {
  const filePath = path.join(pagesDir, fileName);
  if (fs.existsSync(filePath)) {
    processedCount++;
    if (revertFile(filePath)) {
      revertedCount++;
    }
  } else {
    console.log(`⚠ File not found: ${fileName}`);
  }
});

console.log(`\n✅ Process completed!`);
console.log(`📊 Files processed: ${processedCount}`);
console.log(`🔄 Files reverted: ${revertedCount}`);