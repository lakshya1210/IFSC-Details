import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IFSCController } from './ifsc.controller';
import { IFSCService } from './ifsc.service';
import { IFSC, IFSCSchema } from '@/database/schemas/ifsc.schema';
import { CacheModule } from '@/modules/cache/cache.module';
import { RazorpayIFSCProvider } from './providers/razorpay.provider';
import { IFSCProviderFactory } from './providers/provider.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: IFSC.name, schema: IFSCSchema }]),
    CacheModule,
  ],
  controllers: [IFSCController],
  providers: [IFSCService, RazorpayIFSCProvider, IFSCProviderFactory],
  exports: [IFSCService],
})
export class IFSCModule {}
