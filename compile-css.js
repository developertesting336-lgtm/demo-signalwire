// compile-css.js
const fs = require('fs');
const path = require('path');
const { compile } = require('@tailwindcss/node');

async function main() {
  console.log('Compiling complete Tailwind CSS...');
  const inputCss = '@import "tailwindcss";';
  
  const files = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next') {
          scan(fullPath);
        }
      } else if (/\.(tsx|ts|jsx|js|html)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  scan(path.resolve(__dirname, 'app'));
  scan(path.resolve(__dirname, 'components'));
  scan(path.resolve(__dirname, 'lib'));

  const candidates = new Set();
  const wordRegex = /[a-zA-Z0-9_\-\/\[\]%#.:]+/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const words = content.match(wordRegex) || [];
    for (const w of words) {
      candidates.add(w);
    }
  }

  console.log(`Found ${candidates.size} candidate tokens across ${files.length} files.`);
  
  const compiler = await compile(inputCss, {
    base: path.resolve(__dirname, 'app'),
    from: path.resolve(__dirname, 'app/globals.css'),
    onDependency: () => {},
  });

  const compiled = compiler.build(Array.from(candidates));
  console.log('Compiled CSS length:', compiled.length);
  
  // Prepend resets and write to app/globals.css directly so it is always 100% bundled!
  const finalCss = `/* Auto-compiled Tailwind CSS bundle */
${compiled}
`;

  fs.writeFileSync(path.resolve(__dirname, 'app/globals.css'), finalCss);
  console.log('SUCCESS! Updated app/globals.css with full compiled stylesheet.');
}

main().catch(console.error);
