import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerSearchService } from '../customer/services/customer-search.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { AppConfigService } from '../../../services/app-config.service';

interface DeliveryRecord {
  SalesId: number;
  CustomerName: string;
  MobileNumber: string;
  GrossTotal: number;
  NetTotal: number;
  PaidAmount: number;
  Balance: number;
  DeliveryDate: string;
  InsuranceAmount?: number;
}

@Component({
  selector: 'app-deliveries-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries-page.component.html',
  styleUrl: './deliveries-page.component.css'
})
export class DeliveriesPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly customerSearchService = inject(CustomerSearchService);
  private readonly sellStore = inject(SellSessionStore);
  private readonly appConfig = inject(AppConfigService);
  
  protected readonly deliveries = signal<DeliveryRecord[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.fetchDeliveries();
  }

  private fetchDeliveries(): void {
    this.isLoading.set(true);
    const storeId = '7'; // Fallback store id or take from store logic
    
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44314/api';

    // Using environment api url
    this.http.get<{status: string, objresult: DeliveryRecord[]}>(`${apiUrl}/sales/GetTodayDeliveries?storeId=${storeId}`)
      .subscribe({
        next: (res) => {
          if (res.status === '200') {
            this.deliveries.set(res.objresult || []);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Failed to fetch deliveries');
          this.isLoading.set(false);
        }
      });
  }

  protected async onOpen(delivery: DeliveryRecord): Promise<void> {
    try {
      this.isLoading.set(true);
      const customers = await this.customerSearchService.search(delivery.MobileNumber);
      
      const customer = customers.find(c => c.salesId === delivery.SalesId) || customers[0];
      
      if (customer) {
        this.sellStore.selectCustomer(customer);
        this.sellStore.clearStatusMessages();
        void this.router.navigate(['/home', 'sell']);
      } else {
        this.error.set('Customer details could not be found.');
      }
    } catch (e) {
      console.error(e);
      this.error.set('An error occurred while fetching customer details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getRemainingBalance(delivery: DeliveryRecord): number {
    return Math.max(0, delivery.Balance - (delivery.InsuranceAmount || 0));
  }
}

