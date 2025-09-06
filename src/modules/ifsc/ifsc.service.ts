import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { IFSC, IFSCDocument } from '@/database/schemas/ifsc.schema';
import { CacheService } from '@/modules/cache/cache.service';
import { IFSCProviderFactory } from './providers/provider.factory';
import { IFSCDetails, IFSCResponse } from '@/common/interfaces/ifsc.interface';
import { IFSCNotFoundException } from '@/common/exceptions/ifsc.exceptions';

@Injectable()
export class IFSCService {
  private readonly logger = new Logger(IFSCService.name);
  private readonly dataFreshnessDays: number;

  constructor(
    @InjectModel(IFSC.name) private ifscModel: Model<IFSCDocument>,
    private cacheService: CacheService,
    private providerFactory: IFSCProviderFactory,
    private configService: ConfigService,
  ) {
    this.dataFreshnessDays = this.configService.get<number>('dataFreshnessDays');
  }

  async getIFSCDetails(ifscCode: string): Promise<IFSCResponse> {
    const normalizedIFSC = ifscCode.toUpperCase();
    
    // Check cache first
    const cacheKey = this.cacheService.generateKey('ifsc', normalizedIFSC);
    const cachedData = await this.cacheService.get<IFSCResponse>(cacheKey);
    
    if (cachedData) {
      this.logger.log(`Cache hit for IFSC: ${normalizedIFSC}`);
      return cachedData;
    }

    // Check database for existing data
    const dbRecord = await this.ifscModel.findOne({ IFSC: normalizedIFSC }).exec();
    
    if (dbRecord && this.isDataFresh(dbRecord.lastUpdated)) {
      this.logger.log(`Fresh data found in database for IFSC: ${normalizedIFSC}`);
      
      const response: IFSCResponse = {
        ifsc: normalizedIFSC,
        details: this.mapToIFSCDetails(dbRecord),
        source: 'database',
        lastUpdated: dbRecord.lastUpdated,
      };

      // Cache the response
      await this.cacheService.set(cacheKey, response);
      return response;
    }

    // Fetch from external API
    try {
      const provider = this.providerFactory.getProvider('razorpay');
      const externalData = await provider.fetchIFSCDetails(normalizedIFSC);
      
      // Update database with fresh data
      const updatedRecord = await this.upsertIFSCRecord(normalizedIFSC, externalData);
      
      const response: IFSCResponse = {
        ifsc: normalizedIFSC,
        details: externalData,
        source: 'external_api',
        lastUpdated: updatedRecord.lastUpdated,
      };

      // Cache the response
      await this.cacheService.set(cacheKey, response);
      
      this.logger.log(`Successfully fetched and cached IFSC details for: ${normalizedIFSC}`);
      return response;
      
    } catch (error) {
      // If external API fails and we have stale data, return it
      if (dbRecord) {
        this.logger.warn(`External API failed, returning stale data for IFSC: ${normalizedIFSC}`);
        
        const response: IFSCResponse = {
          ifsc: normalizedIFSC,
          details: this.mapToIFSCDetails(dbRecord),
          source: 'database',
          lastUpdated: dbRecord.lastUpdated,
        };

        await this.cacheService.set(cacheKey, response);
        return response;
      }
      
      // No data available anywhere
      throw error;
    }
  }

  private isDataFresh(lastUpdated: Date): boolean {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays < this.dataFreshnessDays;
  }

  private async upsertIFSCRecord(ifscCode: string, details: IFSCDetails): Promise<IFSCDocument> {
    const updateData = {
      ...details,
      lastUpdated: new Date(),
    };

    return await this.ifscModel.findOneAndUpdate(
      { IFSC: ifscCode },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  }

  private mapToIFSCDetails(dbRecord: IFSCDocument): IFSCDetails {
    return {
      IFSC: dbRecord.IFSC,
      BANK: dbRecord.BANK,
      BRANCH: dbRecord.BRANCH,
      CENTRE: dbRecord.CENTRE,
      DISTRICT: dbRecord.DISTRICT,
      STATE: dbRecord.STATE,
      ADDRESS: dbRecord.ADDRESS,
      CONTACT: dbRecord.CONTACT,
      IMPS: dbRecord.IMPS,
      RTGS: dbRecord.RTGS,
      CITY: dbRecord.CITY,
      ISO3166: dbRecord.ISO3166,
      NEFT: dbRecord.NEFT,
      MICR: dbRecord.MICR,
      SWIFT: dbRecord.SWIFT,
      UPI: dbRecord.UPI,
    };
  }

  async getStats(): Promise<any> {
    const totalRecords = await this.ifscModel.countDocuments().exec();
    const freshRecords = await this.ifscModel.countDocuments({
      lastUpdated: {
        $gte: new Date(Date.now() - this.dataFreshnessDays * 24 * 60 * 60 * 1000)
      }
    }).exec();

    return {
      totalRecords,
      freshRecords,
      staleRecords: totalRecords - freshRecords,
      dataFreshnessDays: this.dataFreshnessDays,
    };
  }
}
