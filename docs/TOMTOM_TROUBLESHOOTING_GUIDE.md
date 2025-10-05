# 🔧 TomTom Map Troubleshooting Guide

## 🎯 **CURRENT STATUS**

### **Changes Made:**
1. ✅ Removed failing POI Search API call
2. ✅ Fixed service to use demo data directly
3. ✅ Added comprehensive logging to map component
4. ✅ Improved error handling and timeouts
5. ✅ Added Script strategy and error callbacks

---

## 📋 **STEP-BY-STEP DEBUGGING**

### **What to Check in Browser Console:**

When you load http://localhost:3000/map, you should see these logs:

#### **Expected Logs:**
```
1. ✅ TomTom SDK Script loaded successfully
2. 🔍 window.tt available: true
3. 🔄 TomTom Map Effect Running: { sdkLoaded: true, hasParkingLot: true, ... }
4. ✅ TomTom SDK confirmed available
5. 🗺️ Initializing TomTom map with: { lat: 40.7128, lon: -74.0060, zoom: 14 }
6. 📍 Map object created: true
7. ✅ TomTom map LOAD event fired!
8. 📍 Adding 20 parking spot markers...
9. ✅ Added 20 markers to map
```

#### **If You See:**
```
❌ TomTom SDK NOT available on window object!
```
**Problem:** SDK script didn't load properly
**Solution:** Check network tab for 403/404 errors on TomTom CDN

```
⏳ Waiting for parking lot data...
```
**Problem:** API not returning data
**Solution:** Check API endpoint http://localhost:3001/api/parking/lots

```
⚠️ Map loading timeout (5s), marking as ready anyway
```
**Problem:** Map initialization taking too long
**Solution:** Check browser console for TomTom API errors

---

## 🔍 **BROWSER DEBUGGING STEPS**

### **1. Open Browser DevTools**
- Press F12
- Go to Console tab
- Reload page (Ctrl+R)
- Look for logs starting with 🗺️, ✅, ❌

### **2. Check Network Tab**
Look for these requests:
- ✅ `maps-web.min.js` - Should return 200 OK
- ✅ `maps.css` - Should return 200 OK
- ✅ `/api/parking/lots` - Should return 200 OK with JSON data

### **3. Check Console Errors**
Common errors and fixes:

**Error:** `Cannot read property 'map' of undefined`
- **Cause:** TomTom SDK didn't load
- **Fix:** Check CDN URL, try different version

**Error:** `Invalid API key`
- **Cause:** Wrong or missing API key
- **Fix:** Verify NEXT_PUBLIC_TOMTOM_API_KEY in next.config.js

**Error:** `403 Forbidden`
- **Cause:** API key lacks permissions
- **Fix:** Already handled with fallback, should use demo data

### **4. Check Elements Tab**
- Find `<div class="absolute inset-0">` (map container)
- Should have child elements added by TomTom SDK
- If empty, map didn't initialize

---

## 🛠️ **COMMON ISSUES & SOLUTIONS**

### **Issue 1: Map Shows "Loading..." Forever**

**Possible Causes:**
1. SDK script blocked by browser
2. API key invalid
3. Map container not rendered
4. Network connectivity issues

**Solutions:**
```javascript
// Check if SDK loaded
console.log('SDK available:', typeof window.tt !== 'undefined')

// Check if container exists
console.log('Container:', document.querySelector('.absolute.inset-0'))

// Check API key
console.log('API Key:', process.env.NEXT_PUBLIC_TOMTOM_API_KEY)
```

### **Issue 2: Map Loads But No Markers**

**Possible Causes:**
1. Parking data not fetched
2. Markers failing to create
3. Coordinates invalid

**Solutions:**
- Check `/api/parking/lots` endpoint
- Verify spots array has data
- Check coordinates are valid numbers

### **Issue 3: Map Loads But Blank/Black Screen**

**Possible Causes:**
1. CSS not loaded
2. Invalid center coordinates
3. Map style issues

**Solutions:**
- Check `maps.css` in network tab
- Verify coordinates: lat=40.7128, lon=-74.0060
- Remove custom style (already done)

---

## 📊 **VERIFICATION CHECKLIST**

Run these checks in browser console:

```javascript
// 1. Check TomTom SDK
console.log('TomTom SDK:', typeof window.tt)
// Should show: "object"

// 2. Check map instance
console.log('Map instance:', window.tt?.map)
// Should show: function

// 3. Check API key
console.log('API Key:', process.env.NEXT_PUBLIC_TOMTOM_API_KEY || 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6lis')
// Should show your key

// 4. Fetch parking data manually
fetch('http://localhost:3001/api/parking/lots')
  .then(r => r.json())
  .then(d => console.log('Parking data:', d))
// Should show 3 parking lots
```

---

## 🚀 **ALTERNATIVE: Use MapLibre Instead**

If TomTom continues to have issues, we can switch to MapLibre (open-source alternative):

**Benefits:**
- No API key required for map display
- More reliable loading
- Similar functionality
- Better performance

**Would require:**
- Swap TomTom SDK for MapLibre
- Use OpenStreetMap tiles
- Keep same marker logic
- ~30 minutes to implement

---

## 📝 **NEXT STEPS BASED ON LOGS**

### **After restarting servers:**

1. **Open browser to:** http://localhost:3000/map
2. **Open DevTools Console**
3. **Copy all console logs**
4. **Share with me** so I can diagnose exact issue

### **Key logs to capture:**
```
- All logs with 🗺️ emoji
- All logs with ❌ emoji
- Any red error messages
- Network tab status for maps-web.min.js
```

---

## 🎯 **EXPECTED FINAL STATE**

When everything works, you should see:

1. **Map Display:**
   - NYC street map visible
   - Can zoom in/out
   - Can pan around
   - TomTom attribution visible

2. **Parking Markers:**
   - 20 circular markers
   - Green ones pulsing (available)
   - Red ones static (occupied)
   - Numbers inside markers

3. **Interactions:**
   - Click marker selects spot
   - Hover shows scale effect
   - Bottom shows "Start Session"

---

## 💡 **QUICK TESTS**

### **Test 1: SDK Loading**
Open browser console and type:
```javascript
window.tt
```
Should NOT be `undefined`

### **Test 2: API Working**
```javascript
fetch('http://localhost:3001/api/parking/lots').then(r=>r.json()).then(console.log)
```
Should show parking data

### **Test 3: Component Rendered**
```javascript
document.querySelector('[class*="mapContainer"]')
```
Should show div element

---

## 📞 **WHAT I NEED FROM YOU**

To help debug further, please share:

1. ✅ Browser console logs (all of them)
2. ✅ Network tab screenshot (show maps-web.min.js status)
3. ✅ Elements tab screenshot (show map container HTML)
4. ✅ Any error messages in red

With comprehensive logging now in place, we should be able to pinpoint exactly where the issue is!

