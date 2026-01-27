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

function getChangedFiles() {
    try {
        // Check for staged and unstaged changes
        const diff = execSync('git diff --name-only HEAD', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
        // Check for untracked files
        const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8', cwd: path.join(__dirname, '..') });

        return [...diff.split('\n'), ...untracked.split('\n')]
            .map(f => f.trim())
            .filter(f => f.length > 0)
            .map(f => f.replace(/\\/g, '/')); // Normalize paths to forward slashes
    } catch (e) {
        console.warn('Warning: Not a git repository or git error. Falling back to full checking/build.');
        return null;
    }
}

const changedFiles = getChangedFiles();

// 1. Format
if (changedFiles) {
    const dsaFiles = changedFiles.filter(f => f.startsWith('dsa/') && (f.endsWith('.java') || f.endsWith('.txt')));
    if (dsaFiles.length > 0) {
        console.log(`Formatting ${dsaFiles.length} files...`);
        // Use npx prettier directly on the files
        run(`npx prettier --write ${dsaFiles.map(f => `"${f}"`).join(' ')}`);
    } else {
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
}

if (shouldBuildCss) {
    run('npm run build:css');
}
