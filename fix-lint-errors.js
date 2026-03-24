import fs from 'fs';
import path from 'path';

// Function to remove unused imports
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check for ESLint no-unused-vars errors
    const unusedVarsRegex = /['"]([^'"]+)['"] is defined but never used/g;
    const unusedVars = [];
    let match;
    
    // Extract file content for analysis
    const fileContent = content;
    
    // Find all unused imports based on ESLint error messages
    while ((match = unusedVarsRegex.exec(fileContent)) !== null) {
      unusedVars.push(match[1]);
    }
    
    // Process each unused variable
    for (const unusedVar of unusedVars) {
      // Different regex patterns for different import styles
      const patterns = [
        // Named imports with multiple items: import { X, UnusedVar, Y } from 'module';
        new RegExp(`import\\s+\\{([^}]*)\\b${unusedVar}\\b([^}]*)\\}\\s+from\\s+['"][^'"]+['"]`, 'g'),
        // Single named imports: import { UnusedVar } from 'module';
        new RegExp(`import\\s+\\{\\s*${unusedVar}\\s*\\}\\s+from\\s+['"][^'"]+['"]`, 'g'),
        // Default imports: import UnusedVar from 'module';
        new RegExp(`import\\s+${unusedVar}\\s+from\\s+['"][^'"]+['"]`, 'g')
      ];
      
      for (const pattern of patterns) {
        content = content.replace(pattern, (match) => {
          // For multiple named imports, remove only the unused var
          if (match.includes('{') && match.includes('}')) {
            return match
              .replace(new RegExp(`\\s*,\\s*\\b${unusedVar}\\b`, 'g'), '')
              .replace(new RegExp(`\\b${unusedVar}\\b\\s*,\\s*`, 'g'), '')
              .replace(new RegExp(`\\{\\s*\\b${unusedVar}\\b\\s*\\}`, 'g'), '{ }')
              .replace(/\{\s*\}/g, ''); // Remove empty brackets
          }
          
          // For default imports or single named imports, remove whole line
          return '';
        });
      }
    }
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed unused imports in: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Function to fix 'any' type usages
function suggestAnyTypeFixes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for error: any patterns
    const anyPatterns = [
      { regex: /catch\s*\(([^:)]+):[^)]*any[^)]*\)/g, suggestion: 'use Error or unknown type instead of any' },
      { regex: /function[^(]*\([^)]*:\s*any[^)]*\)/g, suggestion: 'consider using a more specific type' },
      { regex: /const\s+([^:=]+):\s*any\s*=/g, suggestion: 'infer the type or use a more specific type' },
      { regex: /let\s+([^:=]+):\s*any\s*=/g, suggestion: 'infer the type or use a more specific type' },
      { regex: /:\s*any\[\]/g, suggestion: 'use a typed array instead, like string[], number[], or a custom type[]' }
    ];
    
    let found = false;
    
    for (const pattern of anyPatterns) {
      if (pattern.regex.test(content)) {
        found = true;
        console.log(`${filePath}: ${pattern.suggestion}`);
      }
    }
    
    if (!found) {
      console.log(`${filePath}: Check for any types that could be replaced with more specific types`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return false;
  }
}

// Function to fix simple React Hooks exhaustive deps warnings
function fixReactHooksWarnings(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Look for react-hooks/exhaustive-deps warnings
    const hooksWarningRegex = /React Hook useEffect has a missing dependency: '([^']+)'/g;
    let match;
    const missingDeps = new Set();
    
    while ((match = hooksWarningRegex.exec(content)) !== null) {
      missingDeps.add(match[1]);
    }
    
    if (missingDeps.size > 0) {
      // Replace useEffect dependency arrays
      content = content.replace(/useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[(.*?)\]\s*\)/g, (match, effectBody, depArray) => {
        const deps = depArray.split(',').map(dep => dep.trim()).filter(dep => dep);
        
        for (const missingDep of missingDeps) {
          if (!deps.includes(missingDep)) {
            deps.push(missingDep);
          }
        }
        
        return `useEffect(() => {${effectBody}}, [${deps.join(', ')}])`;
      });
      
      // Only write if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed React Hooks warnings in: ${filePath}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Function to fix empty interface issues
function fixEmptyInterfaces(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace empty interfaces with extension only
    content = content.replace(/export\s+interface\s+(\w+)\s+extends\s+React\.\w+HTMLAttributes<HTML\w+Element>\s*\{\s*\}/g, 
      (match, interfaceName) => {
        return `export type ${interfaceName} = React.HTMLAttributes<HTML${interfaceName.replace(/Props$/, '')}Element>;`;
      });
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed empty interfaces in: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Function to fix unnecessary escape characters
function fixUnnecessaryEscapes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace unnecessary escapes in regular expressions
    content = content.replace(/([^\\]|^)\\\.([^*+?^${}()|[\]\\])/g, '$1.$2');
    content = content.replace(/([^\\]|^)\\,/g, '$1,');
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed unnecessary escapes in: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Function to fix missing consts
function fixMissingConsts(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace let with const where mentioned in errors
    content = content.replace(/let\s+([\w]+)(\s*=\s*[^;]+;)(?!\s*\1\s*=)/g, 'const $1$2');
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed missing consts in: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Process files based on the ESLint output
console.log('Starting to fix common linting issues...');

// List of files with linting errors from ESLint output
const filesToFix = [
  'src/App.tsx',
  'src/components/Chat.tsx',
  'src/components/DownloadOptions.tsx',
  'src/components/FeaturesSection.tsx',
  'src/components/HeroIllustration.tsx',
  'src/components/HospitalChat.tsx',
  'src/components/HospitalRegistrationForm.tsx',
  'src/components/Navbar.tsx',
  'src/components/NewPatient.tsx',
  'src/components/TeamSection.tsx',
  'src/components/ThemeDebug.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/textarea.tsx',
  'src/context/AuthContext.tsx',
  'src/context/ChatContext.tsx',
  'src/context/HospitalContext.tsx',
  'src/context/SiteContext.tsx',
  'src/context/ThemeContext.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Docs.tsx',
  'src/pages/HospitalProfile.tsx',
  'src/pages/LearnMore.tsx',
  'src/pages/Login.tsx',
  'src/pages/Settings.tsx',
  'src/pages/SignUp.tsx',
  'src/services/api.ts',
  'src/services/chatService.ts',
  'src/services/fileProcessing.ts',
  'src/services/sessionService.ts',
  'src/utils/textExtraction.ts'
];

// Apply fixes to each file
let fixesApplied = 0;
for (const file of filesToFix) {
  try {
    // Skip files that don't exist
    if (!fs.existsSync(file)) {
      console.warn(`Skipping ${file} - file not found`);
      continue;
    }
    
    console.log(`Processing ${file}...`);
    let fileFixed = false;
    
    // Apply different fixes based on error types
    fileFixed |= removeUnusedImports(file);
    fileFixed |= fixReactHooksWarnings(file);
    fileFixed |= fixEmptyInterfaces(file);
    fileFixed |= fixUnnecessaryEscapes(file);
    fileFixed |= fixMissingConsts(file);
    
    // Suggest fixes for 'any' type issues
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      suggestAnyTypeFixes(file);
    }
    
    if (fileFixed) {
      fixesApplied++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log(`\nFixed common issues in ${fixesApplied} files.`);
console.log('\nSome issues require manual fixes:');
console.log('1. Replace "any" types with more specific types');
console.log('2. Review and fix any remaining React Hooks dependencies');
console.log('3. Check for remaining unused variables not caught by the script');
console.log('\nRun ESLint again to see remaining issues:');
console.log('npx eslint .'); 