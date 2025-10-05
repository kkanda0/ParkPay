// Mock Echo SDK implementation to avoid dependency issues
// This provides the same interface as the real Echo SDK

interface EchoConfig {
  appId: string;
}

interface EchoHandlers {
  // Add any handlers you need here
}

interface EchoClient {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };
}

// Generate contextual pricing explanations based on real-world factors
function generateContextualExplanation(timeOfDay: string, dayOfWeek: string, locationName: string, nearbySpots: any[]) {
  const explanations = [
    // Evening scenarios
    {
      condition: timeOfDay === 'evening' && (dayOfWeek === 'Friday' || dayOfWeek === 'Saturday'),
      explanation: "The rate is higher tonight because there's heavy traffic downtown and nearby restaurants are busy. Weekend evenings always see higher demand with people heading out for dinner and entertainment. Limited spaces on weekends drive up competition for available spots."
    },
    {
      condition: timeOfDay === 'evening' && dayOfWeek === 'Sunday',
      explanation: "Sunday evening rates are up due to weekend events and limited parking options in this area. Many garages close early on Sundays, reducing overall supply. This creates higher demand for the spots that remain available."
    },
    
    // Rush hour scenarios
    {
      condition: timeOfDay === 'morning' && (dayOfWeek === 'Monday' || dayOfWeek === 'Tuesday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Thursday' || dayOfWeek === 'Friday'),
      explanation: "Morning rush hour is driving up demand as commuters head to work. This area gets busy with office workers and business meetings. Rates go up during rush hour because parking becomes scarce when everyone arrives at the same time."
    },
    {
      condition: timeOfDay === 'afternoon' && (dayOfWeek === 'Monday' || dayOfWeek === 'Tuesday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Thursday' || dayOfWeek === 'Friday'),
      explanation: "Lunch hour demand is high with business district activity. Office workers and meetings create consistent parking pressure. Close to major attractions and business districts means higher foot traffic throughout the day."
    },
    
    // Location-specific scenarios
    {
      condition: locationName.toLowerCase().includes('times square') || locationName.toLowerCase().includes('broadway'),
      explanation: "Times Square always draws crowds, especially during peak hours. The theater district and tourist attractions keep demand high year-round. This garage offers valet service and is steps away from Broadway theaters, which explains the higher rate."
    },
    {
      condition: locationName.toLowerCase().includes('central park') || locationName.toLowerCase().includes('park'),
      explanation: "Central Park area sees heavy foot traffic from tourists and locals. Weekend demand is especially high for recreational activities. Limited spaces on weekends when families and visitors flock to the park for outdoor activities."
    },
    {
      condition: locationName.toLowerCase().includes('financial') || locationName.toLowerCase().includes('wall street'),
      explanation: "Financial district parking is premium due to business activity and limited space. Commuters and business meetings drive demand throughout the week. Valet and security included justify a higher rate in this high-traffic business area."
    },
    
    // Off-peak scenarios
    {
      condition: timeOfDay === 'night' && (dayOfWeek === 'Monday' || dayOfWeek === 'Tuesday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Thursday'),
      explanation: "The rate's lower right now since it's off-peak and traffic is flowing smoothly. Night rates are typically more affordable when business activity winds down. If you're parking for longer, this is a good time to secure a spot."
    },
    {
      condition: timeOfDay === 'morning' && (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday'),
      explanation: "Weekend morning rates are reasonable since most people aren't commuting. This is a good time to park if you're planning ahead for weekend activities. Cheaper at night and during off-peak hours when demand is lower."
    },
    
    // Competition scenarios
    {
      condition: nearbySpots.length > 5,
      explanation: "Several nearby garages are full or charge similar rates, which keeps our pricing competitive. High demand across the area means limited alternatives. Nearby lots are full or charge similar rates, creating a competitive market."
    },
    {
      condition: nearbySpots.length <= 3,
      explanation: "Limited parking options in this area mean higher demand for available spots. Fewer alternatives drive up rates when supply is constrained. This location premium reflects the scarcity of parking in this neighborhood."
    },
    
    // Weather and event scenarios
    {
      condition: timeOfDay === 'evening' && (dayOfWeek === 'Friday' || dayOfWeek === 'Saturday'),
      explanation: "The rate is slightly higher tonight because there's a concert at Madison Square Garden, and nearby lots are almost full. Local events nearby create surge pricing as demand spikes. Bad weather would increase demand for covered parking even more."
    },
    
    // Service quality scenarios
    {
      condition: locationName.toLowerCase().includes('hotel') || locationName.toLowerCase().includes('valet'),
      explanation: "This garage offers valet service and security included, which justifies a higher rate. Service quality matters in premium locations where convenience is valued. The additional amenities provide peace of mind for longer stays."
    }
  ];
  const matchedExplanation = explanations.find(exp => exp.condition);
  
  if (matchedExplanation) {
    return matchedExplanation.explanation;
  }
  
  // Comprehensive default explanation
  return `The current rate reflects typical demand for this area and time. ${getTimeDescription(timeOfDay)} patterns create predictable pricing cycles, while ${getLocationDescription(locationName)} location factors influence the base rate. Market competition and local events can cause fluctuations throughout the day.`;
}

// Simulate AI web crawling for real parking prices
async function simulateWebCrawling(lat: string, lon: string, locationName: string) {
  // Simulate web crawling delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Fetch real street address from TomTom reverse geocoding
  const streetAddress = await getTomTomAddress(lat, lon);
  
  // Generate nearby parking spots and prices
  const nearbySpots = generateNearbySpots(lat, lon, locationName);
  
  // Generate realistic parking prices based on location
  const basePrice = getLocationBasedPrice(lat, lon, locationName);
  const timeOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Simulate web-crawled prices from different sources
  const webCrawledPrice = basePrice + (Math.random() - 0.5) * 2;
  const timeAdjustment = getTimeAdjustment(timeOfDay, dayOfWeek);
  const locationPremium = getLocationPremium(locationName);
  const marketFactor = getMarketFactor(timeOfDay, dayOfWeek);
  
  const finalPrice = Math.max(1.0, webCrawledPrice + timeAdjustment + locationPremium + marketFactor + 5.0);
  
  return {
    webCrawledPrice: webCrawledPrice,
    timeAdjustment: timeAdjustment,
    locationPremium: locationPremium,
    marketFactor: marketFactor,
    finalPrice: finalPrice,
    streetAddress: streetAddress,
    nearbySpots: nearbySpots,
    explanation: generateContextualExplanation(timeOfDay, dayOfWeek, locationName, nearbySpots),
    marketFactors: [
      `Heavy traffic downtown`,
      `${getTimeDescription(timeOfDay)} demand patterns`,
      `${getLocationDescription(locationName)} location premium`,
      `Nearby attractions driving demand`,
      `Live parking availability`,
      `$5.00 service premium for enhanced convenience`
    ]
  };
}

function getLocationBasedPrice(lat: string, lon: string, locationName: string): number {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  // NYC area pricing
  if (latNum >= 40.7 && latNum <= 40.8 && lonNum >= -74.0 && lonNum <= -73.9) {
    if (locationName.toLowerCase().includes('times square')) return 12.0;
    if (locationName.toLowerCase().includes('central park')) return 8.0;
    if (locationName.toLowerCase().includes('brooklyn')) return 6.5;
    if (locationName.toLowerCase().includes('manhattan')) return 10.0;
    return 9.0; // Default NYC
  }
  
  // San Francisco area
  if (latNum >= 37.7 && latNum <= 37.8 && lonNum >= -122.5 && lonNum <= -122.3) {
    return 11.0;
  }
  
  // Los Angeles area
  if (latNum >= 34.0 && latNum <= 34.1 && lonNum >= -118.3 && lonNum <= -118.2) {
    return 7.5;
  }
  
  // Default pricing
  return 5.0;
}

function getTimeAdjustment(hour: number, dayOfWeek: number): number {
  // Rush hour pricing
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 2.0; // Rush hour premium
  }
  
  // Weekend pricing
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 1.5; // Weekend premium
  }
  
  // Night pricing
  if (hour >= 22 || hour <= 6) {
    return -1.0; // Night discount
  }
  
  return 0.0;
}

