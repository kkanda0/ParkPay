// Browser Network Debugging Script
// Run this in the browser console to test connectivity

console.log('🔍 ParkPay Network Debugging Script');
console.log('=====================================');

// Test 1: Basic fetch to health endpoint
console.log('🧪 Test 1: Basic fetch to health endpoint');
fetch('http://localhost:3002/api/health')
  .then(response => {
    console.log('✅ Health endpoint response:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('✅ Health data:', data);
  })
  .catch(error => {
    console.error('❌ Health endpoint error:', error);
  });

// Test 2: Chat endpoint with proper headers
console.log('🧪 Test 2: Chat endpoint with proper headers');
fetch('http://localhost:3002/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000'
  },
  body: JSON.stringify({
    message: 'test from browser',
    walletAddress: 'rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ'
  })
})
  .then(response => {
    console.log('✅ Chat endpoint response:', response.status, response.statusText);
    console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Chat data:', data);
  })
  .catch(error => {
    console.error('❌ Chat endpoint error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  });

// Test 3: Check if API_BASE_URL is correct
console.log('🧪 Test 3: Environment variables');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api');

// Test 4: Check current origin
console.log('🧪 Test 4: Current origin');
console.log('Current origin:', window.location.origin);
console.log('Current protocol:', window.location.protocol);
console.log('Current host:', window.location.host);

console.log('🔍 Debugging complete - check results above');
