// ******************** //
// Reusable variables to lower code redundancy in other files.
// ******************** //

// Load environmental variables from this file, most needed here
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '..', '.env') });

import * as errors from './errors';
import { Db } from 'mongodb';
import { enums } from './enums';
import { FronvoError, LoggedInSocket, PerformanceReport, RequiredStartupFile } from 'interfaces/all';
import { existsSync } from 'fs';

function decideBooleanEnvValue(value: string, valueIfNull: boolean): boolean {
    return value == null ? valueIfNull : (value.toLowerCase() == 'true' ? true : false);
}

const generatedFilesDirectory = resolve(__dirname, '../generated');

// Add generated paths here
const localDBDirectory = resolve(generatedFilesDirectory, 'local');
export const localDBPath = resolve(localDBDirectory, 'db.json');

// File templates
const localDBTemplate: {[dbName: string]: {}[]} = {
    // TODO: Prisma when we have TypeScript, different PR
    accounts: [],
    tokens: [],
    reports: [],
    logs: []
};

// Reusable variables
export const blacklistedEmailDomainsEnabled = decideBooleanEnvValue(process.env.FRONVO_EMAIL_BLACKLISTING_ENABLED, true);
export const testMode = decideBooleanEnvValue(process.env.FRONVO_TEST_MODE, false);
export const localMode = testMode || decideBooleanEnvValue(process.env.FRONVO_LOCAL_MODE, true);
export const localSave = decideBooleanEnvValue(process.env.FRONVO_LOCAL_SAVE, true);

export const loggedInSockets: {[socketId: string]: LoggedInSocket} = {};

export const defaultError: FronvoError = {
    err: {
        msg: errors.ERR_UNKNOWN,
        code: enums.ERR_UNKNOWN
    }
};

// Passwords
export const mainBcryptHash = 12;

// Performance logs for functions
export const performanceReportsEnabled = decideBooleanEnvValue(process.env.FRONVO_PERFORMANCE_REPORTS, false);

// Storage of temporary performance reports if applicable
export const performanceReports: {[perfUUID: string]: PerformanceReport} = {};

// Minimum performance log'd function ms duration in order to be uploaded
export const performanceReportsMinMS = parseInt(process.env.FRONVO_PERFORMANCE_REPORTS_MIN_MS) || -1;

// When using PM2 for production
export const cluster = decideBooleanEnvValue(process.env.TARGET_PM2, false);

// Directories/Files to check at startup
export const requiredStartupDirectories = [localDBDirectory];
export const requiredStartupFiles: [{[file: string]: RequiredStartupFile}] = [{localDBItem: {path: localDBPath, template: localDBTemplate}}];

// Blacklisted emails: https://github.com/disposable-email-domains/disposable-email-domains
export const blacklistedEmailDomains: string[] = blacklistedEmailDomainsEnabled && require(resolve(generatedFilesDirectory, 'disposable_email_blocklist.json'));

export const silentLogging = decideBooleanEnvValue(process.env.FRONVO_SILENT_LOGGING, false)

// The local virtualised Mongo database
export const localDB: {[dbName: string]: {}[]} = localMode && localSave && existsSync(localDBPath) ? require(localDBPath) : localDBTemplate;

// The MongoDB client, set below dynamically
export let mdb: Db;

export function setMDB(newMDB: Db): void {
    mdb = newMDB;
}