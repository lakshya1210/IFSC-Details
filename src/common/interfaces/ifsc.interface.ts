export interface IFSCDetails {
  IFSC: string;
  BANK: string;
  BRANCH: string;
  CENTRE: string;
  DISTRICT: string;
  STATE: string;
  ADDRESS: string;
  CONTACT: string;
  IMPS: boolean;
  RTGS: boolean;
  CITY: string;
  ISO3166: string;
  NEFT: boolean;
  MICR: string;
  SWIFT: string;
  UPI: boolean;
}

export interface IFSCResponse {
  ifsc: string;
  details: IFSCDetails;
  source: 'database' | 'external_api';
  lastUpdated: Date;
}

export interface ExternalIFSCProvider {
  name: string;
  fetchIFSCDetails(ifscCode: string): Promise<IFSCDetails>;
}
