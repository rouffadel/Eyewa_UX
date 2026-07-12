import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  CategoryOption,
  FillCategoryResponse,
  FillCategoryRow,
} from '../models/category.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getCategories(): Promise<CategoryOption[]> {
    const url = this.buildUrl();

    return firstValueFrom(this.http.get<FillCategoryResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const fillCategoryPath = settings?.fillCategoryPath ?? 'products/FillCategory';

    if (!apiUrl) {
      throw new Error('Category lookup is not configured.');
    }

    return `${apiUrl}/${fillCategoryPath}`;
  }

  private mapResponse(response: FillCategoryResponse): CategoryOption[] {
    const rows = this.extractRows(response?.objresult);

    return rows
      .map((row) => this.toCategoryOption(row))
      .filter((option): option is CategoryOption => option !== null);
  }

  private extractRows(
    objresult: FillCategoryResponse['objresult'] | undefined,
  ): FillCategoryRow[] {
    if (!objresult) {
      return [];
    }

    if (Array.isArray(objresult)) {
      return objresult;
    }

    return objresult.table ?? [];
  }

  private toCategoryOption(row: FillCategoryRow): CategoryOption | null {
    const categoryId = row.CategoryID ?? row.categoryID;
    const categoryName = row.CategoryName ?? row.categoryName;

    if (categoryId == null || !categoryName?.trim()) {
      return null;
    }

    return {
      categoryId,
      categoryName: categoryName.trim(),
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load categories. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load categories. Please try again.');
  }
}
