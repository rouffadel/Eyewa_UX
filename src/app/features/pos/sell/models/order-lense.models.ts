export interface OrderLenseEyeReading {
  sph: string;
  cyl: string;
  axis: string;
  ad: string;
}

export interface OrderLenseLine {
  orderLenseId: number;
  salesId: number;
  category: string;
  orderLense: string;
  price: number;
  quantity: number;
  total: number;
  isActive: boolean;
  isDeleted: boolean;
  createdDate: string;
}

export interface OrderLenseOrder {
  salesId: number;
  lenses: OrderLenseLine[];
  od: OrderLenseEyeReading | null;
  os: OrderLenseEyeReading | null;
  additional: OrderLenseEyeReading | null;
}

export interface GetOrderLenseApiRow {
  OrderLenseID?: number;
  orderLenseID?: number;
  SalesID?: number;
  salesID?: number;
  Category?: string;
  category?: string;
  Orderlense?: string;
  orderlense?: string;
  Price?: number;
  price?: number;
  Quantity?: number;
  quantity?: number;
  Total?: number;
  total?: number;
  IsActive?: boolean;
  isActive?: boolean;
  IsDeleted?: boolean;
  isDeleted?: boolean;
  CreatedDate?: string;
  createdDate?: string;
}

export interface GetOrderLenseEyeApiRow {
  SPH?: string;
  sph?: string;
  CYL?: string;
  cyl?: string;
  AXIS?: string;
  axis?: string;
  AD?: string;
  ad?: string;
}

export type GetOrderLenseObjResult1 =
  | GetOrderLenseApiRow[]
  | {
      orderLense?: GetOrderLenseApiRow[];
    };

export type GetOrderLenseObjResult2 =
  | GetOrderLenseEyeApiRow[]
  | {
      table?: GetOrderLenseEyeApiRow[];
      table1?: GetOrderLenseEyeApiRow[];
      table2?: GetOrderLenseEyeApiRow[];
    };

export interface GetOrderLenseResponse {
  status: string;
  message: string;
  objresult1?: GetOrderLenseObjResult1;
  objresult2?: GetOrderLenseObjResult2;
}

export function extractOrderLenseRows(
  objresult1: GetOrderLenseObjResult1 | undefined,
): GetOrderLenseApiRow[] {
  if (!objresult1) {
    return [];
  }

  if (Array.isArray(objresult1)) {
    return objresult1;
  }

  return objresult1.orderLense ?? [];
}

export function extractOrderLenseReadings(objresult2: GetOrderLenseObjResult2 | undefined): {
  od: GetOrderLenseEyeApiRow | undefined;
  os: GetOrderLenseEyeApiRow | undefined;
  additional: GetOrderLenseEyeApiRow | undefined;
} {
  if (!objresult2) {
    return { od: undefined, os: undefined, additional: undefined };
  }

  if (Array.isArray(objresult2)) {
    return {
      od: objresult2[0],
      os: objresult2[1],
      additional: objresult2[2],
    };
  }

  return {
    od: objresult2.table?.[0],
    os: objresult2.table1?.[0],
    additional: objresult2.table2?.[0],
  };
}

export function normalizeOrderLenseRow(row: GetOrderLenseApiRow): OrderLenseLine | null {
  const orderLenseId = row.OrderLenseID ?? row.orderLenseID;
  const salesId = row.SalesID ?? row.salesID;

  if (orderLenseId == null || salesId == null) {
    return null;
  }

  return {
    orderLenseId,
    salesId,
    category: row.Category ?? row.category ?? '',
    orderLense: row.Orderlense ?? row.orderlense ?? '',
    price: row.Price ?? row.price ?? 0,
    quantity: Math.max(1, row.Quantity ?? row.quantity ?? 1),
    total: row.Total ?? row.total ?? 0,
    isActive: row.IsActive ?? row.isActive ?? true,
    isDeleted: row.IsDeleted ?? row.isDeleted ?? false,
    createdDate: row.CreatedDate ?? row.createdDate ?? '',
  };
}

export function normalizeOrderLenseEyeReading(
  row: GetOrderLenseEyeApiRow | undefined,
): OrderLenseEyeReading | null {
  if (!row) {
    return null;
  }

  return {
    sph: row.SPH ?? row.sph ?? '',
    cyl: row.CYL ?? row.cyl ?? '',
    axis: row.AXIS ?? row.axis ?? '',
    ad: row.AD ?? row.ad ?? '',
  };
}
