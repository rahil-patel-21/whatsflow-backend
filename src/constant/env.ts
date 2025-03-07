// Imports
import * as env from 'dotenv';

env.config();

export const Env = {
  wa: {
    number: process.env.WA_NUMBER,
    whitelisted_numbers: (process.env.WA_WHITELISTED_NUMBERS ?? '').split(','),
  },
};

console.log('Env', Env);
