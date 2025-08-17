/**
 * Firestore Database Schema for Sportsmagasinet
 * 
 * Collections and their structure:
 */

export const collections = {
  users: 'users',
  clubs: 'clubs',
  licenses: 'licenses',
  licensePackages: 'licensePackages',
  articles: 'articles',
  subscriptions: 'subscriptions',
  invitations: 'invitations',
  transactions: 'transactions',
  sales: 'sales',
};

/**
 * User Schema
 * Role types: platform_admin, agent, club_admin, seller, subscriber
 */
export const userSchema = {
  uid: '', // Firebase Auth UID
  email: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  phoneNumber: '',
  role: '', // platform_admin | agent | club_admin | seller | subscriber
  language: 'nb', // nb (Norwegian) | sv (Swedish)
  createdAt: null,
  updatedAt: null,
  
  // Agent specific fields
  companyName: '',
  vatNumber: '',
  address: '',
  
  // Club Admin specific fields
  clubId: '',
  
  // Seller specific fields
  assignedLicenses: 0,
  soldLicenses: 0,
  clubId: '',
  
  // Subscriber specific fields
  subscriptionId: '',
  subscriptionStatus: '', // active | cancelled | expired
  subscriptionEndDate: null,
  purchasedFromClubId: '',
  purchasedBySellerId: '',
};

/**
 * Club Schema
 */
export const clubSchema = {
  id: '',
  name: '',
  vatNumber: '',
  address: '',
  adminId: '', // User ID of club admin
  agentId: '', // User ID of agent who registered the club
  packageId: '', // Selected license package
  packageSize: 0, // 100, 250, 500, 1000, 2000, 4000+
  packagePrice: 0, // Total package price
  pricePerLicense: 0, // Price per license for the club
  licensesPurchased: false,
  totalLicenses: 0,
  usedLicenses: 0,
  availableLicenses: 0,
  createdAt: null,
  updatedAt: null,
  sellers: [], // Array of seller user IDs
  stripeCustomerId: '',
  stripePaymentIntentId: '',
};

/**
 * License Package Schema (Predefined packages)
 */
export const licensePackageSchema = {
  id: '',
  size: 0, // 100, 250, 500, 1000, 2000, 4000
  basePrice: 1200, // 100 NOK * 12 months
  pricePerLicense: 0, // Club cost per license
  clubProfit: 0, // Club profit per license (100 - pricePerLicense)
  totalClubProfit: 0, // Total potential club profit
  companyRevenue: 0, // Platform revenue (minus 1 NOK provision)
};

/**
 * License Packages Configuration
 * Based on the pricing structure provided
 */
export const licensePackages = [
  {
    size: 100,
    basePrice: 1200,
    pricePerLicense: 49,
    clubProfit: 51,
    totalClubProfit: 6120,
    companyRevenue: 5700,
  },
  {
    size: 250,
    basePrice: 3000,
    pricePerLicense: 47,
    clubProfit: 53,
    totalClubProfit: 15900,
    companyRevenue: 13800,
  },
  {
    size: 500,
    basePrice: 6000,
    pricePerLicense: 41,
    clubProfit: 59,
    totalClubProfit: 35400,
    companyRevenue: 24000,
  },
  {
    size: 1000,
    basePrice: 12000,
    pricePerLicense: 37,
    clubProfit: 63,
    totalClubProfit: 75600,
    companyRevenue: 43200,
  },
  {
    size: 2000,
    basePrice: 24000,
    pricePerLicense: 35,
    clubProfit: 65,
    totalClubProfit: 156000,
    companyRevenue: 81600,
  },
  {
    size: 4000,
    basePrice: 48000,
    pricePerLicense: 32,
    clubProfit: 68,
    totalClubProfit: 326400,
    companyRevenue: 148800,
  },
];

/**
 * Article Schema
 */
export const articleSchema = {
  id: '',
  title: '',
  titleSv: '', // Swedish title
  slug: '',
  excerpt: '',
  excerptSv: '', // Swedish excerpt
  content: '',
  contentSv: '', // Swedish content
  author: '',
  authorId: '',
  category: '',
  tags: [],
  featuredImage: '',
  published: false,
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
  viewCount: 0,
  isPremium: true, // Requires subscription
};

/**
 * Subscription Schema
 */
export const subscriptionSchema = {
  id: '',
  userId: '',
  clubId: '',
  sellerId: '',
  startDate: null,
  endDate: null,
  status: '', // active | cancelled | expired | pending
  price: 100, // Monthly price in NOK
  billingCycle: 'monthly',
  stripeSubscriptionId: '',
  stripeCustomerId: '',
  createdAt: null,
  updatedAt: null,
  lastPaymentDate: null,
  nextPaymentDate: null,
};

/**
 * Invitation Schema
 */
export const invitationSchema = {
  id: '',
  type: '', // agent | club_admin | seller | subscriber
  email: '',
  phoneNumber: '', // For subscriber invites via SMS
  invitedBy: '', // User ID of inviter
  invitedByRole: '', // Role of inviter
  token: '', // Unique invitation token
  status: '', // pending | accepted | expired
  metadata: {
    // For agent invitations
    agentEmail: '',
    
    // For club admin invitations
    clubName: '',
    packageId: '',
    agentId: '',
    
    // For seller invitations
    clubId: '',
    clubName: '',
    
    // For subscriber invitations
    clubId: '',
    clubName: '',
    sellerId: '',
    price: 100,
  },
  createdAt: null,
  expiresAt: null,
  acceptedAt: null,
};

/**
 * Transaction Schema
 */
export const transactionSchema = {
  id: '',
  type: '', // license_package_purchase | subscription_payment
  amount: 0,
  currency: 'NOK',
  status: '', // pending | completed | failed | refunded
  userId: '',
  clubId: '',
  description: '',
  stripePaymentIntentId: '',
  stripeChargeId: '',
  metadata: {},
  createdAt: null,
  updatedAt: null,
};

/**
 * Sales Schema (Tracking individual sales by sellers)
 */
export const salesSchema = {
  id: '',
  sellerId: '',
  clubId: '',
  subscriberId: '',
  subscriptionId: '',
  amount: 100,
  commission: 0, // Seller commission if applicable
  status: '', // pending | completed | cancelled
  smsToken: '', // Token sent via SMS
  createdAt: null,
  completedAt: null,
};
