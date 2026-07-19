import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { CustomerSessionService } from '../../customer/services/customer-session.service';
import { PrescriptionRecord } from '../../prescription/models/prescription.models';
import {
  applyCartItemsToPrescriptionRecord,
  isPrescriptionCartLine,
  prescriptionLinesToCartItems,
} from '../../prescription/services/prescription-cart.mapper';
import { PrescriptionLocalStorageService } from '../../prescription/services/prescription-local-storage.service';
import { PrescriptionService } from '../../prescription/services/prescription.service';
import { CartLineItem, lineTotal } from '../models/cart.models';
import { Customer, PrescriptionSummary, SavedPrescriptionListItem } from '../models/customer.models';
import { InvoiceViewModel } from '../models/invoice.models';
import { CatalogCategory, Product } from '../models/product.models';
import { PaymentDraft, PaymentMethod, PaymentRegisterAction } from '../models/payment.models';
import { SalesDetailsGridLineItem, SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';
import { BarcodeScanService } from './barcode-scan.service';
import { CategoryService } from './category.service';
import { formatMoney, orderAmountAlreadyPaid, paymentAmountPaid, paymentBalanceRemaining, PaymentService, NEGATIVE_PAYMENT_CONFIRM_MESSAGE, shouldConfirmNegativePaymentValues } from './payment.service';
import { hasPrescriptionSummaryRxData, toPrescriptionSummary } from './prescription-summary.mapper';
import { SalesDetailsService, SalesDetailsResult } from './sales-details.service';
import {
  cartItemsFromSalesDetails,
  isOrderCartLocked,
  isOrderFullyPaid,
  isSalesCartLine,
  paymentDraftFromSalesDetails,
} from './sales-details.mapper';
import { OrderLenseService } from './order-lense.service';
import { cartItemsFromOrderLense } from './order-lense.mapper';
import { OrderLenseOrder } from '../models/order-lense.models';
import {
  framesFromSalesLineItems,
  hasApiSalePrescriptionData,
  prescriptionRecordFromApiSale,
} from './api-sale-prescription.mapper';
import { buildSaveSalesDetailsPayload, hasPrescriptionFramesForSales } from './save-sales.mapper';
import { buildInvoiceFromSaveSalesResponse } from './save-sales-response.mapper';
import { buildInvoiceFromExistingOrder } from './invoice.mapper';
import { SaveSalesService } from './save-sales.service';
import {
  createEmptyEyePrescription,
  hasPrescriptionLensData,
  hasPrescriptionRxData,
} from '../../prescription/models/prescription.models';
import { SalesInsuranceRecord } from '../../insurance/models/insurance.models';
import { InsuranceService } from '../../insurance/services/insurance.service';

@Injectable({ providedIn: 'root' })
export class SellSessionStore {
  private readonly payment = inject(PaymentService);
  private readonly customerSession = inject(CustomerSessionService);
  private readonly barcodeScan = inject(BarcodeScanService);
  private readonly salesDetails = inject(SalesDetailsService);
  private readonly orderLense = inject(OrderLenseService);
  private readonly prescriptionStorage = inject(PrescriptionLocalStorageService);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly saveSales = inject(SaveSalesService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly insuranceService = inject(InsuranceService);

  readonly selectedCustomer = signal<Customer | null>(this.customerSession.sellCustomer());
  readonly prescriptionLoading = signal(false);
  readonly salesInsurance = signal<SalesInsuranceRecord | null>(null);

  private readonly prescriptionsByCustomer = signal<Record<string, PrescriptionSummary>>({});

  private readonly prescriptionHistoryByCustomer = signal<Record<string, SavedPrescriptionListItem[]>>({});

  private readonly prescriptionRecordByCustomer = signal<Record<string, PrescriptionRecord>>({});

  private readonly salesLineItemsByCustomer = signal<Record<string, SalesDetailsGridLineItem[]>>({});

  private readonly orderPaymentSummary = signal<SalesDetailsPaymentSummary | null>(null);

  private readonly loadedSalesInvoiceDate = signal<string | null>(null);

  private readonly loadedSalesQrcodeImg = signal<string | null>(null);

  constructor() {
    const customer = this.selectedCustomer();
    if (customer?.salesId != null) {
      this.loadSalesDetails(customer, { forceApplyFromApi: true, persistToLocalStorage: true });
      void this.loadSalesInsurance(customer);
    } else if (customer?.id) {
      this.loadLocalPrescription(customer.id);
    }
  }

  readonly latestPrescription = computed(() => {
    const customer = this.selectedCustomer();
    if (!customer) {
      return null;
    }

    const summary = this.prescriptionsByCustomer()[customer.id] ?? null;
    if (!summary || !hasPrescriptionSummaryRxData(summary)) {
      return null;
    }

    return summary;
  });

  readonly hasPrescription = computed(() => this.latestPrescription() !== null);

  readonly prescriptionHistory = computed(() => {
    const customer = this.selectedCustomer();
    if (!customer) {
      return [];
    }

    return this.prescriptionHistoryByCustomer()[customer.id] ?? [];
  });

  private readonly selectedPrescriptionIdByCustomer = signal<Record<string, string>>({});

  readonly selectedPrescriptionId = computed(() => {
    const customer = this.selectedCustomer();
    if (!customer) {
      return null;
    }

    const selectedId = this.selectedPrescriptionIdByCustomer()[customer.id];
    if (selectedId) {
      return selectedId;
    }

    return this.prescriptionHistory()[0]?.id ?? null;
  });

  readonly catalogCategory = signal<CatalogCategory>('frames');
  readonly catalogSearch = signal('');
  readonly catalogProducts = signal<Product[]>([]);
  readonly cartItems = signal<CartLineItem[]>([]);
  readonly paymentDraft = signal<PaymentDraft>(this.createInitialPaymentDraft());
  readonly statusMessage = signal('');
  readonly addToCartBlockedMessage = signal('');
  readonly isPaying = signal(false);
  readonly lastInvoice = signal<InvoiceViewModel | null>(null);

  readonly filteredProducts = computed(() => {
    const search = this.catalogSearch().trim().toLowerCase();
    const category = this.catalogCategory();
    const products = this.catalogProducts().filter((product) => product.category === category);

    if (!search) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.barcode?.toLowerCase().includes(search),
    );
  });

  readonly cartItemCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.qty, 0),
  );

  readonly cartSubtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + lineTotal(item), 0),
  );

  readonly paymentTotals = computed(() =>
    this.payment.calculateTotals(
      this.cartSubtotal(),
      this.paymentDraft(),
      this.salesInsurance()?.discountPercentage ?? null,
    ),
  );

  readonly hasSalesInsurance = computed(() => this.salesInsurance() !== null);

  readonly canPay = computed(() => {
    if (this.isPaying() || this.prescriptionLoading() || this.orderFullyPaid()) {
      return false;
    }

    return this.selectedCustomer() !== null && this.cartItems().length > 0;
  });

  readonly orderFullyPaid = computed(() => isOrderFullyPaid(this.orderPaymentSummary()));

  readonly canPrintReceipt = computed(() => {
    if (this.isPaying() || this.prescriptionLoading() || !this.orderFullyPaid()) {
      return false;
    }

    return this.selectedCustomer() !== null && this.cartItems().length > 0;
  });

  readonly isCartLocked = computed(() => isOrderCartLocked(this.orderPaymentSummary()));

  readonly isSettlingRemainingBalance = computed(
    () => this.paymentDraft().settleRemainingBalance && this.orderPaymentSummary() !== null,
  );

  readonly outstandingBalance = computed(() =>
    Math.max(0, this.orderPaymentSummary()?.balance ?? 0),
  );

  readonly amountAlreadyPaid = computed(() => orderAmountAlreadyPaid(this.orderPaymentSummary()));

  readonly customerRefreshing = signal(false);

  selectCustomer(
    customer: Customer | null,
    options: { freshSale?: boolean } = {},
  ): void {
    const previousId = this.selectedCustomer()?.id;
    this.selectedCustomer.set(customer);
    this.resetLoyaltyRedemption();

    if (customer?.id !== previousId) {
      this.cartItems.set([]);
      this.paymentDraft.set(this.createInitialPaymentDraft());
      this.orderPaymentSummary.set(null);
      this.loadedSalesInvoiceDate.set(null);
      this.loadedSalesQrcodeImg.set(null);
      this.salesInsurance.set(null);
    }

    if (!customer?.id) {
      this.salesInsurance.set(null);
      this.syncPaymentAmountsToPayable();
      return;
    }

    if (options.freshSale) {
      this.clearCustomerPrescriptionState(customer.id);
      this.prescriptionLoading.set(false);
      this.salesInsurance.set(null);
      this.syncPaymentAmountsToPayable();
      return;
    }

    if (customer.salesId == null) {
      this.loadLocalPrescription(customer.id);
      this.salesInsurance.set(null);
      this.syncPaymentAmountsToPayable();
    }

    this.loadSalesDetails(customer, { forceApplyFromApi: true, persistToLocalStorage: true });
    void this.loadSalesInsurance(customer);
  }

  /**
   * Re-runs the same APIs as customer selection for the current customer
   * (sales details, order lenses, insurance) without clearing the cart.
   */
  async refreshSelectedCustomer(): Promise<void> {
    const customer = this.selectedCustomer();
    if (!customer?.id || this.customerRefreshing()) {
      return;
    }

    this.customerRefreshing.set(true);
    this.clearStatusMessages();

    try {
      if (customer.salesId == null) {
        this.loadLocalPrescription(customer.id);
        this.salesInsurance.set(null);
        this.syncPaymentAmountsToPayable();
        return;
      }

      await Promise.all([
        this.loadSalesDetails(customer, {
          forceApplyFromApi: true,
          persistToLocalStorage: true,
        }),
        this.loadSalesInsurance(customer),
      ]);

      this.statusMessage.set('Customer data refreshed');
    } catch {
      this.statusMessage.set('Unable to refresh customer data. Please try again.');
    } finally {
      this.customerRefreshing.set(false);
    }
  }

  ensureSalesDetailsLoaded(): void {
    const customer = this.selectedCustomer();
    if (!customer?.salesId || this.prescriptionLoading()) {
      return;
    }

    if (this.prescriptionHistory().length > 0) {
      return;
    }

    this.loadSalesDetails(customer);
  }

  private loadSalesDetails(
    customer: Customer | null,
    options: { forceApplyFromApi?: boolean; persistToLocalStorage?: boolean } = {},
  ): Promise<void> {
    const salesId = customer?.salesId;
    if (!customer || salesId == null) {
      return Promise.resolve();
    }

    this.prescriptionLoading.set(true);

    return Promise.all([
      this.salesDetails.getSalesDetailsGrid(salesId),
      this.orderLense.getOrderLense(salesId).catch(() => this.emptyOrderLenseOrder(salesId)),
    ])
      .then(([salesResult, orderResult]) => {
        if (this.selectedCustomer()?.id !== customer.id) {
          return;
        }

        this.applySalesDetailsResult(customer, salesId, salesResult, orderResult, options);
      })
      .catch(() => {
        // Sales details lookup is best-effort; keep the card in its empty state.
      })
      .finally(() => {
        if (this.selectedCustomer()?.id === customer.id) {
          this.prescriptionLoading.set(false);
        }
      });
  }

  private async loadSalesInsurance(customer: Customer): Promise<void> {
    const salesId = customer.salesId;
    if (salesId == null) {
      this.salesInsurance.set(null);
      this.syncPaymentAmountsToPayable();
      return;
    }

    try {
      const record = await this.insuranceService.getInsuranceBySalesId(salesId);
      if (this.selectedCustomer()?.id !== customer.id) {
        return;
      }

      this.salesInsurance.set(record);
    } catch {
      if (this.selectedCustomer()?.id !== customer.id) {
        return;
      }

      this.salesInsurance.set(null);
    } finally {
      if (this.selectedCustomer()?.id === customer.id) {
        this.syncPaymentAmountsToPayable();
      }
    }
  }

  private applySalesDetailsResult(
    customer: Customer,
    salesId: number,
    result: SalesDetailsResult,
    orderResult: OrderLenseOrder,
    options: { forceApplyFromApi?: boolean; persistToLocalStorage?: boolean },
  ): void {
    if (result.lineItems.length > 0) {
      this.salesLineItemsByCustomer.update((current) => ({
        ...current,
        [customer.id]: result.lineItems,
      }));
    }

    if (result.prescription && hasPrescriptionSummaryRxData(result.prescription)) {
      this.applySalesDetailsPrescription(customer.id, salesId, result.prescription);
    }

    const shouldApplyCart =
      options.forceApplyFromApi || !this.hasLocalPrescriptionRecord(customer.id);

    if (shouldApplyCart) {
      this.applyApiSaleCart(result.lineItems, orderResult.lenses);
    }

    if (result.payment) {
      this.applySalesDetailsPayment(result.payment);
    }

    if (result.row?.invoiceNo) {
      this.selectedCustomer.update((current) =>
        current?.id === customer.id
          ? { ...current, invoiceNo: result.row!.invoiceNo }
          : current,
      );
    }

    if (result.row?.invoiceDate) {
      this.loadedSalesInvoiceDate.set(result.row.invoiceDate);
    }

    this.loadedSalesQrcodeImg.set(result.qrcodeImg ?? null);

    if (result.payment && isOrderFullyPaid(result.payment)) {
      this.syncReceiptInvoice(this.resolveStaffName());
    }

    if (
      options.persistToLocalStorage &&
      hasApiSalePrescriptionData(result, orderResult)
    ) {
      this.persistApiSaleToLocalStorage(customer, salesId, result, orderResult);
    }
  }

  private applyApiSaleCart(
    frameLines: SalesDetailsGridLineItem[],
    lensLines: OrderLenseOrder['lenses'],
  ): void {
    const frameItems = cartItemsFromSalesDetails(frameLines);
    const lensItems = cartItemsFromOrderLense(lensLines);

    if (frameItems.length === 0 && lensItems.length === 0) {
      return;
    }

    this.cartItems.set([...frameItems, ...lensItems]);
    this.syncPaymentAmountsToPayable();
  }

  private emptyOrderLenseOrder(salesId: number): OrderLenseOrder {
    return {
      salesId,
      lenses: [],
      od: null,
      os: null,
      additional: null,
    };
  }

  private applySalesDetailsPrescription(
    customerId: string,
    salesId: number,
    summary: PrescriptionSummary,
  ): void {
    const prescriptionId = `sales-${salesId}`;
    const item: SavedPrescriptionListItem = { id: prescriptionId, summary };

    this.prescriptionsByCustomer.update((current) => ({
      ...current,
      [customerId]: summary,
    }));

    this.prescriptionHistoryByCustomer.update((current) => {
      const existing = current[customerId] ?? [];
      const withoutDuplicate = existing.filter((entry) => entry.id !== prescriptionId);

      return {
        ...current,
        [customerId]: [item, ...withoutDuplicate],
      };
    });

    this.selectedPrescriptionIdByCustomer.update((current) => ({
      ...current,
      [customerId]: prescriptionId,
    }));
  }

  private applySalesDetailsPayment(payment: SalesDetailsPaymentSummary): void {
    this.orderPaymentSummary.set(payment);
    const patch = paymentDraftFromSalesDetails(payment);

    this.paymentDraft.update((draft) => ({
      ...draft,
      ...patch,
    }));
    this.syncPaymentAmountsToPayable();
  }

  applySavedPrescription(record: PrescriptionRecord): void {
    this.prescriptionRecordByCustomer.update((current) => ({
      ...current,
      [record.customerId]: record,
    }));

    if (hasPrescriptionRxData(record)) {
      const summary = toPrescriptionSummary(record);
      const item: SavedPrescriptionListItem = { id: record.id, summary };

      this.prescriptionsByCustomer.update((current) => ({
        ...current,
        [record.customerId]: summary,
      }));

      this.prescriptionHistoryByCustomer.update((current) => {
        const existing = current[record.customerId] ?? [];
        const withoutDuplicate = existing.filter((entry) => entry.id !== record.id);

        return {
          ...current,
          [record.customerId]: [item, ...withoutDuplicate],
        };
      });

      this.selectedPrescriptionIdByCustomer.update((current) => ({
        ...current,
        [record.customerId]: record.id,
      }));
    }

    this.syncCartFromPrescription(record);
  }

  applyFramesOnlyToCart(record: PrescriptionRecord): void {
    this.prescriptionRecordByCustomer.update((current) => ({
      ...current,
      [record.customerId]: record,
    }));

    this.selectedPrescriptionIdByCustomer.update((current) => ({
      ...current,
      [record.customerId]: record.id,
    }));

    this.syncCartFromPrescription(record);
  }

  loadLocalPrescription(customerId: string): void {
    const record = this.prescriptionStorage.getLatest(customerId);
    if (!record) {
      return;
    }

    this.applySavedPrescription(record);
  }

  syncCartFromPrescription(record: PrescriptionRecord): void {
    if (this.isCartLocked()) {
      return;
    }

    this.cartItems.set(prescriptionLinesToCartItems(record));
    this.syncPaymentAmountsToPayable();
  }

  selectPrescriptionFromHistory(prescriptionId: string): void {
    const customer = this.selectedCustomer();
    if (!customer) {
      return;
    }

    const entry = this.prescriptionHistory().find((item) => item.id === prescriptionId);
    if (!entry) {
      return;
    }

    const record = this.resolvePrescriptionRecord(customer.id, prescriptionId);

    this.selectedPrescriptionIdByCustomer.update((current) => ({
      ...current,
      [customer.id]: prescriptionId,
    }));

    this.prescriptionsByCustomer.update((current) => ({
      ...current,
      [customer.id]: entry.summary,
    }));

    if (record) {
      this.prescriptionRecordByCustomer.update((current) => ({
        ...current,
        [customer.id]: record,
      }));
      this.syncCartFromPrescription(record);
    }
  }

  loadSelectedPrescription(customerId: string): void {
    const selectedId = this.selectedPrescriptionIdByCustomer()[customerId];
    if (selectedId) {
      this.selectPrescriptionFromHistory(selectedId);
      return;
    }

    this.loadLocalPrescription(customerId);
  }

  selectCreatedCustomer(): void {
    const customer = this.customerSession.sellCustomer();
    this.selectCustomer(customer, { freshSale: true });
  }

  setCatalogCategory(category: CatalogCategory): void {
    this.catalogCategory.set(category);
  }

  setCatalogSearch(search: string): void {
    this.catalogSearch.set(search);
  }

  async scanProductBarcode(): Promise<void> {
    this.clearStatusMessages();

    try {
      const barcode = await this.barcodeScan.scanBarcode();
      if (!barcode) {
        return;
      }

      this.applyScannedBarcode(barcode);
    } catch {
      this.statusMessage.set('Barcode scan failed. Check camera permissions and try again.');
    }
  }

  applyScannedBarcode(barcode: string): void {
    if (this.isCartLocked()) {
      this.addToCartBlockedMessage.set(this.cartLockedMessage());
      return;
    }

    this.setCatalogSearch(barcode);

    const normalized = barcode.trim().toLowerCase();
    const category = this.catalogCategory();
    let product = this.catalogProducts().find((item) => {
      if (item.category !== category) {
        return false;
      }

      return (
        item.sku.toLowerCase() === normalized || item.barcode?.toLowerCase() === normalized
      );
    });

    if (!product) {
      product = this.catalogProducts().find(
        (item) =>
          item.sku.toLowerCase() === normalized || item.barcode?.toLowerCase() === normalized,
      );
    }

    if (!product) {
      this.statusMessage.set(`No product found for barcode "${barcode}".`);
      return;
    }

    if (product.category !== category) {
      this.setCatalogCategory(product.category);
    }

    this.addProductToCart(product);

    if (this.addToCartBlockedMessage()) {
      return;
    }

    this.statusMessage.set(`${product.name} added to cart.`);
  }

  addProductToCart(product: Product): void {
    if (this.isCartLocked()) {
      this.addToCartBlockedMessage.set(this.cartLockedMessage());
      return;
    }

    if (!this.selectedCustomer()) {
      this.addToCartBlockedMessage.set('Select a customer first.');
      return;
    }

    this.addToCartBlockedMessage.set('');

    const existing = this.cartItems().find((item) => item.product.sku === product.sku);

    if (existing) {
      this.updateQty(existing.lineId, existing.qty + 1);
      return;
    }

    const line: CartLineItem = {
      lineId: `${product.sku}-${Date.now()}`,
      product,
      qty: 1,
      unitPrice: product.price,
      discount: 0,
    };

    this.cartItems.update((items) => [...items, line]);
    this.syncPaymentAmountsToPayable();
  }

  updateQty(lineId: string, qty: number): void {
    if (this.isCartLocked()) {
      return;
    }

    const nextQty = Math.max(1, qty);
    this.cartItems.update((items) =>
      items.map((item) => (item.lineId === lineId ? { ...item, qty: nextQty } : item)),
    );
    this.syncPaymentAmountsToPayable();
    this.persistPrescriptionFromCart();
  }

  removeItem(lineId: string): void {
    if (this.isCartLocked()) {
      return;
    }

    this.cartItems.update((items) => items.filter((item) => item.lineId !== lineId));
    this.syncPaymentAmountsToPayable();
    this.persistPrescriptionFromCart();
  }

  clearCart(): void {
    if (this.isCartLocked()) {
      return;
    }

    this.cartItems.set([]);
    this.syncPaymentAmountsToPayable();
    this.persistPrescriptionFromCart();
  }

  updatePaymentDraft(patch: Partial<PaymentDraft>): void {
    this.paymentDraft.update((draft) => ({ ...draft, ...patch }));
    this.syncPaymentAmountsToPayable();
  }

  setPaymentMethod(method: PaymentMethod): void {
    const payable = this.paymentTotals().payable;
    const amounts = this.payment.syncAmountsForMethod(payable, method, this.paymentDraft(), this.orderPaymentSummary());

    this.paymentDraft.update((draft) => ({
      ...draft,
      method,
      ...amounts,
    }));
  }

  setMixedCashAmount(cashAmount: number): void {
    const amounts = this.payment.applyMixedCashAmount(this.paymentTotals().payable, cashAmount);
    this.paymentDraft.update((draft) => ({ ...draft, method: 'mixed', ...amounts }));
  }

  setMixedCardAmount(cardAmount: number): void {
    const amounts = this.payment.applyMixedCardAmount(this.paymentTotals().payable, cardAmount);
    this.paymentDraft.update((draft) => ({ ...draft, method: 'mixed', ...amounts }));
  }

  setPartialPayment(enabled: boolean): void {
    const hasOutstanding = this.hasOutstandingOrderBalance();

    this.paymentDraft.update((draft) => ({
      ...draft,
      payPartial: enabled,
      payFull: !enabled,
      partialAmount: enabled ? draft.partialAmount : 0,
      settleRemainingBalance: !enabled && hasOutstanding,
    }));
    this.syncPaymentAmountsToPayable();
  }

  setPayFull(enabled: boolean): void {
    const hasOutstanding = this.hasOutstandingOrderBalance();

    this.paymentDraft.update((draft) => ({
      ...draft,
      payFull: enabled,
      payPartial: !enabled,
      partialAmount: enabled ? 0 : draft.partialAmount,
      settleRemainingBalance: enabled && hasOutstanding,
    }));
    this.syncPaymentAmountsToPayable();
  }

  private hasOutstandingOrderBalance(): boolean {
    return (this.orderPaymentSummary()?.balance ?? 0) > 0;
  }

  setPartialPaymentAmount(amount: number): void {
    this.paymentDraft.update((draft) => ({
      ...draft,
      payPartial: true,
      payFull: false,
      partialAmount: Math.max(0, amount),
      settleRemainingBalance: false,
    }));
    this.syncPaymentAmountsToPayable();
  }

  setLoyaltyRedemption(enabled: boolean): void {
    const customer = this.selectedCustomer();
    this.updatePaymentDraft({
      redeemLoyalty: enabled,
      loyaltyPoints: enabled && customer ? customer.loyaltyPoints : 0,
    });
  }

  resetLoyaltyRedemption(): void {
    this.updatePaymentDraft({ redeemLoyalty: false, loyaltyPoints: 0 });
  }

  async pay(staffName: string): Promise<boolean> {
    this.clearStatusMessages();
    this.isPaying.set(true);

    try {
      if (!(await this.tryCompletePayment(staffName))) {
        return false;
      }

      const payable = this.paymentTotals().payable;
      const draft = this.paymentDraft();
      const invoice = this.lastInvoice();
      const invoiceLabel = invoice?.invoiceNo
        ? `Invoice ${invoice.invoiceNo}`
        : this.paymentBreakdownLabel(payable, draft);
      this.statusMessage.set(`Payment recorded: ${invoiceLabel}.`);
      return true;
    } finally {
      this.isPaying.set(false);
    }
  }

  async payAndPrint(staffName: string): Promise<boolean> {
    this.clearStatusMessages();
    this.isPaying.set(true);

    try {
      if (!(await this.tryCompletePayment(staffName))) {
        return false;
      }

      this.statusMessage.set('');
      return true;
    } finally {
      this.isPaying.set(false);
    }
  }

  printReceipt(staffName: string): boolean {
    if (!this.canPrintReceipt()) {
      return false;
    }

    this.clearStatusMessages();
    this.syncReceiptInvoice(staffName);
    return true;
  }

  redeemPointsStub(): void {
    this.statusMessage.set('Redeem points is not connected yet.');
  }

  runPaymentRegisterAction(action: PaymentRegisterAction): void {
    const messages: Record<PaymentRegisterAction, string> = {
      'daily-report': 'Daily report is not connected yet.',
      'cash-report': 'Cash report is not connected yet.',
      'open-register': 'Open register is not connected yet.',
      'close-register': 'Close register is not connected yet.',
    };

    this.clearStatusMessages();
    this.statusMessage.set(messages[action]);
  }

  clearStatusMessages(): void {
    this.statusMessage.set('');
    this.addToCartBlockedMessage.set('');
  }

  private async tryCompletePayment(staffName: string): Promise<boolean> {
    const payable = this.paymentTotals().payable;
    const draft = this.paymentDraft();

    if (!this.selectedCustomer() || this.cartItems().length === 0) {
      this.statusMessage.set('Select a customer and add items to the cart.');
      return false;
    }

    const validationMessage = this.payment.paymentValidationMessage(
      payable,
      draft,
      this.orderPaymentSummary(),
    );
    if (validationMessage) {
      this.statusMessage.set(validationMessage);
      return false;
    }

    const customer = this.selectedCustomer()!;
    const prescriptionRecord = await this.resolvePrescriptionRecordForPayment(customer.id);

    if (!prescriptionRecord) {
      this.statusMessage.set('Save frames on the prescription form before paying.');
      return false;
    }

    const salesId = customer.salesId ?? prescriptionRecord.salesId;
    if (salesId == null) {
      this.statusMessage.set('Create or select a sales customer before paying.');
      return false;
    }

    if (!hasPrescriptionFramesForSales(prescriptionRecord)) {
      this.statusMessage.set('Select a product for each frame before paying.');
      return false;
    }

    if (
      shouldConfirmNegativePaymentValues(
        this.cartItems(),
        this.paymentTotals(),
        draft,
        prescriptionRecord,
      ) &&
      !window.confirm(NEGATIVE_PAYMENT_CONFIRM_MESSAGE)
    ) {
      return false;
    }

    try {
      if (hasPrescriptionLensData(prescriptionRecord)) {
        await this.prescriptionService.save({
          ...prescriptionRecord,
          customerId: customer.id,
          salesId,
        });
      }

      const orderPaymentBeforeSave = this.orderPaymentSummary();

      const saveResult = await this.saveSales.saveSalesDetails(
        buildSaveSalesDetailsPayload({
          customer,
          record: prescriptionRecord,
          storeId: this.resolveStoreId(),
          loginId: this.auth.user()?.loginId ?? 0,
          salesManId: this.auth.user()?.loginId ?? 0,
          payable,
          draft,
          orderPayment: this.orderPaymentSummary(),
          insuranceAmount: this.paymentTotals().insuranceAmount,
        }),
      );

      const invoiceInput = {
        customer,
        cartItems: this.cartItems(),
        paymentTotals: this.paymentTotals(),
        paymentDraft: draft,
        prescriptionRecord,
        latestPrescription: this.latestPrescription(),
        staffName,
        orderPaymentBeforeSave,
      };

      this.lastInvoice.set(
        buildInvoiceFromSaveSalesResponse({
          saveResult,
          fallback: invoiceInput,
        }),
      );

      if (saveResult.salesDetails?.InvoiceNo) {
        this.selectedCustomer.update((current) =>
          current?.id === customer.id
            ? { ...current, invoiceNo: saveResult.salesDetails!.InvoiceNo }
            : current,
        );
      }

      this.clearSavedPrescription(customer.id);
      await this.loadSalesDetails(customer, {
        forceApplyFromApi: true,
        persistToLocalStorage: true,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to complete payment. Please try again.';
      this.statusMessage.set(message);
      return false;
    }

    this.resetLoyaltyRedemption();
    this.syncPaymentAmountsToPayable();
    return true;
  }

  private paymentBreakdownLabel(payable: number, draft: PaymentDraft): string {
    if (draft.settleRemainingBalance) {
      const due = Math.max(0, this.orderPaymentSummary()?.balance ?? 0);
      return `${this.paymentModeLabel(draft)} ${formatMoney(due)} SAR (paid in full)`;
    }

    if (draft.payPartial) {
      const paid = paymentAmountPaid(payable, draft);
      const balance = paymentBalanceRemaining(payable, draft);
      return `${this.paymentModeLabel(draft)} ${formatMoney(paid)} SAR (balance ${formatMoney(balance)} SAR)`;
    }

    if (draft.method === 'cash') {
      return `Cash ${formatMoney(payable)} SAR`;
    }

    if (draft.method === 'card') {
      return `Card ${formatMoney(payable)} SAR`;
    }

    if (draft.method === 'mixed') {
      return `Mixed — Cash ${formatMoney(draft.cashAmount)} SAR + Card ${formatMoney(draft.cardAmount)} SAR`;
    }

    return `${formatMoney(payable)} SAR`;
  }

  private resolveStaffName(): string {
    return this.auth.currentSession()?.displayName ?? '—';
  }

  private syncReceiptInvoice(staffName: string): void {
    const customer = this.selectedCustomer();
    const orderPayment = this.orderPaymentSummary();

    if (!customer || !orderPayment) {
      return;
    }

    const prescriptionRecord =
      this.prescriptionRecordByCustomer()[customer.id] ??
      this.prescriptionStorage.getLatest(customer.id);

    this.lastInvoice.set(
      buildInvoiceFromExistingOrder({
        customer,
        cartItems: this.cartItems(),
        orderPayment,
        paymentTotals: this.paymentTotals(),
        paymentDraft: this.paymentDraft(),
        prescriptionRecord,
        latestPrescription: this.latestPrescription(),
        staffName,
        invoiceDate: this.loadedSalesInvoiceDate() ?? undefined,
        qrcodeImg: this.loadedSalesQrcodeImg(),
      }),
    );
  }

  private createInitialPaymentDraft(): PaymentDraft {
    const draft = this.payment.defaultDraft();

    return {
      ...draft,
      ...this.payment.syncAmountsForMethod(0, draft.method, draft),
    };
  }

  private syncPaymentAmountsToPayable(): void {
    const payable = this.paymentTotals().payable;
    const draft = this.paymentDraft();

    if (draft.method === 'more') {
      return;
    }

    const amounts = this.payment.syncAmountsForMethod(
      payable,
      draft.method,
      draft,
      this.orderPaymentSummary(),
    );

    if (amounts.cashAmount === draft.cashAmount && amounts.cardAmount === draft.cardAmount) {
      return;
    }

    this.paymentDraft.update((current) => ({ ...current, ...amounts }));
  }

  private resolvePrescriptionRecord(
    customerId: string,
    prescriptionId: string,
  ): PrescriptionRecord | null {
    const cached = this.prescriptionRecordByCustomer()[customerId];
    if (cached?.id === prescriptionId) {
      return cached;
    }

    const fromStorage = this.prescriptionStorage.getById(customerId, prescriptionId);
    if (fromStorage) {
      return fromStorage;
    }

    if (cached && prescriptionId.startsWith('sales-')) {
      const salesId = Number.parseInt(prescriptionId.slice('sales-'.length), 10);
      if (Number.isFinite(salesId) && cached.salesId === salesId) {
        return cached;
      }
    }

    return null;
  }

  private async resolvePrescriptionRecordForPayment(customerId: string): Promise<PrescriptionRecord | null> {
    const customer = this.selectedCustomer();
    if (customer?.id === customerId && customer.salesId != null) {
      const cartIsApiSaleOnly =
        this.cartItems().some((item) => isSalesCartLine(item.lineId)) &&
        !this.cartHasPrescriptionLines();
      const cachedLineItems = this.salesLineItemsByCustomer()[customerId] ?? [];

      if ((this.isCartLocked() || cartIsApiSaleOnly) && cachedLineItems.length === 0) {
        await this.loadSalesDetails(customer, {
          forceApplyFromApi: true,
          persistToLocalStorage: true,
        });
      }
    }

    let record = this.findStoredPrescriptionRecord(customerId);

    if (!record) {
      const lastSaved = this.prescriptionStorage.getLastSaved();
      if (lastSaved?.customerId === customerId) {
        record = lastSaved;
      }
    }

    if (!record && customer?.id === customerId) {
      const lineItems = this.salesLineItemsByCustomer()[customerId] ?? [];
      if (lineItems.length > 0) {
        record = this.applySalesLineItemsToRecord(
          this.createEmptyPrescriptionRecord(customer),
          lineItems,
        );
      } else if (this.cartHasPrescriptionLines()) {
        record = this.createEmptyPrescriptionRecord(customer);
      }
    }

    if (!record) {
      return null;
    }

    const lineItems = this.salesLineItemsByCustomer()[customerId] ?? [];
    const preferApiFrames = lineItems.length > 0 && !this.cartHasPrescriptionLines();
    const recordWithFrames =
      preferApiFrames || !hasPrescriptionFramesForSales(record)
        ? this.applySalesLineItemsToRecord(record, lineItems)
        : record;

    const synced = this.cartHasPrescriptionLines()
      ? applyCartItemsToPrescriptionRecord(recordWithFrames, this.cartItems())
      : recordWithFrames;

    this.prescriptionRecordByCustomer.update((current) => ({
      ...current,
      [customerId]: synced,
    }));

    return this.enrichPrescriptionRecord(synced);
  }

  private applySalesLineItemsToRecord(
    record: PrescriptionRecord,
    lineItems: SalesDetailsGridLineItem[],
  ): PrescriptionRecord {
    if (lineItems.length === 0) {
      return record;
    }

    return {
      ...record,
      frames: framesFromSalesLineItems(lineItems),
      updatedAt: new Date().toISOString(),
    };
  }

  private findStoredPrescriptionRecord(customerId: string): PrescriptionRecord | null {
    const selectedId = this.selectedPrescriptionIdByCustomer()[customerId];
    if (selectedId) {
      const selected = this.resolvePrescriptionRecord(customerId, selectedId);
      if (selected) {
        return selected;
      }
    }

    const cached = this.prescriptionRecordByCustomer()[customerId];
    if (cached) {
      return cached;
    }

    const fromStorage = this.prescriptionStorage.getLatest(customerId);
    if (!fromStorage) {
      return null;
    }

    this.prescriptionRecordByCustomer.update((current) => ({
      ...current,
      [customerId]: fromStorage,
    }));

    return fromStorage;
  }

  private cartHasPrescriptionLines(): boolean {
    return this.cartItems().some((item) => isPrescriptionCartLine(item.lineId));
  }

  private createEmptyPrescriptionRecord(customer: Customer): PrescriptionRecord {
    const now = new Date().toISOString();

    return {
      id: `rx-cart-${customer.id}-${Date.now()}`,
      customerId: customer.id,
      salesId: customer.salesId,
      orderLensEnabled: false,
      frames: [],
      lenses: [],
      rightEye: createEmptyEyePrescription(),
      leftEye: createEmptyEyePrescription(),
      pd: null,
      nearPd: null,
      vd: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  private async enrichPrescriptionRecord(record: PrescriptionRecord): Promise<PrescriptionRecord> {
    const needsCategoryId = record.frames.some(
      (line) =>
        !line.categoryId &&
        Boolean(line.brandId && line.productId && line.sellingPrice != null),
    );

    if (!needsCategoryId) {
      return record;
    }

    const categories = await this.categoryService.getCategories();
    const frames = record.frames.map((line) => ({
      ...line,
      categoryId:
        line.categoryId ??
        categories.find((category) => category.categoryName === line.category)?.categoryId ??
        null,
    }));

    return { ...record, frames };
  }

  private resolveStoreId(): string {
    const selectedStoreId = this.auth.selectedStore()?.storeId;
    if (selectedStoreId != null && selectedStoreId > 0) {
      return String(selectedStoreId);
    }

    const userStoreId = this.auth.user()?.storeId;
    if (userStoreId != null && userStoreId > 0) {
      return String(userStoreId);
    }

    return '0';
  }

  private persistPrescriptionFromCart(): void {
    if (this.isCartLocked()) {
      return;
    }

    const customer = this.selectedCustomer();
    if (!customer?.id) {
      return;
    }

    const record =
      this.prescriptionRecordByCustomer()[customer.id] ??
      this.prescriptionStorage.getLatest(customer.id);

    if (!record) {
      return;
    }

    const updated = applyCartItemsToPrescriptionRecord(record, this.cartItems());
    const saved = this.prescriptionStorage.saveRecord(updated);

    this.registerPrescriptionRecord(saved);
  }

  private persistApiSaleToLocalStorage(
    customer: Customer,
    salesId: number,
    salesResult: SalesDetailsResult,
    orderResult: OrderLenseOrder,
  ): void {
    const existing =
      this.prescriptionRecordByCustomer()[customer.id] ??
      this.prescriptionStorage.getLatest(customer.id);

    const record = prescriptionRecordFromApiSale({
      customerId: customer.id,
      salesId,
      salesResult,
      orderResult,
      existingRecord: existing,
    });

    const saved = this.prescriptionStorage.saveRecord(record);
    this.registerPrescriptionRecord(saved);
  }

  private registerPrescriptionRecord(record: PrescriptionRecord): void {
    this.prescriptionRecordByCustomer.update((current) => ({
      ...current,
      [record.customerId]: record,
    }));

    if (!hasPrescriptionRxData(record)) {
      return;
    }

    const summary = toPrescriptionSummary(record);
    const item: SavedPrescriptionListItem = { id: record.id, summary };

    this.prescriptionsByCustomer.update((current) => ({
      ...current,
      [record.customerId]: summary,
    }));

    this.prescriptionHistoryByCustomer.update((current) => {
      const existing = current[record.customerId] ?? [];
      const withoutDuplicate = existing.filter((entry) => entry.id !== record.id);

      return {
        ...current,
        [record.customerId]: [item, ...withoutDuplicate],
      };
    });

    this.selectedPrescriptionIdByCustomer.update((current) => ({
      ...current,
      [record.customerId]: record.id,
    }));
  }

  private clearCustomerPrescriptionState(customerId: string): void {
    this.prescriptionsByCustomer.update((current) => {
      const next = { ...current };
      delete next[customerId];
      return next;
    });

    this.prescriptionHistoryByCustomer.update((current) => {
      const next = { ...current };
      delete next[customerId];
      return next;
    });

    this.prescriptionRecordByCustomer.update((current) => {
      const next = { ...current };
      delete next[customerId];
      return next;
    });

    this.selectedPrescriptionIdByCustomer.update((current) => {
      const next = { ...current };
      delete next[customerId];
      return next;
    });
  }

  private clearSavedPrescription(customerId: string): void {
    this.prescriptionStorage.removeForCustomer(customerId);

    this.prescriptionRecordByCustomer.update((current) => {
      const next = { ...current };
      delete next[customerId];
      return next;
    });

    this.prescriptionHistoryByCustomer.update((current) => ({
      ...current,
      [customerId]: (current[customerId] ?? []).filter((item) => item.id.startsWith('sales-')),
    }));
  }

  private hasLocalPrescriptionRecord(customerId: string): boolean {
    return Boolean(
      this.prescriptionRecordByCustomer()[customerId] ??
        this.prescriptionStorage.getLatest(customerId),
    );
  }

  private paymentModeLabel(draft: PaymentDraft): string {
    if (draft.method === 'card') {
      return 'Card';
    }

    if (draft.method === 'mixed') {
      return 'Mixed';
    }

    return 'Cash';
  }

  private cartLockedMessage(): string {
    return 'This order has a payment on record. The cart cannot be changed.';
  }
}
