const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Folders/Files to copy
const itemsToCopy = [
    'index.html',
    'assets',
    'dsa',
    'Summaries'
];

function cleanDist() {
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);
}

function copyRecursive(src, dest) {
    if (fs.lstatSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function build() {
    console.log('Building for production...');
    cleanDist();

    // 1. Copy Static Assets
    itemsToCopy.forEach(item => {
        const srcPath = path.join(rootDir, item);
        const destPath = path.join(distDir, item);

        if (fs.existsSync(srcPath)) {
            console.log(`Copying ${item}...`);
            copyRecursive(srcPath, destPath);
        } else {
            console.warn(`Warning: ${item} not found.`);
        }
    });

    // 2. Generate Indices (This will now run against the *Source* and write to *Source* assets, which we just copied. 
    //    Actually, we want `files.json` in the DIST assets. 
    //    Let's run generate_index.js logic but point it to output to Dist ?? 
    //    Easier: Just run the existing generate script (which writes to src/assets) *BEFORE* copying? 
    //    OR: Run it now and update the files in `dist/assets` logic.

    //    Let's re-run the generator script logic but pointing to dist paths to be safe and ensure paths are correct relative to dist?
    //    Actually, the current generator uses relative '../dsa'. If run from scripts/, it finds ../dsa.
    //    If we just copy everything, the relative links in index.html (./assets/...) still work.
    //    So we just need to ensure files.json and summaries.json are up to date.

    console.log('Generating Indices...');
    // We can run the existing script. It writes to ../assets. Since we copied assets to dist/assets, we should copy again or run it before?
    // Best workflow: Run generate index -> Update Source Assets -> Copy to Dist.
    // But user wants efficient build.

    // Let's modify the plan: The `npm run build` will Run Generate -> Then Run this Build Script.
    // So here we assume Assets are fresh.

    console.log('Build Complete! Defaults available in /dist');
}

build();
