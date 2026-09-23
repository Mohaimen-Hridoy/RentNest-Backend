import express, { Request, Response } from 'express';
import { SEED_PROPERTIES } from './src/data/seedProperties.ts';
import { Property, BookingResponse } from './src/types/property.ts';
import { bookingFormSchema, listingFormSchema, escrowInquirySchema } from './src/schemas/validation.ts';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());

// In-memory data store initialized with seed properties
let properties: Property[] = [...SEED_PROPERTIES];
const bookings: BookingResponse[] = [];
const escrowInquiries: any[] = [];

// ================= API ENDPOINTS ================= //

// GET /api/properties with rich filtering & sorting
app.get('/api/properties', (req: Request, res: Response) => {
  const {
    search,
    minPrice,
    maxPrice,
    bedrooms,
    propertyType,
    furnishing,
    escrowOnly,
    sortBy,
  } = req.query;

  let results = [...properties];

  // 1. Search Query filter (checks title, address, neighborhood, subArea in both En & Bn)
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter((p) => {
      return (
        p.titleEn.toLowerCase().includes(q) ||
        p.titleBn.toLowerCase().includes(q) ||
        p.neighborhoodEn.toLowerCase().includes(q) ||
        p.neighborhoodBn.toLowerCase().includes(q) ||
        p.subAreaEn.toLowerCase().includes(q) ||
        p.subAreaBn.toLowerCase().includes(q) ||
        p.addressEn.toLowerCase().includes(q) ||
        p.addressBn.toLowerCase().includes(q)
      );
    });
  }

  // 2. Price filtering
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) {
      results = results.filter((p) => p.rent >= min);
    }
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      results = results.filter((p) => p.rent <= max);
    }
  }

  // 3. Bedroom filtering (e.g. 3 means >= 3)
  if (bedrooms) {
    const beds = Number(bedrooms);
    if (!isNaN(beds)) {
      results = results.filter((p) => p.bedrooms >= beds);
    }
  }

  // 4. Property Type
  if (propertyType && propertyType !== 'all') {
    results = results.filter((p) => p.propertyType === propertyType);
  }

  // 5. Furnishing
  if (furnishing && furnishing !== 'all') {
    results = results.filter((p) => p.furnishing === furnishing);
  }

  // 6. Escrow verification only
  if (escrowOnly === 'true' || escrowOnly === '1') {
    results = results.filter((p) => p.escrowProtected);
  }

  // 7. Sorting
  if (sortBy === 'price_asc') {
    results.sort((a, b) => a.rent - b.rent);
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => b.rent - a.rent);
  } else if (sortBy === 'newest') {
    results.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else {
    // Featured / Popularity default
    results.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);
  }

  res.json({
    success: true,
    total: results.length,
    data: results,
  });
});

// GET /api/properties/:id
app.get('/api/properties/:id', (req: Request, res: Response) => {
  const property = properties.find((p) => p.id === req.params.id);
  if (!property) {
    res.status(404).json({ success: false, message: 'Property not found' });
    return;
  }
  res.json({ success: true, data: property });
});

// POST /api/bookings (Schedule a visit with Zod validation)
app.post('/api/bookings', (req: Request, res: Response) => {
  const parseResult = bookingFormSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parseResult.error.format(),
    });
    return;
  }

  const data = parseResult.data;
  const property = properties.find((p) => p.id === data.propertyId);
  if (!property) {
    res.status(404).json({ success: false, message: 'Invalid property ID' });
    return;
  }

  const bookingCode = `RN-VISIT-${Math.floor(100000 + Math.random() * 900000)}`;
  const newBooking: BookingResponse = {
    ...data,
    id: `booking-${Date.now()}`,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    verificationCode: bookingCode,
  };

  bookings.unshift(newBooking);

  res.status(201).json({
    success: true,
    message: 'Visit scheduled successfully! Our verified tenancy agent has been notified.',
    data: newBooking,
    propertyTitle: property.titleEn,
  });
});

