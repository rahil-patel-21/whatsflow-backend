// Imports
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({})
export class UserTable extends Model<UserTable> {
  @Column({
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  password: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  otp: string;
}

export const use_table_create_raw_query = `
    CREATE TABLE "UserTable" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "otp" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);`;
