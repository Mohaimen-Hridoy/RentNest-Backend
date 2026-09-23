export type PropertyType = 'apartment' | 'penthouse' | 'duplex' | 'studio';
export type FurnishingType = 'fully_furnished' | 'semi_furnished' | 'unfurnished';

export interface Amenity {
  nameEn: string;
  nameBn: string;
  icon: string;
}

export interface LandlordInfo {
  name: string;
  verified: boolean;
  phone: string;
  responseTime: string;
  avatar: string;
  rating: number;
  propertiesListed: number;
}

export interface LegalAudit {
  rajukPlanNo: string;
  deedVerifiedDate: string;
  escrowCustodianBank: string;
  tenancyContractType: string;
  cctvSurveillance: boolean;
  fireSafetyApproved: boolean;
}

export interface Property {
  id: string;
  titleEn: string;
  titleBn: string;
  neighborhoodEn: string;
  neighborhoodBn: string;
  subAreaEn: string;
  subAreaBn: string;
  addressEn: string;
  addressBn: string;
  rent: number;
  serviceCharge: number;
  advanceDepositMonths: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  sqft: number;
  floor: string;
  furnishing: FurnishingType;
  propertyType: PropertyType;
  rajukVerified: boolean;
  escrowProtected: boolean;
  instantBook: boolean;
  directOwner: boolean;
  diplomaticSecure: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  mapCoords: {
    topPercent: number;
    leftPercent: number;
  };
  tagsEn: string[];
  tagsBn: string[];
  descriptionEn: string;
  descriptionBn: string;
  amenities: Amenity[];
  landlord: LandlordInfo;
  legalAudit: LegalAudit;
}

export interface BookingRequest {
  propertyId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  visitDate: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  visitType: 'in_person' | 'virtual_tour';
  notes?: string;
}

export interface BookingResponse extends BookingRequest {
  id: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
  verificationCode: string;
}

export interface EscrowInquiry {
  propertyId: string;
  tenantName: string;
  tenantPhone: string;
  monthlyRent: number;
  tenancyDurationMonths: number;
  depositAmount: number;
  bankPartner: string;
}

export interface PropertyFilterParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  furnishing?: string;
  escrowOnly?: boolean;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'newest';
}
