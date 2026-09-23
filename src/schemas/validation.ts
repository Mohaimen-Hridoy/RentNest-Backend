import { z } from 'zod';

// Bangladeshi phone regex: supports +8801XXXXXXXXX or 01XXXXXXXXX
const bdPhoneRegex = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const bookingFormSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  tenantName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(80, 'Full name cannot exceed 80 characters'),
  tenantPhone: z
    .string()
    .regex(bdPhoneRegex, 'Please enter a valid Bangladesh phone number (e.g. 01712345678 or +8801712345678)'),
  tenantEmail: z
    .string()
    .email('Please enter a valid email address'),
  visitDate: z
    .string()
    .min(1, 'Please select a preferred visit date'),
  timeSlot: z.enum(['morning', 'afternoon', 'evening'], {
    error: 'Please choose a convenient time slot',
  }),
  visitType: z.enum(['in_person', 'virtual_tour'], {
    error: 'Please choose visit modality',
  }),
  notes: z.string().max(400, 'Notes cannot exceed 400 characters').optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const listingFormSchema = z.object({
  titleEn: z.string().min(5, 'Title must be at least 5 characters'),
  titleBn: z.string().min(5, 'বাংলা শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে'),
  neighborhoodEn: z.string().min(2, 'Neighborhood is required'),
  neighborhoodBn: z.string().min(2, 'এলাকার নাম আবশ্যক'),
  addressEn: z.string().min(5, 'Detailed street address is required'),
  rent: z.number().min(10000, 'Monthly rent must be at least ৳10,000'),
  serviceCharge: z.number().min(0, 'Service charge cannot be negative'),
  bedrooms: z.number().min(1, 'At least 1 bedroom required'),
  bathrooms: z.number().min(1, 'At least 1 bathroom required'),
  sqft: z.number().min(300, 'Square footage must be at least 300 sqft'),
  floor: z.string().min(1, 'Floor specification required'),
  furnishing: z.enum(['fully_furnished', 'semi_furnished', 'unfurnished']),
  propertyType: z.enum(['apartment', 'penthouse', 'duplex', 'studio']),
  rajukVerified: z.boolean(),
  escrowProtected: z.boolean(),
  descriptionEn: z.string().min(20, 'Please write at least 20 characters description'),
  ownerPhone: z.string().regex(bdPhoneRegex, 'Enter valid Bangladeshi contact phone'),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

export const escrowInquirySchema = z.object({
  propertyId: z.string().min(1, 'Property required'),
  tenantName: z.string().min(3, 'Name required'),
  tenantPhone: z.string().regex(bdPhoneRegex, 'Valid Bangladesh phone number required'),
  monthlyRent: z.number().positive(),
  tenancyDurationMonths: z.number().min(6).max(36),
  depositMonths: z.number().min(1).max(6).default(2),
  bankPartner: z.string().min(2, 'Custodian bank partner required'),
});

export type EscrowInquiryValues = z.infer<typeof escrowInquirySchema>;
