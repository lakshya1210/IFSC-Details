import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RazorpayIFSCProvider } from '../razorpay.provider';
import { IFSCNotFoundException, ExternalAPIException } from '@/common/exceptions/ifsc.exceptions';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RazorpayIFSCProvider', () => {
  let provider: RazorpayIFSCProvider;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'externalApis.razorpay.baseUrl': 'https://ifsc.razorpay.com',
        };
        return config[key];
      }),
    };

    // Mock axios.create
    mockedAxios.create = jest.fn().mockReturnValue(mockedAxios);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RazorpayIFSCProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<RazorpayIFSCProvider>(RazorpayIFSCProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('Razorpay');
  });

  describe('fetchIFSCDetails', () => {
    const mockApiResponse = {
      status: 200,
      data: {
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
      },
    };

    it('should successfully fetch IFSC details', async () => {
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await provider.fetchIFSCDetails('HDFC0CAGSBK');

      expect(result).toEqual({
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
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('https://ifsc.razorpay.com/HDFC0CAGSBK');
    });

    it('should throw IFSCNotFoundException when API returns 404', async () => {
      const error = {
        response: {
          status: 404,
        },
      };
      mockedAxios.get.mockRejectedValue(error);

      await expect(provider.fetchIFSCDetails('INVALID123')).rejects.toThrow(IFSCNotFoundException);
    });

    it('should throw ExternalAPIException when API fails with other errors', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(provider.fetchIFSCDetails('HDFC0CAGSBK')).rejects.toThrow(ExternalAPIException);
    });

    it('should handle missing fields in API response', async () => {
      const incompleteResponse = {
        status: 200,
        data: {
          IFSC: 'HDFC0CAGSBK',
          BANK: 'HDFC Bank',
          // Missing other fields
        },
      };
      mockedAxios.get.mockResolvedValue(incompleteResponse);

      const result = await provider.fetchIFSCDetails('HDFC0CAGSBK');

      expect(result.IFSC).toBe('HDFC0CAGSBK');
      expect(result.BANK).toBe('HDFC Bank');
      expect(result.BRANCH).toBe('');
      expect(result.IMPS).toBe(false);
      expect(result.RTGS).toBe(false);
      expect(result.NEFT).toBe(false);
      expect(result.UPI).toBe(false);
    });
  });
});
