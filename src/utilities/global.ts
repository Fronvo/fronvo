// ******************** //
// Reusable functions for all kinds of events to avoid repetition.
// ******************** //

import { EzierValidatorError, StringSchema } from '@ezier/validate';
import gmail from 'gmail-send';
import { FronvoError, LoggedInSocket } from 'interfaces/all';
import { ClientToServerEvents } from 'interfaces/events/c2s';
import { InterServerEvents } from 'interfaces/events/inter';
import { ServerToClientEvents } from 'interfaces/events/s2c';
import errors from 'other/errors';
import { Errors } from 'other/types';
import { Server, Socket } from 'socket.io';
import { format } from 'util';
import { v4 } from 'uuid';
import * as variables from 'variables/global';
import { prismaClient } from 'variables/global';

export function loginSocket(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    accountId: string
): void {
    variables.loggedInSockets[socket.id] = { accountId };

    // Update other servers in cluster mode
    if (variables.cluster) {
        io.serverSideEmit('loginSocket', {
            socketId: socket.id,
            socketIP: socket.handshake.address,
            accountId,
        });
    }
}

export function logoutSocket(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
): void {
    if (variables.cluster) {
        io.serverSideEmit('logoutSocket', {
            socketId: socket.id,
        });
    }

    delete variables.loggedInSockets[socket.id];
}

export function isSocketLoggedIn(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
): boolean {
    return socket.id in variables.loggedInSockets;
}

export function isAccountLoggedIn(accountId: string): boolean {
    for (const socketKeyIndex in variables.loggedInSockets) {
        if (getSocketAccountId(socketKeyIndex) == accountId) {
            return true;
        }
    }

    return false;
}

export function getSocketAccountId(socketId: string): string {
    return variables.loggedInSockets[socketId].accountId;
}

export function getLoggedInSockets(): { [socketId: string]: LoggedInSocket } {
    return variables.loggedInSockets;
}

export function reportStart(reportName: string): string {
    if (!variables.performanceReportsEnabled) return;

    // Mantain uniqueness regardless of reportName
    const reportUUID = v4();

    variables.performanceReports[reportUUID] = {
        reportName,
        timestamp: new Date(),
    };

    // Return it for reportEnd
    return reportUUID;
}

export async function reportEnd(reportUUID: string): Promise<void> {
    if (
        !variables.performanceReportsEnabled ||
        !(reportUUID in variables.performanceReports)
    )
        return;

    // Basically copy the dictionary
    const reportDict = variables.performanceReports[reportUUID];

    const msDuration =
        new Date().getMilliseconds() - reportDict.timestamp.getMilliseconds();

    // Check if it passes the min report MS duration (optional)
    if (msDuration >= variables.performanceReportsMinMS) {
        prismaClient.report.create({
            data: {
                reportName: `${reportDict.reportName} took ${msDuration}ms.`,
            },
        });
    }

    // Delete to save memory
    delete variables.performanceReports[reportUUID];
}

export function getErrorCode(errName: Errors): number {
    return Object.keys(errors).indexOf(errName) + 1;
}

export function getErrorKey(errCode: number): Errors {
    // @ts-ignore
    // It is an Errors string
    return Object.keys(errors).at(errCode - 1);
}

export function generateError(
    name: Errors,
    extras?: { [key: string]: any },
    formatParams?: any[]
): FronvoError {
    let msg: string = errors[name];

    if (formatParams) msg = format(msg, ...formatParams);

    const err: FronvoError = {
        err: {
            msg,
            code: getErrorCode(name),
            name,
        },
    };

    if (extras) err.err.extras = extras;

    return err;
}

export async function getToken(profileId: string): Promise<string> {
    const tokenItem = await prismaClient.token.findFirst({
        where: {
            profileId,
        },
    });

    if (tokenItem) {
        return tokenItem.token;
    }

    const token = v4();

    await prismaClient.token.create({
        data: {
            profileId,
            token,
        },
    });

    return token;
}

export async function revokeToken(profileId: string): Promise<void> {
    await prismaClient.token.delete({
        where: {
            profileId,
        },
    });
}

export function generateNumbers(
    from: number,
    to: number,
    times: number
): string {
    let generatedNumbers = '';

    for (let i = 0; i < times; i++) {
        generatedNumbers += Math.floor(Math.random() * (to - from + 1)) + from;
    }

    return generatedNumbers;
}

export async function sendEmail(
    to: string,
    subject: string,
    content: string[]
): Promise<void> {
    if (
        !variables.emailUsername ||
        !variables.emailPassword ||
        variables.testMode
    ) {
        return;
    }

    let finalHtml = '';

    for (const contentStrIndex in content) {
        finalHtml += `
<h1 align='center'>
    ${content[contentStrIndex]}
</h1>
`;
    }

    const send = gmail({
        user: variables.emailUsername,
        pass: variables.emailPassword,
        to,
        subject,
        html: `
<div>
    <p align='center'>
        <a href='https://fronvo.herokuapp.com'><img src='https://raw.githubusercontent.com/Fronvo/server/master/.github/email/fronvo-logo-large.png'></a>
    </p>

    ${finalHtml}

</div>
`,
    });

    await send();
}

export function validateSchema(
    schema: StringSchema,
    schemaArgs: { [key: string]: any }
): FronvoError | undefined {
    // Only need the first error
    const schemaResults = schema.validate(schemaArgs);
    let result: EzierValidatorError;

    // Find the FIRST needed error, mustn't be an empty optional param result
    for (const errorResultIndex in schemaResults) {
        const optionalParam =
            schema.schema[schemaResults[errorResultIndex].extras.key].optional;

        if (optionalParam) {
            if (!(schemaResults[errorResultIndex].name == 'STRING_REQUIRED')) {
                result = schemaResults[errorResultIndex];
            }
        } else {
            // Not optional, legit error
            result = schemaResults[errorResultIndex];
        }

        // Continue with first valid error
        if (result) break;
    }

    // None found, success
    if (!result) return;

    const key = result.extras.key;
    const extras: { [key: string]: any } = { for: key };
    const optional = schema.schema[key].optional;

    // Different checks explained
    // For example an optional avatar key which is '' will NOT be returning a REQUIRED error and will be skipped above
    // But if that key is 'a', it WILL return the above error
    // Basically allow the events themselves to handle empty optional arguments / validate if needed
    if (!optional || (optional && key.length > 0)) {
        switch (result.name) {
            case 'STRING_REQUIRED':
                return generateError('REQUIRED', extras, [key]);

            case 'STRING_INVALID_LENGTH':
                return generateError('EXACT_LENGTH', extras, [
                    key,
                    schema.schema[key].length,
                ]);

            case 'STRING_INVALID_MIN_LENGTH':
            case 'STRING_INVALID_MAX_LENGTH':
                const min = schema.schema[key].minLength;
                const max = schema.schema[key].maxLength;

                return generateError('LENGTH', { ...extras, min, max }, [
                    key,
                    min,
                    max,
                ]);

            case 'STRING_INVALID_TYPE':
                switch (result.extras.type) {
                    case 'email':
                        return generateError('REQUIRED_EMAIL', extras);

                    case 'uuid':
                        return generateError('REQUIRED_UUID', extras);

                    default:
                        return generateError('UNKNOWN');
                }

            case 'STRING_INVALID_REGEX':
                return generateError('INVALID_REGEX', extras, [key]);

            default:
                return generateError('UNKNOWN');
        }
    }
}
