export interface StoreOption {
  storeId: number;
  storeName: string;
  isDefault?: boolean;
}

export interface FillStoreRow {
  StoreID?: number;
  StoreId?: number;
  storeID?: number;
  storeId?: number;
  StoreName?: string;
  storeName?: string;
  IsDefault?: boolean;
  isDefault?: boolean;
}

export interface Product {
  productID: number;
  productName: string;
  productValue: number;
  maxDiscount: number;
  categoryID: number;
  categoryName: string;
  brandID: number;
  brandName: string;
  availableQuantity: number;
}

/** Current API shape — `objresult` is a store array. */
export type FillStoreObjResult =
  | FillStoreRow[]
  | {
      table: FillStoreRow[];
    };

export interface FillStoreResponse {
  status: string;
  message: string;
  objresult: FillStoreObjResult;
  qrcodeimg: string | null;
}
