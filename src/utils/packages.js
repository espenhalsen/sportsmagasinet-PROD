// License package pricing structure for Sportsmagasinet
// Agent gets 1 NOK per license per month
// Pricing based on annual license packages

export const LICENSE_PACKAGES = [
  {
    id: 'package_100',
    name: 'Starter',
    licenses: 100,
    annualTotal: 1200, // Total annual value (100 * 12)
    debtPerLicense: 49, // NOK - What club owes platform per license per month
    profitPerLicense: 51, // NOK - What club can profit per license when sold
    retailPrice: 100, // NOK - Price sellers sell to end users
    monthlyDebt: 4900, // 100 licenses * 49 NOK debt per license
    agentCommission: 1, // 1 NOK per license per month for agent
    popular: false,
    description: 'Perfekt for mindre klubber',
    features: [
      '100 aktive lisenser',
      'Ubegrenset selgere',
      'Grunnleggende støtte',
      'Månedlig rapportering'
    ]
  },
  {
    id: 'package_250',
    name: 'Growth',
    licenses: 250,
    annualTotal: 3000,
    debtPerLicense: 47,
    profitPerLicense: 53,
    retailPrice: 100,
    monthlyDebt: 11750, // 250 licenses * 47 NOK debt per license
    agentCommission: 1,
    popular: true,
    description: 'Ideell for voksende klubber',
    features: [
      '250 aktive lisenser',
      'Ubegrenset selgere',
      'Prioritert støtte',
      'Detaljert rapportering',
      'Tilpassede kampanjer'
    ]
  },
  {
    id: 'package_500',
    name: 'Professional',
    licenses: 500,
    annualTotal: 6000,
    debtPerLicense: 41,
    profitPerLicense: 59,
    retailPrice: 100,
    monthlyDebt: 20500, // 500 licenses * 41 NOK debt per license
    agentCommission: 1,
    popular: false,
    description: 'For etablerte klubber',
    features: [
      '500 aktive lisenser',
      'Ubegrenset selgere',
      'Premium støtte',
      'Avansert rapportering',
      'API-tilgang',
      'Tilpasset branding'
    ]
  },
  {
    id: 'package_1000',
    name: 'Enterprise',
    licenses: 1000,
    annualTotal: 12000,
    debtPerLicense: 37,
    profitPerLicense: 63,
    retailPrice: 100,
    monthlyDebt: 37000, // 1000 licenses * 37 NOK debt per license
    agentCommission: 1,
    popular: false,
    description: 'For store klubber',
    features: [
      '1000 aktive lisenser',
      'Ubegrenset selgere',
      'Dedikert støtte',
      'Sanntids rapportering',
      'Full API-tilgang',
      'Tilpasset integrering'
    ]
  },
  {
    id: 'package_2000',
    name: 'Scale',
    licenses: 2000,
    annualTotal: 24000,
    debtPerLicense: 35,
    profitPerLicense: 65,
    retailPrice: 100,
    monthlyDebt: 70000, // 2000 licenses * 35 NOK debt per license
    agentCommission: 1,
    popular: false,
    description: 'For klubber i ekspansjon',
    features: [
      '2000 aktive lisenser',
      'Ubegrenset selgere',
      'Premium dedikert støtte',
      'Avansert analyse',
      'Tilpasset løsning',
      'Onboarding-hjelp'
    ]
  },
  {
    id: 'package_4000',
    name: 'Ultimate',
    licenses: 4000,
    annualTotal: 48000,
    debtPerLicense: 32,
    profitPerLicense: 68,
    retailPrice: 100,
    monthlyDebt: 128000, // 4000 licenses * 32 NOK debt per license
    agentCommission: 1,
    popular: false,
    description: 'For de største klubbene',
    features: [
      '4000+ aktive lisenser',
      'Ubegrenset selgere',
      'VIP støtte',
      'Tilpasset rapportering',
      'Hvit-label løsning',
      'Dedikert suksess-manager'
    ]
  }
];

// Helper functions
export const getLicensePackageById = (packageId) => {
  return LICENSE_PACKAGES.find(pkg => pkg.id === packageId);
};

export const calculateMonthlyClubDebt = (packageId) => {
  const pkg = getLicensePackageById(packageId);
  return pkg ? pkg.monthlyDebt : 0;
};

export const calculateMonthlyAgentCommission = (packageId) => {
  const pkg = getLicensePackageById(packageId);
  return pkg ? pkg.licenses * pkg.agentCommission : 0;
};

export const calculateLicenseSaleProfit = (packageId, licensesSold) => {
  const pkg = getLicensePackageById(packageId);
  return pkg ? licensesSold * pkg.profitPerLicense : 0;
};

export const calculateLicenseSaleDebtCovered = (packageId, licensesSold) => {
  const pkg = getLicensePackageById(packageId);
  return pkg ? licensesSold * pkg.debtPerLicense : 0;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPackagePrice = (packageData) => {
  return {
    monthlyDebt: formatCurrency(packageData.monthlyDebt),
    debtPerLicense: formatCurrency(packageData.debtPerLicense),
    profitPerLicense: formatCurrency(packageData.profitPerLicense),
    retailPrice: formatCurrency(packageData.retailPrice),
    agentCommission: formatCurrency(packageData.licenses * packageData.agentCommission)
  };
};

export const getPackageRecommendation = (clubSize) => {
  if (clubSize <= 100) return 'package_100';
  if (clubSize <= 250) return 'package_250';
  if (clubSize <= 500) return 'package_500';
  if (clubSize <= 1000) return 'package_1000';
  if (clubSize <= 2000) return 'package_2000';
  return 'package_4000';
};
