// Imports
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { logInfo } from 'src/utils/consoles';
import { kPathConfigYml } from 'src/constant/path';

export const YAML_CONFIG = getYamlConfig();

function getYamlConfig() {
  const yaml_config = yaml.load(readFileSync(kPathConfigYml, 'utf8')) as Record<
    string,
    any
  >;
  logInfo('config.yml file is loaded successfully !');
  return yaml_config;
}

export const serverConfigs = YAML_CONFIG['server'] ?? {};

export const companyConfigs = YAML_CONFIG['company'] ?? {};

export const postgresqlConfigs =
  (YAML_CONFIG['database'] ?? {})['postgresql'] ?? {};

export const mailJetConfigs = YAML_CONFIG['mailjet'] ?? {};
