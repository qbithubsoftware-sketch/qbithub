# Task: QBIT Universal Device Identity Architecture UI Implementation

## Task ID: uuid-device-identity-ui

## Summary of Work

Created the QBIT Universal Device Identity Architecture UI for the existing Next.js 16 project. This includes 4 new components, 3 navigation/config updates, RBAC permission updates, and screen routing integration.

## Files Created

### 1. `/src/components/qbit/QbitDeviceQRCode.tsx`
- QR Code display component for devices
- SVG-based deterministic QR pattern generation from device UUID
- Shows Device UUID, QR content format (`QBT://DEVICE/QBT-XXXX`), copy/download buttons
- Props: `{ deviceUuid, serialNumber?, productName? }`

### 2. `/src/components/qbit/DuplicateSerialResolution.tsx`
- Duplicate serial number resolution component
- Amber warning banner for duplicate serial detection
- Lists all devices sharing a serial number
- Resolution form with: Invoice Number, Purchase Date, Dealer Name, Mobile Number, Customer Name
- "Verify" button calls `/api/dr-qbit/uuid/serial-search`
- On resolution: navigates to `device-uuid-profile` with resolved UUID
- Props: `{ serialNumber, onResolved }`

### 3. `/src/components/qbit/pages/QbitDeviceProfilePage.tsx`
- Customer Device Profile page
- Fetches device data from `GET /api/dr-qbit/uuid/lookup?uuid={deviceUuid}`
- Product image, name, model, serial number header card
- Warranty status card (green for active, red for expired)
- KPI cards for warranty, days remaining, firmware version, driver status
- Tabs: Details, Downloads, Warranty, QR Code, Support
- Developer Mode toggle in footer (shows internal UUID/fingerprint data only when enabled)
- Duplicate Serial warning banner when `duplicateSerialFlag` is true
- Uses AppShell with ADMIN_NAV

### 4. `/src/components/qbit/pages/DeviceUuidRegistrationPage.tsx`
- Admin Device Registration page with 6-step scan workflow
- Step 1: Scan Device (FingerprintDiscoveryCard)
- Step 2: Hardware Info (auto-populated from scan)
- Step 3: UUID & Fingerprint Quality display
- Step 4: Business fields (customer, dealer, invoice, dates, product selection)
- Step 5: Confirm & Save (POST `/api/dr-qbit/uuid/register`)
- Step 6: Success with QR Code display
- Uses AppShell with ADMIN_NAV

## Files Modified

### 5. `/src/lib/navigation/store.ts`
- Added new ScreenId types: `"device-uuid-register"` and `"device-uuid-profile"`

### 6. `/src/lib/navigation/nav-config.ts`
- Added to ADMIN_NAV: `{ label: "Device Register (UUID)", icon: "fingerprint", screen: "device-uuid-register", badge: "UUID" }`
- Added to FSM_NAV: `{ label: "UUID Profile", icon: "fingerprint", screen: "device-uuid-profile" }`

### 7. `/src/lib/rbac/roles.ts`
- Added RBAC permissions:
  - `"device-uuid-register": ["super_administrator", "administrator"]`
  - `"device-uuid-profile": ["super_administrator", "administrator", "installation_engineer"]`

### 8. `/src/app/portal/page.tsx`
- Added imports for DeviceUuidRegistrationPage and QbitDeviceProfilePage
- Added switch cases for `"device-uuid-register"` and `"device-uuid-profile"`

## Technical Notes
- All components follow the existing QBIT design system patterns (qbit-primary, SurfaceCard, Icon, QbitButton)
- No new routes were created in /src/app/ (only / route exists)
- Uses existing API endpoints: `/api/dr-qbit/uuid/lookup`, `/api/dr-qbit/uuid/register`, `/api/dr-qbit/uuid/serial-search`
- Responsive design: mobile-first with sm/md/lg breakpoints
- TypeScript: No compilation errors in new files
- ESLint: Only pre-existing warnings, no new errors
