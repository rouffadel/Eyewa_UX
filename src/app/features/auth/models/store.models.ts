export interface StoreOption {
  storeId: number;
  storeName: string;
}

export interface FillStoreRow {
  StoreID: number;
  StoreName: string;
}

/** Current API shape — `objresult` is a store array. */
export type FillStoreObjResult =
  | FillStoreRow[]
  | {
      table: Array<{
        storeID: number;
        storeName: string;
      }>;
    };

export interface FillStoreResponse {
  status: string;
  message: string;
  objresult: FillStoreObjResult;
  qrcodeimg: string | null;
}
