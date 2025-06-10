// Imports
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ timestamps: false })
export class ChannelTable extends Model<ChannelTable> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(10),
  })
  mobile_number: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  org_id: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  country_code: string;

  @Column({
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  is_active: boolean;
}

export const channel_table_create_raw_query = `
CREATE TABLE "ChannelTable" (
  mobile_number TEXT PRIMARY KEY NOT NULL,
  org_id UUID NOT NULL,
  country_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE);`;
