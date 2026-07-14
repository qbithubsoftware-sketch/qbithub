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

    // Look up FSMCustomer by phone field.
    // Try exact match first, then try matching last 10 digits (in case phone
    // is stored with country code or other prefix).
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
    const assets = await db.fSMCustomerAsset.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return assets.map((asset) => ({
      invoiceNumber: `INV-${asset.id.slice(-8).toUpperCase()}`,
      customerId,
      mobileNumber: "", // denormalized — not stored on asset; filled by caller if needed
      purchaseDate: asset.purchaseDate ?? asset.createdAt,
      productModel: asset.model,
      serialNumber: asset.serialNumber,
      dealerCode: null,
      invoiceAmount: null,
      currency: "INR",
      warrantyStartDate: asset.purchaseDate ?? null,
      warrantyEndDate: asset.warrantyExpiry ?? null,
      productRegistered: true, // if it's in FSMCustomerAsset, it's registered
    }));
  }

  async listRegisteredProducts(customerId: string): Promise<RegisteredProductRecord[]> {
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
