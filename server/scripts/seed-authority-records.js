import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuthorityRecords from '../models/authority-records-model.js';

dotenv.config();

const records = [
  {
    standNumber: "HRE-BD-2456",
    currentOwner: {
      name: "Tendai Moyo",
      nationalId: "63-245678Z45"
    },
    location: {
      type: "Point",
      coordinates: [31.0893, -17.7566],
      street: "123 Borrowdale Road",
      suburb: "HARARE",
      city: "Harare",
      province: "HARARE"
    },
    standSize: { squareMeters: 500 },
    landUseType: "RESIDENTIAL",
    allocationStatus: "ALLOCATED",
    status: "VALID",
    titleDeedNumber: "TD-2021-009876",
    councilReferenceNumber: "HCC-BD-2456",
  },
  {
    standNumber: "HRE-AV-1789",
    currentOwner: {
      name: "Rudo Chikomba",
      nationalId: "12-987654A12"
    },
    location: {
      type: "Point",
      coordinates: [31.0348, -17.8019],
      street: "45 Avondale Drive",
      suburb: "HARARE",
      city: "Harare",
      province: "HARARE"
    },
    standSize: { squareMeters: 450 },
    landUseType: "RESIDENTIAL",
    allocationStatus: "ALLOCATED",
    status: "VALID",
    titleDeedNumber: "TD-2020-004321",
    councilReferenceNumber: "HCC-AV-1789",
  },
  {
    standNumber: "HRE-WG-3321",
    currentOwner: {
      name: "Blessing Ncube",
      nationalId: "45-112233B67"
    },
    location: {
      type: "Point",
      coordinates: [30.9618, -17.7551],
      street: "12 Westgate Crescent",
      suburb: "HARARE",
      city: "Harare",
      province: "HARARE"
    },
    standSize: { squareMeters: 600 },
    landUseType: "RESIDENTIAL",
    allocationStatus: "ALLOCATED",
    status: "VALID",
    titleDeedNumber: "TD-2019-002211",
    councilReferenceNumber: "HCC-WG-3321",
  },
  {
    standNumber: "HRE-SM-9901",
    currentOwner: {
      name: "Farai Mutasa",
      nationalId: "22-445566C89"
    },
    location: {
      type: "Point",
      coordinates: [31.0522, -17.8292],
      street: "88 Samora Machel Avenue",
      suburb: "HARARE",
      city: "Harare",
      province: "HARARE"
    },
    standSize: { squareMeters: 350 },
    landUseType: "RESIDENTIAL",
    allocationStatus: "ALLOCATED",
    status: "VALID",
    titleDeedNumber: "TD-2022-001144",
    councilReferenceNumber: "HCC-SM-9901",
  },
  {
    standNumber: "BYO-CT-1022",
    currentOwner: {
      name: "John Doe",
      nationalId: "00-112233X00"
    },
    location: {
      type: "Point",
      coordinates: [28.5833, -20.1500],
      street: "15 Main Street",
      suburb: "BULAWAYO",
      city: "Bulawayo",
      province: "BULAWAYO"
    },
    standSize: { squareMeters: 1200 },
    landUseType: "RESIDENTIAL",
    allocationStatus: "ALLOCATED",
    status: "VALID",
    titleDeedNumber: "TD-BYO-2024-001",
    councilReferenceNumber: "BCC-CT-1022",
  },
];

async function seedAuthorityRecords() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not set");

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    await AuthorityRecords.deleteMany({});
    console.log("🗑️ Cleared existing authority records");

    await AuthorityRecords.insertMany(records);
    console.log("✅ Authority records seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed authority records:", error);
    process.exit(1);
  }
}

seedAuthorityRecords();
