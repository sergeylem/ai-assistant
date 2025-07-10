// init-chroma-v2.js - Initialize ChromaDB v2 with proper tenant setup
const fetch = require('node-fetch');

async function initChromaDBv2() {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🚀 Initializing ChromaDB v2...');
  
  try {
    // 1. Check if ChromaDB is running
    console.log('1. Checking ChromaDB connection...');
    const heartbeat = await fetch(`${baseUrl}/api/v2/heartbeat`);
    if (!heartbeat.ok) {
      throw new Error(`ChromaDB not responding: ${heartbeat.status}`);
    }
    console.log('   ✅ ChromaDB is running');
    
    // 2. Get version info
    try {
      const version = await fetch(`${baseUrl}/api/v2/version`);
      const versionData = await version.json();
      console.log(`   ChromaDB version: ${versionData.version}`);
    } catch (error) {
      console.log('   ⚠️ Could not get version info');
    }
    
    // 3. Create default tenant if it doesn't exist (for v2)
    console.log('2. Setting up tenant...');
    try {
      const tenantResponse = await fetch(`${baseUrl}/api/v2/tenants/default_tenant`, {
        method: 'GET'
      });
      
      if (tenantResponse.status === 404) {
        // Create the tenant
        console.log('   Creating default_tenant...');
        const createTenantResponse = await fetch(`${baseUrl}/api/v2/tenants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'default_tenant'
          })
        });
        
        if (createTenantResponse.ok) {
          console.log('   ✅ Created default_tenant');
        } else {
          console.log('   ⚠️ Could not create tenant (may already exist)');
        }
      } else {
        console.log('   ✅ default_tenant already exists');
      }
    } catch (error) {
      console.log('   ⚠️ Tenant setup skipped (may not be needed for this version)');
    }
    
    // 4. Check for existing collections (optional)
    console.log('3. Checking collections...');
    console.log('   ℹ️ Collections will be created when documents are uploaded');
    
    console.log('\n✅ ChromaDB v2 initialization complete!');
    console.log('   Your application should now be able to create collections.');
    
  } catch (error) {
    console.error('\n❌ ChromaDB initialization failed:');
    console.error(`   Error: ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Start ChromaDB: docker-compose up -d chroma');
    console.error('   2. Wait for startup: docker-compose logs chroma');
    console.error('   3. Check if port 8000 is accessible');
  }
}

// Run initialization
initChromaDBv2(); 