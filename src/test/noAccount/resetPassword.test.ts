// ******************** //
// The test file for the resetPassword event.
// ******************** //

import { TestArguments, TestErrorCallback } from 'interfaces/test';
import shared, { setTestVariable } from 'test/shared';
import {
    assertCode,
    assertEquals,
    assertError,
    assertErrors,
    generateChars,
    generateEmail,
    generatePassword,
} from 'test/utilities';

function required(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: '',
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'REQUIRED') ||
                    assertEquals({ for: err.extras.for }, 'email')
            );
        }
    );
}

function lengthEmailMin(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: generateEmail().substring(0, 1) + '@g.co',
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'email')
            );
        }
    );
}

function lengthEmailMax(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: generateChars(120) + '@gmail.com',
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'email')
            );
        }
    );
}

function invalidEmailFormat(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: generateEmail().replace(/@/, ''),
        },
        ({ err }) => {
            callback(assertCode(err.code, 'REQUIRED'));
        }
    );
}

function accountDoesntExist(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: generateEmail(),
        },
        ({ err }) => {
            callback(assertCode(err.code, 'ACCOUNT_404'));
        }
    );
}

function resetPassword(
    { socket, done }: TestArguments,
    callback: TestErrorCallback
): void {
    socket.emit(
        'resetPassword',
        {
            email: shared.email,
        },
        ({ err }): void => {
            callback(assertError({ err }));

            socket.emit(
                'resetPasswordVerify',
                { code: '123456' },
                ({ err }) => {
                    callback(assertError({ err }));

                    const newPassword = generatePassword();

                    socket.emit(
                        'resetPasswordFinal',
                        { newPassword },
                        ({ err }) => {
                            callback(assertError({ err }));

                            // Relogin with updated shared variable
                            setTestVariable('password', newPassword);

                            socket.emit(
                                'login',
                                {
                                    email: shared.email,
                                    password: shared.password,
                                },
                                ({ err, token }) => {
                                    callback(assertError({ err }));

                                    // Token is revoked, update
                                    setTestVariable('token', token);

                                    done();
                                }
                            );
                        }
                    );
                }
            );
        }
    );
}

export default (testArgs: TestArguments): void => {
    assertErrors(
        {
            required,
            lengthEmailMin,
            lengthEmailMax,
            invalidEmailFormat,
            accountDoesntExist,
        },
        testArgs,
        resetPassword
    );
};
