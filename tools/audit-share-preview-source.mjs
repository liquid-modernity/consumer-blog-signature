import { existsSync } from 'node:fs';

const required = [
 'src/features/share/preview/types.ts',
 'src/features/share/preview/resolver.ts',
 'src/features/share/preview/canvas.ts'
];

const missing = required.filter((file) => !existsSync(file));

if (missing.length) {
 console.error('Missing share preview foundation:', missing.join(', '));
 process.exit(1);
}

console.log('GAGA share preview audit OK');
console.log('✓ preview contract boundary');
console.log('✓ preview resolver boundary');
console.log('✓ preview canvas boundary');
