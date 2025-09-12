/**
 * Test the real Parallel AI API integration
 */

const API_BASE_URL = 'http://localhost:3000';

async function testRealAPI() {
  console.log('🔥 Testing REAL Parallel AI API integration...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/enrich-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails: ['test@example.com'],
        options: {
          batchSize: 1,
          includeSubsidiaries: false,
        },
      }),
    });

    console.log(`📡 Response Status: ${response.status}`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Real API integration successful!');
      console.log('📊 Summary:', {
        total: data.summary.total,
        successful: data.summary.successful,
        failed: data.summary.failed,
        processingTime: `${(data.summary.processingTimeMs / 1000).toFixed(1)}s`,
      });

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('📄 First result:', {
          email: result.email,
          status: result.status,
          hasData: !!result.data,
          error: result.error,
          companyName: result.data?.companyName,
          website: result.data?.website,
        });

        if (result.data) {
          console.log('🏢 Company data fields:', Object.keys(result.data));
        }
      }
    } else {
      console.log('❌ API call failed');
      console.log('📄 Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/enrich-emails`, {
      method: 'GET',
    });
    return response.status === 405; // Should return "Method not allowed"
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server not running. Please start with: npm run dev');
    return;
  }

  await testRealAPI();
}

main().catch(console.error);
