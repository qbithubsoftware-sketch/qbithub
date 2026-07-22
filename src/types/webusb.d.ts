/**
 * WebUSB type definitions.
 * Chrome/Edge support navigator.usb API.
 * Full type definitions matching the WebUSB specification:
 * https://wicg.github.io/webusb/
 */

interface USBConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternates: USBAlternate[];
}

interface USBAlternate {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
  packetSize: number;
}

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  usbVersionMajor: number;
  usbVersionMinor: number;
  usbVersionSubminor: number;
  configurations: USBConfiguration[];
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
  controlTransferOut(setup: USBControlTransferParameters, data?: ArrayBuffer): Promise<USBOutTransferResult>;
  controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
  transferOut(endpointNumber: number, data: ArrayBuffer): Promise<USBOutTransferResult>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  clearHalt(endpointNumber: number): Promise<void>;
  reset(): Promise<void>;
}

interface USBControlTransferParameters {
  requestType: USBRequestType;
  recipient: USBRecipient;
  request: number;
  value: number;
  index: number;
}

type USBRequestType = "standard" | "class" | "vendor";
type USBRecipient = "device" | "interface" | "endpoint" | "other";

interface USBOutTransferResult {
  bytesWritten: number;
  status: USBTransferStatus;
}

interface USBInTransferResult {
  data: DataView;
  status: USBTransferStatus;
}

type USBTransferStatus = "ok" | "stall" | "babble";

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDeviceRequestOptions {
  filters?: USBDeviceFilter[];
  exclusionFilters?: USBDeviceFilter[];
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
}

interface Navigator {
  readonly usb?: USB;
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}

interface Bluetooth {
  requestDevice(options: BluetoothDeviceRequestOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}

interface BluetoothDeviceRequestOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
  optionalManufacturerData?: number[];
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: Array<{
    companyIdentifier: number;
    dataPrefix?: ArrayBuffer;
    mask?: ArrayBuffer;
  }>;
  serviceData?: Array<{
    service: BluetoothServiceUUID;
    dataPrefix?: ArrayBuffer;
    mask?: ArrayBuffer;
  }>;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchingAdvertisements: boolean;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  uuid: BluetoothServiceUUID;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: BluetoothCharacteristicUUID;
  service: BluetoothRemoteGATTService;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: ArrayBuffer | DataView): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;
