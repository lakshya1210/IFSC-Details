import { Controller, Get, Param, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IFSCService } from './ifsc.service';
import { IFSCLookupDto, IFSCResponseDto } from '@/common/dto/ifsc.dto';

@ApiTags('IFSC')
@Controller('api/ifsc')
export class IFSCController {
  private readonly logger = new Logger(IFSCController.name);

  constructor(private readonly ifscService: IFSCService) {}

  @Get(':ifsc')
  @ApiOperation({ 
    summary: 'Get IFSC details',
    description: 'Get bank details for an IFSC code'
  })
  @ApiParam({
    name: 'ifsc',
    description: 'IFSC code (11 characters)',
    example: 'HDFC0CAGSBK',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IFSC details retrieved successfully',
    type: IFSCResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid IFSC code format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'IFSC code not found',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'External service unavailable',
  })
  async getIFSCDetails(@Param('ifsc') ifsc: string) {
    this.logger.log(`Received request for IFSC: ${ifsc}`);
    
    // Validate IFSC format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      this.logger.warn(`Invalid IFSC format: ${ifsc}`);
      throw new Error('Invalid IFSC code format. Expected format: ABCD0123456');
    }

    const result = await this.ifscService.getIFSCDetails(ifsc);
    this.logger.log(`Successfully processed request for IFSC: ${ifsc}, source: ${result.source}`);
    
    return result;
  }

  @Get('stats/summary')
  @ApiOperation({
    summary: 'Get service statistics',
    description: 'Retrieve statistics about cached and stored IFSC data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    return await this.ifscService.getStats();
  }

  @Get('health/check')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check if the service is running'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'IFSC Lookup Service',
    };
  }
}
