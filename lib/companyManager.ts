import { safeStorage } from './safeStorage';

export interface CompanyAccount {
  email: string;
  role: 'admin' | 'user';
}

export interface CompanyInfo {
  id: string;
  name: string;
  accounts: CompanyAccount[];
  knownUserIds?: string[];
}

export interface ResolvedUserCompany {
  companyId: string;
  companyName: string;
  role: 'admin' | 'user';
}

const CUSTOM_COMPANIES_STORAGE_KEY = 'textile_custom_companies_v1';

export const BUILTIN_COMPANIES: CompanyInfo[] = [
  {
    id: 'default',
    name: 'TextileManager',
    accounts: [
      { email: 'mixemir@gmail.com', role: 'admin' },
      { email: 'modeller@gmail.com', role: 'admin' },
    ],
  },
  {
    id: 'haza_triko',
    name: 'Haza Triko',
    accounts: [
      { email: 'mustafa@gmail.com', role: 'admin' },
      { email: 'haza@gmail.com', role: 'user' },
    ],
    knownUserIds: [
      'f81e20c3-f115-4634-80a4-a0518b4fe373', // mustafa@gmail.com
      '53a698ed-ce1d-4311-9332-7db52d4febde', // haza@gmail.com
    ],
  },
];

export const getCustomCompanies = (): CompanyInfo[] => {
  try {
    const raw = safeStorage.getItem(CUSTOM_COMPANIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomCompany = (company: CompanyInfo): void => {
  const existing = getCustomCompanies();
  const idx = existing.findIndex((c) => c.id === company.id);
  if (idx >= 0) {
    existing[idx] = company;
  } else {
    existing.push(company);
  }
  safeStorage.setItem(CUSTOM_COMPANIES_STORAGE_KEY, JSON.stringify(existing));
};

export const getAllCompanies = (): CompanyInfo[] => {
  const custom = getCustomCompanies();
  const map = new Map<string, CompanyInfo>();
  for (const c of BUILTIN_COMPANIES) {
    map.set(c.id, { ...c, accounts: [...c.accounts] });
  }
  for (const c of custom) {
    if (map.has(c.id)) {
      const existing = map.get(c.id)!;
      const mergedAccounts = [...existing.accounts];
      for (const acc of c.accounts || []) {
        if (!mergedAccounts.some((a) => a.email.toLowerCase() === acc.email.toLowerCase())) {
          mergedAccounts.push(acc);
        }
      }
      map.set(c.id, { ...existing, accounts: mergedAccounts });
    } else {
      map.set(c.id, c);
    }
  }
  return Array.from(map.values());
};

export const slugifyCompanyId = (name: string): string => {
  return name
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `company_${Date.now()}`;
};

export const resolveUserCompany = (user: any): ResolvedUserCompany => {
  if (!user) {
    return { companyId: 'default', companyName: 'TextileManager', role: 'user' };
  }

  const email = (user.email || '').toLowerCase().trim();
  const allCompanies = getAllCompanies();

  // 1. Öncelikle kayıtlı şirket hesaplarından e-postaya göre eşleştir
  for (const company of allCompanies) {
    const matchedAccount = company.accounts.find(
      (acc) => acc.email.toLowerCase().trim() === email
    );
    if (matchedAccount) {
      return {
        companyId: company.id,
        companyName: company.name,
        role: matchedAccount.role,
      };
    }
  }

  // 2. Supabase user_metadata içinde şirket bilgisi varsa onu kullan
  const meta = user.user_metadata;
  if (meta && meta.company_id) {
    return {
      companyId: String(meta.company_id),
      companyName: String(meta.company_name || meta.company_id),
      role: meta.role === 'admin' ? 'admin' : 'user',
    };
  }

  // 3. Bilinen user_id kontrolü
  for (const company of allCompanies) {
    if (company.knownUserIds?.includes(user.id)) {
      return {
        companyId: company.id,
        companyName: company.name,
        role: 'user',
      };
    }
  }

  // 4. Varsayılan olarak mevcut ana şirketin standart kullanıcısı
  return {
    companyId: 'default',
    companyName: 'TextileManager',
    role: 'user',
  };
};

export const checkIsCompanyAdmin = (user: any): boolean => {
  if (!user) return false;
  return resolveUserCompany(user).role === 'admin';
};

/**
 * Bir numune kaydının hangi şirkete ait olduğunu belirler.
 * 1. details içindeki 'company_info' etiketine bakar.
 * 2. Yoksa, kaydı oluşturan user_id bilinen bir şirkete (örn. Haza Triko) ait mi kontrol eder.
 * 3. Hiçbiri yoksa eski kayıtlar 'default' (Ana Şirket) olarak kabul edilir.
 */
export const getSampleCompanyId = (sampleRow: any): string => {
  if (!sampleRow) return 'default';

  const details = Array.isArray(sampleRow.details) ? sampleRow.details : [];
  const companyDetail = details.find((d: any) => d && d.label === 'company_info');
  if (companyDetail?.data?.companyId) {
    return String(companyDetail.data.companyId);
  }

  const allCompanies = getAllCompanies();
  for (const company of allCompanies) {
    if (company.id !== 'default' && company.knownUserIds?.includes(sampleRow.user_id)) {
      return company.id;
    }
  }

  return 'default';
};

export const isSampleOwnedByCompany = (sampleRow: any, companyId: string): boolean => {
  const sampleCompanyId = getSampleCompanyId(sampleRow);
  return sampleCompanyId === companyId;
};
