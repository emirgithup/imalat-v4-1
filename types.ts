
export interface SampleDetail {
  id: string;
  url: string;
  label: string;
}

export interface SampleData {
  id?: string; // Firestore Document ID
  modelCode: string;
  date: string;
  customerName: string;
  firmName: string;
  yarnManufacturer: string;
  criticCount: number;
  weight: number;
  productionTime: number;
  size: string;
  yarnType: string;
  buttonSize?: string; // Düğme Çapı (örn: 24 boy, 18 mm)
  buttonCount?: number; // Düğme Adeti (örn: 5)
  buttonImage?: string;
  buttonImageSize?: number;
  buttonImageDimensions?: { width: number; height: number };
  zipperLength?: string; // Fermuar Boyu (örn: 45 cm)
  notes: string;
  mainImage: string;
  mainImageSize?: number; // KB cinsinden
  mainImageDimensions?: { width: number; height: number };
  weightImage?: string;
  weightImageSize?: number;
  weightImageDimensions?: { width: number; height: number };
  details: SampleDetail[];
  isApproved: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export enum YarnType {
  Cotton100 = "%100 Pamuk",
  CottonPoly = "Pamuk Polyester",
  PamukAkrilik = "Pamuk Akrilik",
  ViskonAkrilik = "Viskon Akrilik",
  ViskonPolyester = "Viskon Polyester",
  Akrilik = "Akrilik",
  Polyemit = "Polyemit",
  Polyelit = "Polyelit",
  YunluSardon = "Yünlü Şardon",
  NormalSardon = "Normal Şardon",
  InceSardon = "İnce Şardon",
  OrjCorspan = "Orj Corspan",
  Elmas = "Elmas",
  Ekopisa = "Ekopisa",
  Vislayn = "Vislayn",
  RayonIp = "RAYON İP",
  Viscose = "Viskon",
  Linen = "Keten",
  Wool = "Yün",
  SargiIp = "Sargı İp",
  SakalIp = "Sakal İp",
  BocekIp = "Böcek İp",
  CrepElit = "Crep Elit",
  LorenIp = "Loren İp"
}

export enum SizeType {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  XXXL = "3XL",
  FourXL = "4XL",
  FiveXL = "5XL",
  SixXL = "6XL"
}
