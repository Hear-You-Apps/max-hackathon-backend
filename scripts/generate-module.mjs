import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function findImport(source, path) {
  const file = ts.createSourceFile(
    'app.module.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  return file.statements.find(
    (node) =>
      ts.isImportDeclaration(node) && node.moduleSpecifier.text === path,
  );
}

async function generate() {
  const [name, ...options] = process.argv.slice(2);
  if (!name || name === '--help') {
    console.log('npm run generate:module -- <kebab-case-name> [--dry-run]');
    if (!name) process.exitCode = 1;
    return;
  }
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      'Имя модуля должно быть в kebab-case, например house-members.',
    );
  }
  if (options.some((option) => option !== '--dry-run')) {
    throw new Error('Поддерживается только опция --dry-run.');
  }

  const moduleDir = join(root, 'src/modules', name);
  const appPath = join(root, 'src/app.module.ts');
  const indexPath = join(root, 'src/modules/index.ts');
  if (existsSync(moduleDir)) throw new Error(`Модуль ${name} уже существует.`);

  const appBefore = await readFile(appPath, 'utf8');
  const indexBefore = await readFile(indexPath, 'utf8');
  const barrelImport = findImport(appBefore, './modules');
  if (
    !barrelImport?.importClause?.namedBindings ||
    !ts.isNamedImports(barrelImport.importClause.namedBindings) ||
    barrelImport.importClause.isTypeOnly
  ) {
    throw new Error("В AppModule ожидается именованный импорт из './modules'.");
  }

  const result = spawnSync(
    process.execPath,
    [
      join(root, 'node_modules/@nestjs/cli/bin/nest.js'),
      'generate',
      'resource',
      name,
      '--type',
      'rest',
      '--crud',
      'true',
      '--no-spec',
      ...options,
    ],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Nest CLI не завершил генерацию.');
  if (options.includes('--dry-run')) {
    console.log('Также будут обновлены modules/index.ts и импорт в AppModule.');
    return;
  }

  let app = await readFile(appPath, 'utf8');
  const directImport = findImport(app, `./modules/${name}/${name}.module`);
  const bindings = directImport?.importClause?.namedBindings;
  if (
    !bindings ||
    !ts.isNamedImports(bindings) ||
    bindings.elements.length !== 1
  ) {
    throw new Error(
      'Не найден импорт нового модуля. Проверь вывод Nest CLI и AppModule.',
    );
  }
  const moduleName = bindings.elements[0].name.text;
  app = app.slice(0, directImport.getStart()) + app.slice(directImport.end);
  const sharedImport = findImport(app, './modules');
  const sharedBindings = sharedImport.importClause.namedBindings;
  const imports = [
    ...sharedBindings.elements.map((item) => item.getText()),
    moduleName,
  ];
  app =
    app.slice(0, sharedBindings.getStart()) +
    `{ ${imports.join(', ')} }` +
    app.slice(sharedBindings.end);

  const index = `${indexBefore.trimEnd()}\nexport { ${moduleName} } from './${name}/${name}.module';\n`;
  const generatedFiles = (await readdir(moduleDir, { recursive: true }))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => join(moduleDir, file));
  const contents = new Map([
    [appPath, app],
    [indexPath, index],
  ]);
  for (const path of generatedFiles)
    contents.set(path, await readFile(path, 'utf8'));
  for (const [path, source] of contents) {
    contents.set(
      path,
      await prettier.format(source, {
        ...(await prettier.resolveConfig(path)),
        filepath: path,
      }),
    );
  }
  for (const [path, source] of contents) await writeFile(path, source);
  console.log(`Добавлен ${moduleName}.`);
}

generate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
