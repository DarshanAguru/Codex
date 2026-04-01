const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(command) {
    console.log(`> ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
}

const isForce = process.argv.includes('--force');

function getChangedFiles() {
    if (isForce) {
        console.log('Force mode enabled. Building all files...');
        return null; // Null triggers fallback to full build
    }

    try {
        // Check for staged and unstaged changes
        const diff = execSync('git diff --name-only HEAD', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
        // Check for untracked files
        const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8', cwd: path.join(__dirname, '..') });

        return [...diff.split('\n'), ...untracked.split('\n')]
            .map(f => f.trim())
            .filter(f => f.length > 0)
            .map(f => f.replace(/\\/g, '/'));
    } catch (e) {
        console.warn('Warning: Not a git repository or git error. Falling back to full checking/build.');
        return null;
    }
}

const changedFiles = getChangedFiles();

function getLanguage(filePath) {
    if (filePath.endsWith('.java')) return 'java';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.txt')) {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            const content = fs.readFileSync(fullPath, 'utf8');
            // If it starts with #, assume it's Python
            if (content.trim().startsWith('#')) return 'python';
        } catch (e) {}
    }
    return 'java'; // Default for this repo's DSA txt files
}

// 1. Format
if (changedFiles) {
    const dsaFiles = changedFiles.filter(f => f.startsWith('dsa/') && (f.endsWith('.java') || f.endsWith('.txt')));
    
    // Filter out Python files from Prettier as it uses the Java plugin for .txt files
    const filesToFormat = dsaFiles.filter(f => getLanguage(f) === 'java');
    const pythonFiles = dsaFiles.filter(f => getLanguage(f) === 'python');

    if (filesToFormat.length > 0) {
        console.log(`Formatting ${filesToFormat.length} Java files...`);
        run(`npx prettier --write ${filesToFormat.map(f => `"${f}"`).join(' ')}`);
    }

    if (pythonFiles.length > 0) {
        console.log(`Skipping Prettier for ${pythonFiles.length} Python files (Java parser incompatible).`);
    }
    
    if (dsaFiles.length === 0) {
        console.log('No DSA files changed. Skipping format.');
    }
} else {
    // Fallback if git fails
    console.log('Unable to detect changes. Running full format...');
    run('npm run format');
}

// 2. Generate Index
run('npm run generate');



// 4. Build CSS (Selective)
let shouldBuildCss = true;
if (changedFiles) {
    const cssOrHtml = changedFiles.some(f =>
        f === 'assets/input.css' ||
        f.endsWith('.html')
    );
    if (!cssOrHtml) {
        console.log('No CSS/HTML changes detected. Skipping CSS build.');
        shouldBuildCss = false;
    }
} else {
    // Force mode or git issues -> Always build CSS
    shouldBuildCss = true;
}

if (shouldBuildCss) {
    run('npm run build:css');
}
