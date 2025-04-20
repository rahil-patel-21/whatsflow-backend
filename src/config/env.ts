// Imports
import { postgresqlConfigs } from './configuration';

export const Env = {
  database: {
    postgresql: {
      core_db_name: postgresqlConfigs.core_db_name,
    },
  },
};