// POST /api/properties (Landlord adding verified listing)
app.post('/api/properties', (req: Request, res: Response) => {
  const parseResult = listingFormSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parseResult.error.format(),
    });
    return;
  }

  const val = parseResult.data;
  const newId = `prop-custom-${Date.now()}`;
  const newProperty: Property = {
    id: newId,
    titleEn: val.titleEn,
    titleBn: val.titleBn,
    neighborhoodEn: val.neighborhoodEn,
    neighborhoodBn: val.neighborhoodBn,
    subAreaEn: val.neighborhoodEn,
    subAreaBn: val.neighborhoodBn,
    addressEn: val.addressEn,
    addressBn: val.addressEn,
    rent: val.rent,
    serviceCharge: val.serviceCharge,
    advanceDepositMonths: 2,
    bedrooms: val.bedrooms,
    bathrooms: val.bathrooms,
    balconies: 2,
    sqft: val.sqft,
    floor: val.floor,
    furnishing: val.furnishing,
    propertyType: val.propertyType,
    rajukVerified: val.rajukVerified,
    escrowProtected: val.escrowProtected,
    instantBook: false,
    directOwner: true,
    diplomaticSecure: false,
    isNew: true,
    rating: 5.0,
    reviewCount: 1,
    images: ['/src/assets/images/rentnest_gulshan_lakeview_1790194743752.jpg'],
    mapCoords: {
      topPercent: 35 + Math.random() * 20,
      leftPercent: 35 + Math.random() * 30,
    },
    tagsEn: ['New Listing', 'Direct Owner Deal', 'Verified'],
    tagsBn: ['নতুন লিস্টিং', 'সরাসরি ওনার ডিল', 'ভেরিফাইড'],
    descriptionEn: val.descriptionEn,
    descriptionBn: val.descriptionEn,
    amenities: [
      { nameEn: '24/7 Security & CCTV', nameBn: '২৪/৭ সিসিটিভি ও গার্ড', icon: 'shield' },
      { nameEn: 'Standby Generator', nameBn: 'জেনারেটর ব্যাকআপ', icon: 'bolt' },
      { nameEn: 'Covered Car Parking', nameBn: 'কার পার্কিং', icon: 'car' },
    ],
    landlord: {
      name: 'Verified Landlord',
      verified: true,
      phone: val.ownerPhone,
      responseTime: 'Under 1 hour',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      rating: 5.0,
      propertiesListed: 1,
    },
    legalAudit: {
      rajukPlanNo: `RAJUK/${Date.now().toString().slice(-6)}`,
      deedVerifiedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      escrowCustodianBank: 'BRAC Bank Limited',
      tenancyContractType: 'RentNest Standard Bi-lingual Escrow Lease',
      cctvSurveillance: true,
      fireSafetyApproved: true,
    },
  };

  properties.unshift(newProperty);

  res.status(201).json({
    success: true,
    message: 'Listing submitted and successfully verified for RentNest marketplace!',
    data: newProperty,
  });
});

// POST /api/escrow-inquiry
app.post('/api/escrow-inquiry', (req: Request, res: Response) => {
  const parseResult = escrowInquirySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parseResult.error.format(),
    });
    return;
  }

  const inquiry = {
    ...parseResult.data,
    id: `escrow-${Date.now()}`,
    createdAt: new Date().toISOString(),
    escrowAccountRef: `ESC-BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
  };
  escrowInquiries.push(inquiry);

  res.status(201).json({
    success: true,
    message: 'Escrow protection application initiated. Security deposit is locked in trust bank until key handover.',
    data: inquiry,
  });
});

// GET /api/tenancy-protection
app.get('/api/tenancy-protection', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalProtectedDepositsBDT: '৳ ১২,৫০,০০,০০০+',
      verifiedOwnersRate: '100%',
      partnerBanks: ['BRAC Bank Ltd', 'The City Bank Ltd', 'Eastern Bank Ltd', 'Standard Chartered Bangladesh'],
      legalCoverage: 'The Tenancy Act of Bangladesh compliant bi-lingual digital contract',
      disputeResolutionGuarantee: '48-hour neutral mediation board before any deposit disbursement',
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RentNest API running at http://0.0.0.0:${PORT}`);
});
