/**
 * Database Connection Test Script
 * Verifies connectivity to the PostgreSQL database configured in DATABASE_URL.
 */

// Load environment variables if not already loaded
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // .env might already be loaded or missing
  }
}

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;

  console.log('====================================================');
  console.log('       PostgreSQL Connection Diagnostic Test        ');
  console.log('====================================================');

  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    console.error('Please verify your .env file exists and contains DATABASE_URL.');
    process.exit(1);
  }

  // Mask password for display
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connecting to: ${maskedUrl}`);

  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('Attempting connection to PostgreSQL...');
    
    // Execute raw SQL to test connection and fetch server metadata
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() AS database_name,
        current_user AS user_name,
        version() AS pg_version,
        NOW() AS server_time;
    `;

    console.log('\n✅ Database connection SUCCESSFUL!');
    console.log('Connection details:');
    if (Array.isArray(result) && result[0]) {
      console.log(` - Database: ${result[0].database_name}`);
      console.log(` - User:     ${result[0].user_name}`);
      console.log(` - Time:     ${result[0].server_time}`);
      console.log(` - Version:  ${result[0].pg_version?.split(' on ')[0] || result[0].pg_version}`);
    }

    console.log('====================================================\n');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('\n❌ Failed to connect to PostgreSQL database:');
    console.error(`Error Code:    ${error.code || 'UNKNOWN'}`);
    console.error(`Message:       ${error.message}`);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Hint: Can\'t reach database server at localhost:5432. Please ensure PostgreSQL service is running.');
    } else if (error.code === 'P1003') {
      console.error('\n💡 Hint: Database does not exist. Run "npx prisma db push" to create it or create it in PostgreSQL.');
    } else if (error.code === 'P1000') {
      console.error('\n💡 Hint: Authentication failed against database server. Please verify username and password.');
    }
    
    console.log('====================================================\n');
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
