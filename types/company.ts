// Company Types
export interface Company {
    id: string;
    name: string;
    access_code: string;
    currency: Currency;
    country: string;
    timezone: string;
    industry?: string;
    size?: CompanySize;
    created_at: string;
    created_by: string;
    updated_at: string;
}

export type Currency =
    | 'ZMW'  // Zambian Kwacha
    | 'USD'  // US Dollar
    | 'EUR'  // Euro
    | 'GBP'  // British Pound
    | 'ZAR'  // South African Rand
    | 'KES'  // Kenyan Shilling
    | 'NGN'  // Nigerian Naira
    | 'GHS'; // Ghanaian Cedi

export type CompanySize =
    | '1-10'
    | '11-50'
    | '51-200'
    | '201-500'
    | '500+';

export const SUPPORTED_CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
    { value: 'ZMW', label: 'Zambian Kwacha', symbol: 'K' },
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'ZAR', label: 'South African Rand', symbol: 'R' },
    { value: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
    { value: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
    { value: 'GHS', label: 'Ghanaian Cedi', symbol: 'GH₵' },
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
];

export const AFRICAN_COUNTRIES = [
    'Zambia', 'Kenya', 'Nigeria', 'South Africa', 'Ghana',
    'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Botswana',
    'Zimbabwe', 'Malawi', 'Mozambique', 'Senegal', "Côte d'Ivoire"
] as const;