import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create demo parking lot
  const parkingLot = await prisma.parkingLot.create({
    data: {
      name: 'Main Street Parking',
      address: '123 Main Street, Downtown',
      totalSpots: 20,
      latitude: 40.7128,
      longitude: -74.0060,
      ratePerMin: 0.12
    }
  });
  
  console.log(`✅ Created parking lot: ${parkingLot.name}`);
  
  // Create spots
  const spots = [];
  for (let i = 1; i <= parkingLot.totalSpots; i++) {
    const spot = await prisma.spot.create({
      data: {
        number: i,
        isAvailable: Math.random() > 0.3, // 70% availability
        parkingLotId: parkingLot.id
      }
    });
    spots.push(spot);
  }
  
  console.log(`✅ Created ${spots.length} parking spots`);
  
  // Create demo wallet
  const wallet = await prisma.wallet.create({
    data: {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      rlusdBalance: 25.50
    }
  });
  
  console.log(`✅ Created demo wallet: ${wallet.address}`);
  
  // Create some demo sessions
  const demoSession = await prisma.session.create({
    data: {
      walletAddress: wallet.address,
      spotId: spots[0].id,
      parkingLotId: parkingLot.id,
      startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      status: 'ACTIVE'
    }
  });
  
  const completedSession = await prisma.session.create({
    data: {
      walletAddress: wallet.address,
      spotId: spots[1].id,
      parkingLotId: parkingLot.id,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      totalAmount: 10.80, // 90 minutes * 0.12
      status: 'ENDED',
      xrplTxHash: 'tx_1703123456_abc123def'
    }
  });
  
  console.log(`✅ Created demo sessions`);
  
  // Create some demo anomalies
  await prisma.anomaly.createMany({
    data: [
      {
        type: 'RAPID_SESSION_START_END',
        description: 'Suspicious rapid session start/end by Wallet 0xA3...',
        walletAddress: '0xA3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2',
        severity: 'HIGH'
      },
      {
        type: 'HIGH_FREQUENCY_USAGE',
        description: 'Unusual high frequency usage pattern detected',
        walletAddress: '0xB4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3',
        severity: 'MEDIUM'
      }
    ]
  });
  
  console.log(`✅ Created demo anomalies`);
  
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
