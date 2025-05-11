// Imports
import {
  companyConfigs,
  mailJetConfigs,
  postgresqlConfigs,
} from './configuration';

export const Env = {
  company: {
    legal_name: companyConfigs.legal_name,
  },
  database: {
    postgresql: {
      core_db_name: postgresqlConfigs.core_db_name,
    },
  },
  thirdParty: {
    mailJet: {
      apiKey: mailJetConfigs.apiKey,
      secretKey: mailJetConfigs.secretKey,
      hostEmail: mailJetConfigs.hostEmail,
      hostUserName: mailJetConfigs.hostUserName,
    },
  },
};
