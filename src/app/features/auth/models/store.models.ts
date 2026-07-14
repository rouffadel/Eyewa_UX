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
