/**
 * WebUSB type definitions.
 * Chrome/Edge support navigator.usb API.
 */

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  usbVersionMajor: number;
  usbVersionMinor: number;
  usbVersionSubminor: number;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
}

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
}

interface Navigator {
  readonly usb?: USB;
}
