// Read-only checks: no database connection, uploads or environment values read.
const fs = require('node:fs');
const path = require('node:path');
const { builtinModules } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const errors = [];
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return ['node_modules', 'dist', 'uploads'].includes(entry.name) ? [] : walk(file);
    return /\.(?:cjs|jsx|js)$/.test(file) ? [file] : [];
  });
}
const files = [...walk(path.join(root, 'frontend')), ...walk(path.join(root, 'backend'))];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS);
  for (const diagnostic of ast.parseDiagnostics) errors.push(path.relative(root, file) + ': ' + ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
  const project = file.startsWith(path.join(root, 'frontend')) ? 'frontend' : 'backend';
  const manifest = require(path.join(root, project, 'package.json'));
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  function checkReference(specifier) {
    if (specifier.startsWith('.')) {
      const base = path.resolve(path.dirname(file), specifier);
      if (!['', '.js', '.jsx', '.json', '/index.js'].some(ext => fs.existsSync(base + ext))) errors.push(path.relative(root, file) + ': unresolved ' + specifier);
    } else if (!specifier.startsWith('node:') && !builtinModules.includes(specifier)) {
      const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
      if (!dependencies[name]) errors.push(path.relative(root, file) + ': undeclared dependency ' + name);
    }
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) checkReference(node.moduleSpecifier.text);
    } else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
      if (node.expression.getText(ast) === 'require' || node.expression.kind === ts.SyntaxKind.ImportKeyword) checkReference(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const frontend = files.filter(file => file.startsWith(path.join(root, 'frontend/src')));
const program = ts.createProgram(frontend, {
  allowJs: true, checkJs: true, noEmit: true, skipLibCheck: true,
  jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
});
for (const diagnostic of ts.getPreEmitDiagnostics(program).filter(item => item.code === 2304)) {
  errors.push(path.relative(root, diagnostic.file.fileName) + ': ' + ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
}
for (const dir of ['', 'frontend', 'backend']) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, dir, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, dir, 'package-lock.json'), 'utf8'));
  if (manifest.name !== lock.name || manifest.name !== lock.packages[''].name) errors.push(dir + ': package/lock name mismatch');
  for (const key of ['dependencies', 'devDependencies']) {
    if (JSON.stringify(manifest[key] || {}) !== JSON.stringify(lock.packages[''][key] || {})) errors.push(dir + ': package/lock dependency mismatch');
  }
}
const html = fs.readFileSync(path.join(root, 'frontend/index.html'), 'utf8');
const icon = html.match(/rel="icon"[^>]*href="([^"]+)"/)?.[1];
if (!icon || !fs.existsSync(path.join(root, 'frontend/public', icon))) errors.push('Favicon reference is missing or unresolved');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
for (const required of ['.env', '.env.*', 'backend/uploads/', 'node_modules/', 'dist/']) {
  if (!ignore.split(/\r?\n/).includes(required)) errors.push('Missing ignore entry: ' + required);
}
if (!fs.existsSync(path.join(root, 'README.md'))) errors.push('Authoritative README is missing');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Project checks passed: ' + files.length + ' source/config/test modules, local imports, declared dependencies, lockfiles, favicon and secret/upload ignore rules.');
