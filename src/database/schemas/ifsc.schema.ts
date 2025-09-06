import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IFSCDocument = IFSC & Document;

@Schema({ timestamps: true })
export class IFSC {
  @Prop({ required: true, unique: true, uppercase: true })
  IFSC: string;

  @Prop({ required: true })
  BANK: string;

  @Prop({ required: true })
  BRANCH: string;

  @Prop({ required: true })
  CENTRE: string;

  @Prop({ required: true })
  DISTRICT: string;

  @Prop({ required: true })
  STATE: string;

  @Prop({ required: true })
  ADDRESS: string;

  @Prop()
  CONTACT: string;

  @Prop({ default: false })
  IMPS: boolean;

  @Prop({ default: false })
  RTGS: boolean;

  @Prop({ required: true })
  CITY: string;

  @Prop()
  ISO3166: string;

  @Prop({ default: false })
  NEFT: boolean;

  @Prop()
  MICR: string;

  @Prop()
  SWIFT: string;

  @Prop({ default: false })
  UPI: boolean;

  @Prop({ default: Date.now })
  lastUpdated: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const IFSCSchema = SchemaFactory.createForClass(IFSC);
