# Echo Authentication Troubleshooting Guide

## 🚨 **Current Issue: Echo URL Returns "Not Found"**

The Echo authentication URL `https://echo.merit.systems/auth` is returning a "Not Found" error. This could be due to several reasons:

### **Possible Causes:**

1. **Incorrect URL Format** - Echo might use a different endpoint
2. **Missing Echo Service** - The Echo service might not be available
3. **App ID Configuration** - Your App ID might need different setup
4. **Echo Service Changes** - Echo might have changed their API

## 🔧 **Solutions to Try:**

### **Option 1: Check Echo Documentation**
- Visit Echo by Merit Systems documentation
- Look for the correct authentication endpoint
- Verify the URL format and parameters

### **Option 2: Alternative Echo URLs**
Try these different URL formats:

```bash
# Format 1: Standard OAuth
https://echo.merit.systems/oauth/authorize?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code

# Format 2: Different endpoint
https://api.echo.merit.systems/auth?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}

# Format 3: With different parameters
https://echo.merit.systems/login?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}
```

### **Option 3: Contact Echo Support**
- Reach out to Echo by Merit Systems support
- Ask for the correct authentication endpoint
- Verify your App ID is properly configured

### **Option 4: Use Mock Authentication (Current)**
- The system now falls back to mock authentication
- This allows you to test the complete flow
- Real Echo integration can be added later

## 🧪 **Current Working Solution:**

The authentication system now:

1. **Detects Echo URL issues** - Logs the intended URL
2. **Falls back to mock login** - Uses `/auth/login` page
3. **Generates valid JWT tokens** - For testing purposes
4. **Complete authentication flow** - Works end-to-end

## 🎯 **Testing the Current System:**

1. **Visit** http://localhost:3002
2. **Click "Echo Login"** → Login section expands
3. **Click "🔐 Login with Echo (Mock)"** → Goes to mock login page
4. **Enter any username/password** → Click "Sign In with Echo"
5. **Get redirected back** → With valid JWT token
6. **Test authentication** → Should work perfectly

## 🔄 **Next Steps:**

1. **Test the mock authentication** - Verify it works completely
2. **Contact Echo support** - Get correct authentication URL
3. **Update the URL** - Once you have the correct endpoint
4. **Test real Echo** - Switch to real authentication

## 📝 **Environment Variables:**

Your `.env.local` should contain:

```bash
# Echo Credentials (for when URL is fixed)
ECHO_APP_ID=8aa15208-2fc9-4565-b397-57e5da728925
ECHO_SERVER_KEY=your-echo-server-key
ECHO_CONTROL_URL=https://api.echo.merit.systems

# Public App ID (for client-side redirects)
NEXT_PUBLIC_ECHO_APP_ID=8aa15208-2fc9-4565-b397-57e5da728925
```

## ✅ **What's Working Now:**

- ✅ **Mock Echo login page** - Professional looking
- ✅ **JWT token generation** - Valid tokens
- ✅ **Cookie storage** - Proper token handling
- ✅ **Authentication validation** - Server-side validation
- ✅ **Complete flow** - End-to-end authentication
- ✅ **Error handling** - Graceful fallbacks

The authentication system is **fully functional** with mock authentication. Once you get the correct Echo URL, you can easily switch to real Echo authentication!
