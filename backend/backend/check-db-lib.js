const fs = require('fs');
const path = require('path');

// Where to search (adjust as needed)
const searchFolders = ['.', './models', './db', './src', './src/models', './src/db'];

// Packages to check for in package.json
const packagesToCheck = ['@prisma/client', 'prisma', 'sequelize', 'pg', '@supabase/supabase-js'];

function checkPackageJson() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log('❌ package.json not found');
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {...pkg.dependencies, ...pkg.devDependencies};
  let found = false;
  packagesToCheck.forEach(pkgName => {
    if (deps && deps[pkgName]) {
      console.log(`✅ Detected package: ${pkgName}`);
      found = true;
    }
  });
  if (!found) {
    console.log('❌ None of Prisma, Sequelize, pg, or Supabase detected in package.json');
  }
}

function checkForPrismaSchema() {
  const prismaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(prismaPath)) {
    console.log('✅ Found prisma/schema.prisma file');
  } else {
    console.log('❌ No prisma/schema.prisma file found');
  }
}

function searchForPrismaImports() {
  let foundPrisma = false;
  searchFolders.forEach(folder => {
    if (fs.existsSync(folder)) {
      const files = fs.readdirSync(folder);
      files.forEach(file => {
        const filePath = path.join(folder, file);
        if (fs.statSync(filePath).isFile() && file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('PrismaClient')) {
            console.log(`✅ PrismaClient found in: ${filePath}`);
            foundPrisma = true;
          }
          if (content.includes('sequelize')) {
            console.log(`✅ Sequelize import found in: ${filePath}`);
            foundPrisma = true;
          }
          if (content.includes('pg')) {
            console.log(`✅ pg import found in: ${filePath}`);
            foundPrisma = true;
          }
        }
      });
    }
  });
  if (!foundPrisma) {
    console.log('❌ No PrismaClient, Sequelize, or pg imports found in scanned folders.');
  }
}

// Run checks
console.log('--- Checking for DB Libraries and Config ---');
checkPackageJson();
checkForPrismaSchema();
searchForPrismaImports();
