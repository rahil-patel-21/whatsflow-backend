// Imports
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({})
export class ChannelTable extends Model<ChannelTable> {
  @Column({
    defaultValue: DataType.TEXT,
    primaryKey: true,
    type: DataType.TEXT,
  })
  channel_id: string;

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
    allowNull: false,
    type: DataType.STRING(10),
  })
  mobile_number: string;

  @Column({
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  is_active: boolean;
}

export const channel_table_create_raw_query = `
CREATE TABLE "ChannelTable" (
  channel_id TEXT PRIMARY KEY NOT NULL,
  org_id UUID NOT NULL,
  country_code TEXT NOT NULL,
  mobile_number VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE);`;
