const fs = require('fs');
const path = require('path');

const dsaFolder = path.join(__dirname, '../dsa');
const outputFile = path.join(__dirname, '../assets/files.json');

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const files = fs.readdirSync(dsaFolder);
    const fileList = [];

    files.forEach(file => {
        const fullPath = path.join(dsaFolder, file);
        const stats = fs.statSync(fullPath);

        if (stats.isFile()) {
            fileList.push({
                name: file,
                path: `dsa/${file}`,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                type: 'file'
            });
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(fileList, null, 2));
    console.log(`Successfully generated ${outputFile} with ${fileList.length} files.`);

} catch (err) {
    console.error('Error generating index:', err);
    process.exit(1);
}
