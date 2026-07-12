export interface BrandOption {
  brandId: number;
  brandName: string;
}

export interface GetBrandRow {
  brandID?: number;
  BrandID?: number;
  brandName?: string;
  BrandName?: string;
}

export interface GetBrandResponse {
  status: string;
  message: string;
  objresult?:
    | GetBrandRow[]
    | {
        table?: GetBrandRow[];
      };
  qrcodeimg?: string | null;
}
