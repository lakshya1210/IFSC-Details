import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ExternalIFSCProvider, IFSCDetails } from '@/common/interfaces/ifsc.interface';
import { ExternalAPIException, IFSCNotFoundException } from '@/common/exceptions/ifsc.exceptions';

@Injectable()
export class RazorpayIFSCProvider implements ExternalIFSCProvider {
  name = 'Razorpay';
  private readonly logger = new Logger(RazorpayIFSCProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('externalApis.razorpay.baseUrl');
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'IFSC-Service/1.0',
      },
    });
  }

  async fetchIFSCDetails(ifscCode: string): Promise<IFSCDetails> {
    try {
      this.logger.log(`Fetching IFSC details for ${ifscCode} from Razorpay API`);
      
      const response = await this.httpClient.get(`${this.baseUrl}/${ifscCode}`);
      
      if (response.status === 200 && response.data) {
        const data = response.data;
        
        // Transform the response to match our interface
        const ifscDetails: IFSCDetails = {
          IFSC: data.IFSC || ifscCode,
          BANK: data.BANK || '',
          BRANCH: data.BRANCH || '',
          CENTRE: data.CENTRE || '',
          DISTRICT: data.DISTRICT || '',
          STATE: data.STATE || '',
          ADDRESS: data.ADDRESS || '',
          CONTACT: data.CONTACT || '',
          IMPS: data.IMPS === true,
          RTGS: data.RTGS === true,
          CITY: data.CITY || '',
          ISO3166: data.ISO3166 || '',
          NEFT: data.NEFT === true,
          MICR: data.MICR || '',
          SWIFT: data.SWIFT || '',
          UPI: data.UPI === true,
        };

        this.logger.log(`Successfully fetched IFSC details for ${ifscCode}`);
        return ifscDetails;
      }
      
      throw new IFSCNotFoundException(ifscCode);
    } catch (error) {
      if (error instanceof IFSCNotFoundException) {
        throw error;
      }

      if (error.response?.status === 404) {
        this.logger.warn(`IFSC code ${ifscCode} not found in Razorpay API`);
        throw new IFSCNotFoundException(ifscCode);
      }

      this.logger.error(`Error fetching IFSC details from Razorpay API:`, error.message);
      throw new ExternalAPIException(`Failed to fetch data from ${this.name}: ${error.message}`);
    }
  }
}
