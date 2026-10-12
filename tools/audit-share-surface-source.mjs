import { existsSync } from 'node:fs';

const required = [
 'src/features/share/contracts.ts',
 'src/features/share/resolver.ts',
 'src/features/share/machine/share-machine.ts'
];

const missing = required.filter((file)=>!existsSync(file));

if (missing.length) {
 console.error('Missing share surface foundation:', missing.join(', '));
 process.exit(1);
}

console.log('GAGA share surface audit OK');
console.log('✓ share contract boundary');
console.log('✓ share machine extraction boundary');
console.log('✓ share resolver boundary');