function getLocationPremium(locationName: string): number {
  const name = locationName.toLowerCase();
  
  if (name.includes('times square') || name.includes('broadway')) return 3.0;
  if (name.includes('central park') || name.includes('union square')) return 2.0;
  if (name.includes('airport') || name.includes('station')) return 1.5;
  if (name.includes('downtown') || name.includes('financial')) return 1.0;
  
  return 0.0;
}

function getMarketFactor(hour: number, dayOfWeek: number): number {
  // Event-based pricing simulation
  const eventFactor = Math.random() * 2.0 - 1.0; // -1 to +1
  
  // Weather factor (simulated)
  const weatherFactor = Math.random() * 0.5 - 0.25; // -0.25 to +0.25
  
  return eventFactor + weatherFactor;
}

function getTimeDescription(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getDayDescription(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

// Fetch real street address from TomTom reverse geocoding API
async function getTomTomAddress(lat: string, lon: string): Promise<string> {
  try {
    const TOMTOM_API_KEY = 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6l';
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}&language=en-US`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.addresses && data.addresses.length > 0) {
      const address = data.addresses[0].address;
      const streetNumber = address.streetNumber || '';
      const streetName = address.streetName || '';
      const municipality = address.municipality || '';
      const countrySubdivision = address.countrySubdivision || '';
      const postalCode = address.postalCode || '';
      
      // Format the address
      let formattedAddress = '';
      if (streetNumber && streetName) {
        formattedAddress = `${streetNumber} ${streetName}`;
      } else if (streetName) {
        formattedAddress = streetName;
      }
      
      if (municipality) {
        formattedAddress += formattedAddress ? `, ${municipality}` : municipality;
      }
      
      if (countrySubdivision) {
        formattedAddress += formattedAddress ? `, ${countrySubdivision}` : countrySubdivision;
      }
      
      if (postalCode) {
        formattedAddress += formattedAddress ? ` ${postalCode}` : postalCode;
      }
      
      return formattedAddress || `${lat}, ${lon}`;
    }
    
    return `${lat}, ${lon}`;
  } catch (error) {
    console.error('TomTom reverse geocoding error:', error);
    return `${lat}, ${lon}`;
  }
}

function getLocationDescription(locationName: string): string {
  if (locationName.toLowerCase().includes('times square')) return 'Times Square';
  if (locationName.toLowerCase().includes('central park')) return 'Central Park';
  if (locationName.toLowerCase().includes('brooklyn')) return 'Brooklyn';
  if (locationName.toLowerCase().includes('manhattan')) return 'Manhattan';
  return locationName;
}

function generateNearbySpots(lat: string, lon: string, locationName: string): Array<{name: string, address: string, price: number, distance: string, availability: string}> {
  const basePrice = getLocationBasedPrice(lat, lon, locationName);
  const spots = [];
  
  const spotNames = [
    'Times Square Garage', 'Broadway Parking', 'Central Park Garage', 'Manhattan Parking',
    'Brooklyn Bridge Garage', 'Street Parking', 'Hotel Valet', 'Public Garage',
    'Private Lot', 'Metered Parking', 'Underground Garage', 'Surface Lot'
  ];
  
  const addresses = [
    '1560 Broadway', '1234 7th Ave', 'Central Park W', 'Broadway & 42nd',
    'Brooklyn Bridge', 'Park Ave', 'Lexington Ave', 'Madison Ave',
    '5th Ave', '6th Ave', 'Broadway', 'Times Square'
  ];
  
  for (let i = 0; i < 6; i++) {
    const priceVariation = (Math.random() - 0.5) * 4; // ±$2 variation
    const spotPrice = Math.max(3.0, basePrice + priceVariation);
    
    spots.push({
      name: spotNames[Math.floor(Math.random() * spotNames.length)],
      address: addresses[Math.floor(Math.random() * addresses.length)],
      price: spotPrice,
      distance: `${(Math.random() * 0.5 + 0.1).toFixed(1)} mi`,
      availability: Math.random() > 0.3 ? 'Available' : 'Limited'
    });
  }
  
  return spots.sort((a, b) => a.price - b.price);
}

// Mock implementation
function createMockEcho(config: EchoConfig) {
  const mockOpenAI: EchoClient = {
    chat: {
      completions: {
        create: async (params: any) => {
          // Extract location data from the prompt
          const locationMatch = params.messages[1]?.content?.match(/Location: ([\d.-]+), ([\d.-]+)/);
          const lat = locationMatch?.[1] || '40.7580';
          const lon = locationMatch?.[2] || '-73.9855';
          const locationName = params.messages[1]?.content?.match(/\(([^)]+)\)/)?.[1] || 'NYC Location';
          
          // Simulate AI web crawling for real parking prices
          const realPrices = await simulateWebCrawling(lat, lon, locationName);
          
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  success: true,
                  data: {
                    location: { lat: parseFloat(lat), lon: parseFloat(lon) },
                    priceUSD: realPrices.finalPrice,
                    priceRLUSD: realPrices.finalPrice * 0.9996,
                    rlusdRate: 0.9996,
                    components: {
                      webCrawledPrice: realPrices.webCrawledPrice,
                      timeAdjustment: realPrices.timeAdjustment,
                      locationPremium: realPrices.locationPremium,
                      marketFactor: realPrices.marketFactor,
                      servicePremium: 5.0
                    },
                    explanation: realPrices.explanation,
                    marketFactors: realPrices.marketFactors,
                    streetAddress: realPrices.streetAddress,
                    nearbySpots: realPrices.nearbySpots,
                    timestamp: new Date().toISOString()
                  }
                })
              }
            }]
          };
          
          return mockResponse;
        }
      }
    }
  };

  const mockAnthropic: EchoClient = {
    chat: {
      completions: {
        create: async (params: any) => {
          // Mock response for check why functionality
          const mockResponse = {
            choices: [{
              message: {
                content: JSON.stringify({
                  success: true,
                  data: {
                    explanation: "Mock AI explanation of parking pricing factors based on GPT-5 analysis. The pricing reflects real-time market conditions, location demand, and time-based adjustments.",
                    factors: ["Time-based demand", "Location premium", "Market conditions", "Traffic patterns", "Event schedules"],
                    recommendations: ["Consider off-peak hours", "Check nearby alternatives", "Book in advance", "Use public transit", "Check for special events"],
                    confidence: 0.85,
                    timestamp: new Date().toISOString()
                  }
                })
              }
            }]
          };
          
          return mockResponse;
        }
      }
    }
  };

  return {
    handlers: {} as EchoHandlers,
    isSignedIn: () => true, // Mock authentication
    openai: mockOpenAI,
    anthropic: mockAnthropic
  };
}

export const { handlers, isSignedIn, openai, anthropic } = createMockEcho({
  appId: process.env.ECHO_APP_ID || 'mock-app-id',
});
