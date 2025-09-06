import { Injectable } from '@nestjs/common';
import { ExternalIFSCProvider } from '@/common/interfaces/ifsc.interface';
import { RazorpayIFSCProvider } from './razorpay.provider';

@Injectable()
export class IFSCProviderFactory {
  private providers: Map<string, ExternalIFSCProvider> = new Map();

  constructor(private razorpayProvider: RazorpayIFSCProvider) {
    // Register available providers
    this.registerProvider('razorpay', razorpayProvider);
    // Future providers can be registered here
    // this.registerProvider('other-provider', otherProvider);
  }

  registerProvider(name: string, provider: ExternalIFSCProvider): void {
    this.providers.set(name, provider);
  }

  getProvider(name: string = 'razorpay'): ExternalIFSCProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }
    return provider;
  }

  getAllProviders(): ExternalIFSCProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
}
