import fs from 'fs';

const tests = [
    'package.json',
    'index.html',
    'vite.config.js',
    'src/main.jsx',
    'src/App.jsx'
];

let failed = false;

for (const file of tests) {
    if (fs.existsSync(file)) {
        console.log(`TEST PASSED: ${file} exists`);
    } else {
        console.error(`TEST FAILED: ${file} not found`);
        failed = true;
    }
}

if (failed) {
    console.error('Some automated tests failed.');
    process.exit(1);
}

console.log('All automated tests passed.');
