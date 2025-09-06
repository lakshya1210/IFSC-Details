import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { IFSCService } from '../ifsc.service';
import { CacheService } from '../../cache/cache.service';
import { IFSCProviderFactory } from '../providers/provider.factory';
import { IFSC } from '@/database/schemas/ifsc.schema';
import { IFSCNotFoundException } from '@/common/exceptions/ifsc.exceptions';

describe('IFSCService', () => {
  let service: IFSCService;
  let mockIFSCModel: any;
  let mockCacheService: any;
  let mockProviderFactory: any;
  let mockConfigService: any;

  const mockIFSCData = {
    IFSC: 'HDFC0CAGSBK',
    BANK: 'HDFC Bank',
    BRANCH: 'Test Branch',
    CENTRE: 'BANGALORE',
    DISTRICT: 'BANGALORE URBAN',
    STATE: 'KARNATAKA',
    ADDRESS: 'Test Address',
    CONTACT: '+91123456789',
    IMPS: true,
    RTGS: true,
    CITY: 'BANGALORE',
    ISO3166: 'IN-KA',
    NEFT: true,
    MICR: '560226263',
    SWIFT: 'HDFCINBB',
    UPI: true,
    lastUpdated: new Date(),
  };

  beforeEach(async () => {
    mockIFSCModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      exec: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      generateKey: jest.fn().mockReturnValue('ifsc:HDFC0CAGSBK'),
    };

    mockProviderFactory = {
      getProvider: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          dataFreshnessDays: 30,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IFSCService,
        {
          provide: getModelToken(IFSC.name),
          useValue: mockIFSCModel,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: IFSCProviderFactory,
          useValue: mockProviderFactory,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IFSCService>(IFSCService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIFSCDetails', () => {
    it('should return cached data when available', async () => {
      const cachedResponse = {
        ifsc: 'HDFC0CAGSBK',
        details: mockIFSCData,
        source: 'database',
        lastUpdated: new Date(),
      };

      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await service.getIFSCDetails('HDFC0CAGSBK');

      expect(result).toEqual(cachedResponse);
      expect(mockCacheService.get).toHaveBeenCalledWith('ifsc:HDFC0CAGSBK');
    });

    it('should return fresh database data when available and fresh', async () => {
      mockCacheService.get.mockResolvedValue(null);
      
      const mockDbRecord = {
        ...mockIFSCData,
        lastUpdated: new Date(), // Fresh data
        exec: jest.fn().mockResolvedValue({
          ...mockIFSCData,
          lastUpdated: new Date(),
        }),
      };

      mockIFSCModel.findOne.mockReturnValue(mockDbRecord);

      const result = await service.getIFSCDetails('HDFC0CAGSBK');

      expect(result.source).toBe('database');
      expect(result.ifsc).toBe('HDFC0CAGSBK');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should fetch from external API when no cache and no fresh database data', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIFSCModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockProvider = {
        fetchIFSCDetails: jest.fn().mockResolvedValue(mockIFSCData),
      };
      mockProviderFactory.getProvider.mockReturnValue(mockProvider);

      mockIFSCModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockIFSCData,
          lastUpdated: new Date(),
        }),
      });

      const result = await service.getIFSCDetails('HDFC0CAGSBK');

      expect(result.source).toBe('external_api');
      expect(result.ifsc).toBe('HDFC0CAGSBK');
      expect(mockProvider.fetchIFSCDetails).toHaveBeenCalledWith('HDFC0CAGSBK');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw IFSCNotFoundException when IFSC not found anywhere', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIFSCModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockProvider = {
        fetchIFSCDetails: jest.fn().mockRejectedValue(new IFSCNotFoundException('INVALID123')),
      };
      mockProviderFactory.getProvider.mockReturnValue(mockProvider);

      await expect(service.getIFSCDetails('INVALID123')).rejects.toThrow(IFSCNotFoundException);
    });

    it('should return stale database data when external API fails', async () => {
      mockCacheService.get.mockResolvedValue(null);
      
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 35); // 35 days old (stale)
      
      const mockDbRecord = {
        ...mockIFSCData,
        lastUpdated: staleDate,
        exec: jest.fn().mockResolvedValue({
          ...mockIFSCData,
          lastUpdated: staleDate,
        }),
      };

      mockIFSCModel.findOne.mockReturnValue(mockDbRecord);

      const mockProvider = {
        fetchIFSCDetails: jest.fn().mockRejectedValue(new Error('API Error')),
      };
      mockProviderFactory.getProvider.mockReturnValue(mockProvider);

      const result = await service.getIFSCDetails('HDFC0CAGSBK');

      expect(result.source).toBe('database');
      expect(result.ifsc).toBe('HDFC0CAGSBK');
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      mockIFSCModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(100),
      });

      // Mock for fresh records count
      mockIFSCModel.countDocuments.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(100),
      }).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(80),
      });

      const result = await service.getStats();

      expect(result).toEqual({
        totalRecords: 100,
        freshRecords: 80,
        staleRecords: 20,
        dataFreshnessDays: 30,
      });
    });
  });
});
