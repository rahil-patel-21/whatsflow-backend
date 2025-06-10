// Imports
import {
  FindAttributeOptions,
  UpdateOptions,
  WhereOptions,
  Order,
  GroupOption,
  Includeable,
  BulkCreateOptions,
} from 'sequelize';
import sequelize from 'sequelize';
import { HTTPError } from 'src/config/error';
import { Sequelize } from 'sequelize-typescript';
import { ISequelizeFindOptions } from './pg.interface';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PgService {
  private readonly logger = new Logger(PgService.name);

  constructor(private readonly sequelize: Sequelize) {}

  //#region  get db connection
  private getDBConnection(modelName) {
    try {
      return this.sequelize.getRepository(modelName);
    } catch (error) {}
    return undefined;
  }

  async create(modelName, data, t1?: sequelize.Transaction) {
    const repo = this.getDBConnection(modelName);
    this.checkPoint(data);
    if (!repo)
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    try {
      const options = t1 ? { transaction: t1 } : {};
      const created = await repo.create(data, options);
      return created['dataValues'];
    } catch (error) {
      console.log({ error });
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      if (error.name === 'SequelizeUniqueConstraintError')
        throw new HTTPError({ statusCode: HttpStatus.CONFLICT });
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  //#region update query
  async update(modelName, data, options: UpdateOptions) {
    const repo = this.getDBConnection(modelName);
    if (!repo || !options.where)
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });

    try {
      const update: any = await repo.update(data, {
        ...options,
        returning: true,
      });
      return {
        count: update[0],
        updated: update[1]?.map((el) => {
          try {
            return el.get({ plain: true });
          } catch (error) {
            return el;
          }
        }),
      };
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      if (error.name === 'SequelizeUniqueConstraintError')
        throw new HTTPError({ statusCode: HttpStatus.CONFLICT });
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  //#endregion

  //#region update query
  async updateWithWhere(modelName, data, options: UpdateOptions) {
    const repo = this.getDBConnection(modelName);
    if (!repo || !options.where)
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });

    try {
      const update: any = await repo.update(data, {
        ...options,
        returning: true,
      });
      return {
        count: update[0],
        updated: update[1]?.map((el) => {
          try {
            return el.get({ plain: true });
          } catch (error) {
            return el;
          }
        }),
      };
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      if (error.name === 'SequelizeUniqueConstraintError')
        throw new HTTPError({ statusCode: HttpStatus.CONFLICT });
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  //#endregion

  async findOne(
    modelName,
    options: {
      attributes?: FindAttributeOptions | any;
      where?: WhereOptions;
      include?: Includeable | Includeable[] | any;
      order?: Order | any;
      offset?: number;
      raw?: boolean;
      distinct?: boolean;
      nest?: boolean;
      group?: GroupOption;
      afterFindOptions?: { aadhaarState?: boolean; dobInYears?: boolean };
    },
  ): Promise<any> {
    const repo = this.getDBConnection(modelName);
    try {
      options.include = this.getPrePareInclude(options.include);
      if (!repo)
        throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
      if (typeof options.raw === 'undefined') options.raw = true;
      if (typeof options.nest === 'undefined') options.nest = true;
      if (typeof options.distinct === 'undefined') options.distinct = true;
      return await repo.findOne(options);
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async findAll(modelName, options: ISequelizeFindOptions): Promise<any[]> {
    const repo = this.getDBConnection(modelName);
    try {
      options.include = this.getPrePareInclude(options.include);
      if (!repo)
        throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
      if (typeof options.raw === 'undefined') options.raw = true;
      if (typeof options.nest === 'undefined') options.nest = true;
      if (typeof options.distinct === 'undefined') options.distinct = true;
      return await repo.findAll(options);
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      throw new HTTPError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: (error.toString() ?? '')
          .replace('SequelizeDatabaseError:', '')
          .trim(),
      });
    }
  }

  //#region bulk create
  async bulkCreate(
    modelName,
    data,
    options?: BulkCreateOptions,
    t1?: sequelize.Transaction,
  ) {
    const repo = this.getDBConnection(modelName);
    if (!repo)
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    try {
      if (t1)
        if (!options) options = { transaction: t1 };
        else options.transaction = t1;
      const created = await repo.bulkCreate(data, options);
      return created.map((el) => el.get({ plain: true }));
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      if (error.name === 'SequelizeUniqueConstraintError')
        throw new HTTPError({ statusCode: HttpStatus.CONFLICT });
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  //#endregion

  //#region include
  private getPrePareInclude(include) {
    if (include) {
      if (include.length)
        include.forEach((ele) => {
          ele.model = this.getDBConnection(ele.model);
          if (ele.include) ele.include = this.getPrePareInclude(ele.include);
        });
      else {
        include.model = this.getDBConnection(include.model);
        if (include.include)
          include.include = this.getPrePareInclude(include.include);
      }
    }
    return include;
  }
  //#endregion

  //#region check mandatory fields before creating record in specific table
  private checkPoint(data) {
    const fields = [];
    for (let i = 0; i < fields?.length; i++) {
      const item = fields[i];
      if (!data[item]) throw new HTTPError({ parameter: item });
    }
  }
  //#endregion

  //#region get count of where
  async count(
    modelName,
    options: { where?: WhereOptions; distinct?: boolean; group?: GroupOption },
  ) {
    try {
      const repo = this.getDBConnection(modelName);
      if (!repo)
        throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
      if (typeof options.distinct === 'undefined') options.distinct = true;
      return await repo.count(options);
    } catch (error) {
      this.logger.error(error);
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  //#endregion

  //#region get average
  async average(
    modelName,
    columnName,
    options: { where?: WhereOptions; group?: GroupOption } = {},
  ) {
    try {
      const repo = this.getDBConnection(modelName);
      if (!repo)
        throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });

      const result = await repo.findOne({
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.cast(Sequelize.col(columnName), 'FLOAT'),
            ),
            'avgValue',
          ],
        ],
        where: options.where,
        group: options.group,
      });

      return result ? result.get('avgValue') : null;
    } catch (error) {
      this.logger.error(error);
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  //#endregion

  async findAndCountAll(
    modelName,
    paginate: { page?: number; limit?: number },
    options: {
      subQuery?: boolean;
      attributes?: FindAttributeOptions | any;
      include?: Includeable[] | any;
      where?: WhereOptions;
      offset?: number;
      limit?: number;
      order?: Order | any;
      raw?: boolean;
      nest?: boolean;
      distinct?: boolean;
      download?: boolean;
      group?: GroupOption;
    },
  ) {
    const repo = this.getDBConnection(modelName);
    if (!repo)
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    options.include = this.getPrePareInclude(options.include);

    const limit = +(paginate.limit ?? 10);
    const page = +(paginate.page ?? 1);
    const end = page * limit;
    const start = end - limit;
    let totalPages = 0;
    if (page != 0 && !options.download) {
      options.limit = limit;
      options.offset = start;
    }
    if (typeof options.raw === 'undefined') options.raw = true;
    if (typeof options.nest === 'undefined') options.nest = true;
    if (typeof options.distinct === 'undefined') options.distinct = true;

    let data;
    try {
      data = await repo.findAndCountAll(options);
    } catch (error) {
      this.logger.error(error + ' In Table:-> ' + repo.getTableName());
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    let count = 0;
    if (Array.isArray(data.count)) {
      data.count.forEach((item) => {
        count += item.count;
      });
      data.count = count;
    }

    totalPages = options?.download ? 1 : Math.ceil(data.count / limit);
    const nextPage = totalPages == page ? null : page + 1;
    const prevPage = page == 1 ? null : page - 1;
    return {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      totalRows: data.count,
      rowPerPage: options?.download ? data.count : limit,
      rows: data.rows,
    };
  }

  async query(queryString: string): Promise<any> {
    try {
      return await this.sequelize.query(queryString, {
        type: sequelize.QueryTypes.SELECT, // Specify query type
      });
    } catch (error) {
      this.logger.error(error);
      throw new HTTPError({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
