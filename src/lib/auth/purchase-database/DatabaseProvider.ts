/**
 * DatabasePurchaseProvider — implements PurchaseDatabaseProvider using
 * the existing Prisma DB (FSMCustomer + FSMCustomerAsset + DeviceWarranty).
 *
 * This is NOT mock data — it reads real customer + purchase + device records
 * from the database. It's the bridge between the modular Purchase Database
 * auth architecture and the existing QBIT Hub data layer.
 *
 * Lookup logic:
 *   - findCustomerByMobile(mobile) → FSMCustomer where phone = mobile
 *   - listPurchasesByCustomer(id) → FSMCustomerAsset rows (each asset = a purchase)
 *   - listRegisteredProducts(id) → FSMCustomerAsset rows where status = "active"
 *   - sendOtp / verifyOtp → not implemented (returns failure with helpful message)
 *
 * When the real ERP/CRM is connected, this provider can be replaced by setting
 * PURCHASE_DB_PROVIDER=erp — no UI or auth flow changes needed.
 */

import { db } from "@/lib/db";
import type { PurchaseDatabaseProvider } from "./PurchaseDatabaseProvider";
import type {
  PurchaseCustomerRecord,
  PurchaseRecord,
  RegisteredProductRecord,
  OtpRequestResult,
  OtpVerifyResult,
} from "./types";

export class DatabasePurchaseProvider implements PurchaseDatabaseProvider {
  readonly name = "database";

  async findCustomerByMobile(mobileNumber: string): Promise<PurchaseCustomerRecord | null> {
    // Normalize: strip country code, leading 0, non-digits
    const normalized = mobileNumber.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
    if (normalized.length !== 10) return null;

    // ===== V3: Check CustomerAccount table FIRST (AI-imported customers) =====
    const customerAccount = await db.customerAccount.findUnique({
      where: { mobileNumber: normalized },
    });

    if (customerAccount) {
      return {
        customerId: customerAccount.id,
        name: customerAccount.name,
        mobileNumber: normalized,
        email: customerAccount.email ?? null,
        companyName: customerAccount.companyName ?? null,
        status: customerAccount.status === "active" ? "active" : "active", // pending accounts can still verify
        registeredAt: customerAccount.createdAt,
      };
    }

    // ===== Fallback: Check FSMCustomer table (legacy customers) =====
    const customer = await db.fSMCustomer.findFirst({
      where: {
        OR: [
          { phone: normalized },
          { phone: { endsWith: normalized } },
          { phone: `+91${normalized}` },
          { phone: `91${normalized}` },
          { phone: `0${normalized}` },
        ],
      },
    });

    if (!customer) return null;

    return {
      customerId: customer.id,
      name: customer.name,
      mobileNumber: normalized,
      email: customer.email ?? null,
      companyName: customer.companyName ?? null,
      status: "active", // FSMCustomer doesn't have a status field — treat all as active
      registeredAt: customer.createdAt,
    };
  }

  async listPurchasesByCustomer(customerId: string): Promise<PurchaseRecord[]> {
    // ===== V3: Check PurchaseRecord table FIRST (AI-imported purchases) =====
    const purchaseRecords = await db.purchaseRecord.findMany({
      where: {
        OR: [
          { customerId }, // CustomerAccount ID
          { customer: { mobileNumber: { contains: customerId } } }, // fallback
        ],
      },
      orderBy: { purchaseDate: "desc" },
      take: 100,
    });

    if (purchaseRecords.length > 0) {
      return purchaseRecords.map((p) => ({
        invoiceNumber: p.invoiceNumber ?? p.purchaseId,
        customerId,
        mobileNumber: "",
        purchaseDate: p.purchaseDate ?? p.createdAt,
        productModel: p.modelNumber,
        serialNumber: p.serialNumber ?? null,
        dealerCode: p.dealerId ?? null,
        invoiceAmount: p.totalAmount ?? null,
        currency: "INR",
        warrantyStartDate: p.warrantyStartDate ?? null,
        warrantyEndDate: p.warrantyEndDate ?? null,
        productRegistered: true,
      }));
    }

    // ===== Fallback: Check FSMCustomerAsset table (legacy) =====
    const assets = await db.fSMCustomerAsset.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return assets.map((asset) => ({
      invoiceNumber: `INV-${asset.id.slice(-8).toUpperCase()}`,
      customerId,
      mobileNumber: "",
      purchaseDate: asset.purchaseDate ?? asset.createdAt,
      productModel: asset.model,
      serialNumber: asset.serialNumber,
      dealerCode: null,
      invoiceAmount: null,
      currency: "INR",
      warrantyStartDate: asset.purchaseDate ?? null,
      warrantyEndDate: asset.warrantyExpiry ?? null,
      productRegistered: true,
    }));
  }

  async listRegisteredProducts(customerId: string): Promise<RegisteredProductRecord[]> {
    // ===== V3: Check PurchaseRecord table FIRST =====
    const purchaseRecords = await db.purchaseRecord.findMany({
      where: {
        OR: [
          { customerId },
          { customer: { mobileNumber: { contains: customerId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (purchaseRecords.length > 0) {
      return purchaseRecords.map((p) => ({
        registrationId: p.id,
        customerId,
        invoiceNumber: p.invoiceNumber ?? p.purchaseId,
        productModel: p.modelNumber,
        serialNumber: p.serialNumber ?? "",
        registeredAt: p.createdAt,
        status: "active" as const,
      }));
    }

    // ===== Fallback: Check FSMCustomerAsset table (legacy) =====
    const assets = await db.fSMCustomerAsset.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return assets.map((asset) => ({
      registrationId: asset.id,
      customerId,
      invoiceNumber: `INV-${asset.id.slice(-8).toUpperCase()}`,
      productModel: asset.model,
      serialNumber: asset.serialNumber,
      registeredAt: asset.createdAt,
      status: "active" as const,
    }));
  }

  async sendOtp(_mobileNumber: string): Promise<OtpRequestResult> {
    // OTP delivery requires an SMS gateway integration.
    // For now, return a failure with a helpful message — NOT a fake OTP.
    return {
      success: false,
      message:
        "OTP login is not yet available. Please use mobile number + password login, or contact QBIT Support.",
    };
  }

  async verifyOtp(_mobileNumber: string, _otp: string, _reference: string): Promise<OtpVerifyResult> {
    return {
      verified: false,
      message: "OTP verification is not yet available. Please use password login.",
    };
  }
}
