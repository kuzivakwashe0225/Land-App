import mongoose from 'mongoose';
import Stands from '../models/stands-model.js';

// Real Harare suburbs with actual coordinates and stands
const hararStands = [
  // BORROWDALE - High-density residential area
  {
    standNumber: 'HARARE-BOR-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8233, longitude: 31.0340 },
    size: { squareMeters: 1000, hectares: 0.1 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12,
      setbackRequirements: {
        frontSetbackMeters: 6,
        sideSetbackMeters: 3,
        rearSetbackMeters: 3
      },
      hasEIA: true,
      hasFloodRisk: false,
      restrictions: ['Residential only', 'No commercial activities']
    }
  },
  {
    standNumber: 'HARARE-BOR-002',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8245, longitude: 31.0350 },
    size: { squareMeters: 1200, hectares: 0.12 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12,
      setbackRequirements: {
        frontSetbackMeters: 6,
        sideSetbackMeters: 3,
        rearSetbackMeters: 3
      }
    }
  },
  {
    standNumber: 'HARARE-BOR-003',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8210, longitude: 31.0330 },
    size: { squareMeters: 900, hectares: 0.09 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'ALLOCATED',
    allocation: {
      allocatedTo: 'Tendai Moyo',
      nationalId: '63-245678Z45',
      allocationDate: new Date('2021-06-15')
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12
    }
  },

  // AVONDALE - Commercial/Mixed use area
  {
    standNumber: 'HARARE-AVON-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8412, longitude: 31.0445 },
    size: { squareMeters: 1500, hectares: 0.15 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 18,
      setbackRequirements: {
        frontSetbackMeters: 8,
        sideSetbackMeters: 4,
        rearSetbackMeters: 4
      },
      restrictions: ['Commercial use only', 'No residential']
    }
  },
  {
    standNumber: 'HARARE-AVON-002',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8425, longitude: 31.0455 },
    size: { squareMeters: 2000, hectares: 0.20 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 18
    }
  },

  // MOUNT PLEASANT - Mixed use
  {
    standNumber: 'HARARE-MP-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8645, longitude: 31.0312 },
    size: { squareMeters: 1100, hectares: 0.11 },
    zoning: 'MIXED_USE',
    intendedUse: 'MIXED_USE',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 15
    }
  },
  {
    standNumber: 'HARARE-MP-002',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8660, longitude: 31.0320 },
    size: { squareMeters: 800, hectares: 0.08 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12
    }
  },

  // HIGHFIELD - High-density residential
  {
    standNumber: 'HARARE-HF-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8834, longitude: 31.0567 },
    size: { squareMeters: 500, hectares: 0.05 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 10,
      setbackRequirements: {
        frontSetbackMeters: 4,
        sideSetbackMeters: 2,
        rearSetbackMeters: 2
      }
    }
  },
  {
    standNumber: 'HARARE-HF-002',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8850, longitude: 31.0580 },
    size: { squareMeters: 550, hectares: 0.055 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 10
    }
  },

  // SELBORNE PARK - Low-density residential
  {
    standNumber: 'HARARE-SEL-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.7933, longitude: 31.0234 },
    size: { squareMeters: 2500, hectares: 0.25 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12,
      setbackRequirements: {
        frontSetbackMeters: 8,
        sideSetbackMeters: 5,
        rearSetbackMeters: 5
      }
    }
  },

  // BUSINESS DISTRICT - Commercial
  {
    standNumber: 'HARARE-BD-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8280, longitude: 31.0470 },
    size: { squareMeters: 3000, hectares: 0.30 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 25,
      setbackRequirements: {
        frontSetbackMeters: 10,
        sideSetbackMeters: 6,
        rearSetbackMeters: 6
      }
    }
  },
  {
    standNumber: 'HARARE-BD-002',
    suburb: 'HARARE',
    coordinates: { latitude: -17.8295, longitude: 31.0485 },
    size: { squareMeters: 3500, hectares: 0.35 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 25
    }
  },

  // INDUSTRIAL AREA
  {
    standNumber: 'HARARE-IND-001',
    suburb: 'HARARE',
    coordinates: { latitude: -17.9100, longitude: 31.0600 },
    size: { squareMeters: 5000, hectares: 0.50 },
    zoning: 'INDUSTRIAL',
    intendedUse: 'INDUSTRIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Harare City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 20,
      restrictions: ['Industrial use only', 'Heavy machinery allowed']
    }
  },

  // CHITUNGWIZA stands
  {
    standNumber: 'CHITUNGWIZA-001',
    suburb: 'CHITUNGWIZA',
    coordinates: { latitude: -17.9933, longitude: 31.0733 },
    size: { squareMeters: 800, hectares: 0.08 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Chitungwiza Local Authority',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 10
    }
  },
  {
    standNumber: 'CHITUNGWIZA-002',
    suburb: 'CHITUNGWIZA',
    coordinates: { latitude: -17.9945, longitude: 31.0745 },
    size: { squareMeters: 1000, hectares: 0.10 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Chitungwiza Local Authority',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 15
    }
  },

  // BULAWAYO stands
  {
    standNumber: 'BULAWAYO-001',
    suburb: 'BULAWAYO',
    coordinates: { latitude: -20.1534, longitude: 28.5832 },
    size: { squareMeters: 1200, hectares: 0.12 },
    zoning: 'RESIDENTIAL',
    intendedUse: 'RESIDENTIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Bulawayo City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 12
    }
  },
  {
    standNumber: 'BULAWAYO-002',
    suburb: 'BULAWAYO',
    coordinates: { latitude: -20.1545, longitude: 28.5843 },
    size: { squareMeters: 1500, hectares: 0.15 },
    zoning: 'COMMERCIAL',
    intendedUse: 'COMMERCIAL',
    status: 'VACANT',
    authority: {
      authorityName: 'Bulawayo City Council',
      allocationType: 'LOCAL_AUTHORITY'
    },
    compliance: {
      plotRatioApproved: true,
      buildingHeightLimitMeters: 18
    }
  }
];

async function seedHarareStands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/landsolutions');
    console.log('✓ Connected to MongoDB');

    // Check if data already exists
    const count = await Stands.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing stands. Clearing...`);
      await Stands.deleteMany({});
    }

    // Insert new data
    const result = await Stands.insertMany(hararStands);
    console.log(`✓ Seeded ${result.length} stands into database`);

    // Display statistics
    const stats = await Stands.aggregate([
      {
        $group: {
          _id: {
            suburb: '$suburb',
            zoning: '$zoning',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.suburb': 1, '_id.zoning': 1 } }
    ]);

    console.log('\n📊 Stand Distribution:');
    stats.forEach(stat => {
      console.log(`  ${stat._id.suburb} - ${stat._id.zoning} - ${stat._id.status}: ${stat.count}`);
    });

    // Count by status
    const byStatus = await Stands.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📈 Stand Status Summary:');
    byStatus.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    console.log('\n✓ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedHarareStands();
