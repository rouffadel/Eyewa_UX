export interface CategoryOption {
  categoryId: number;
  categoryName: string;
}

export interface FillCategoryRow {
  CategoryID?: number;
  CategoryName?: string;
  categoryID?: number;
  categoryName?: string;
}

export interface FillCategoryResponse {
  status: string;
  message: string;
  objresult: FillCategoryRow[] | { table: FillCategoryRow[] };
  qrcodeimg?: string | null;
}
