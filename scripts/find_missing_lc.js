const fs = require('fs');
const path = require('path');

const dir = 'd:\\Timepass\\dsaCodes\\DSA\\dsa';

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) return;

        const content = fs.readFileSync(filePath, 'utf8');

        // Check if it's a LeetCode problem
        if (content.includes('leetcode.com/problems/')) {
            // Check if it misses the Problem No tag
            if (!content.includes('// Leetcode Problem No:')) {
                console.log(file);
            }
        }
    });
});
