import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IFSCLookupDto {
  @ApiProperty({
    description: 'IFSC code to lookup',
    example: 'HDFC0CAGSBK',
    pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'IFSC code must be exactly 11 characters long' })
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: 'Invalid IFSC code format. Expected format: ABCD0123456',
  })
  ifsc: string;
}

export class IFSCResponseDto {
  @ApiProperty({ description: 'IFSC code' })
  ifsc: string;

  @ApiProperty({ description: 'Bank details' })
  details: {
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
  };

  @ApiProperty({ description: 'Data source', enum: ['database', 'external_api'] })
  source: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}
