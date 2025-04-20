// Imports
import {
  FindAttributeOptions,
  GroupOption,
  Includeable,
  Order,
  WhereOptions,
} from 'sequelize';

export interface ISequelizeFindOptions {
  attributes?: FindAttributeOptions | any;
  where?: WhereOptions;
  include?: Includeable[] | any;
  limit?: number;
  offset?: number;
  order?: Order | any;
  raw?: boolean;
  nest?: boolean;
  distinct?: boolean;
  group?: GroupOption;
}
