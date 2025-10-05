// ParkPay Chat Connectivity Test Script
// Run this in the browser console to verify everything is working

console.log('🚀 ParkPay Chat Connectivity Test');
console.log('==================================');

// Test 1: Environment Variables
console.log('🧪 Test 1: Environment Variables');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
console.log('Current origin:', window.location.origin);

// Test 2: Basic API Health Check
console.log('🧪 Test 2: API Health Check');
fetch('http://localhost:4000/api/health')
  .then(response => {
    console.log('✅ Health check response:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('✅ Health data:', data);
  })
  .catch(error => {
    console.error('❌ Health check failed:', error);
  });

// Test 3: Chat API Test
console.log('🧪 Test 3: Chat API Test');
fetch('http://localhost:4000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000'
  },
  body: JSON.stringify({
    message: 'I wanna check my funds',
    walletAddress: 'rf81Uz61xCU5KqCMyEejNjvSxu62o9uwNQ'
  })
})
  .then(response => {
    console.log('✅ Chat API response:', response.status, response.statusText);
    console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Chat response data:', data);
  })
  .catch(error => {
    console.error('❌ Chat API failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  });

// Test 4: Socket Connection Test
console.log('🧪 Test 4: Socket Connection Test');
try {
  const socket = io('http://localhost:4000');
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
    socket.disconnect();
  });
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection failed:', error);
  });
} catch (error) {
  console.error('❌ Socket test failed:', error);
}

console.log('🔍 All tests initiated - check results above');
console.log('📝 If all tests pass, the chat should work properly!');
