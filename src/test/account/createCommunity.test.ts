// ******************** //
// The test file for the createCommunity event.
// ******************** //

import { TestArguments, TestErrorCallback } from 'interfaces/test';
import * as shared from 'test/shared';
import {
    assertCode,
    assertEquals,
    assertError,
    assertErrors,
    assertNotEqual,
    assertType,
    generateChars,
} from 'test/utilities';

function lengthNameMin(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(2),
            description: generateChars(15),
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'name')
            );
        }
    );
}

function lengthNameMax(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(16),
            description: generateChars(15),
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'name')
            );
        }
    );
}

function lengthDescriptionMin(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(5),
            description: generateChars(4),
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'description')
            );
        }
    );
}

function lengthDescriptionMax(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(5),
            description: generateChars(51),
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'description')
            );
        }
    );
}

function lengthIconMax(
    { socket }: Partial<TestArguments>,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(5),
            description: generateChars(15),
            icon: `https://${generateChars(513)}`,
        },
        ({ err }) => {
            callback(
                assertCode(err.code, 'LENGTH') ||
                    assertEquals({ for: err.extras.for }, 'icon')
            );
        }
    );
}

function createCommunity(
    { socket, done }: TestArguments,
    callback: TestErrorCallback
): void {
    socket.emit(
        'createCommunity',
        {
            name: generateChars(5),
            description: generateChars(15),
            icon: `https://${generateChars(10)}`,
        },
        ({ err, communityData }): void => {
            callback(assertError({ err }));

            callback(
                assertType(
                    { communityId: communityData.communityId },
                    'string'
                ) ||
                    assertType({ ownerId: communityData.ownerId }, 'string') ||
                    assertType({ name: communityData.name }, 'string') ||
                    assertType(
                        { description: communityData.description },
                        'string'
                    ) ||
                    assertType({ icon: communityData.icon }, 'string') ||
                    assertNotEqual(
                        { creationDate: new Date(communityData.creationDate) },
                        'Invalid Date'
                    ) ||
                    assertType({ members: communityData.members }, 'object')
            );

            shared.setTestVariable(
                'createdCommunityId',
                communityData.communityId
            );
            shared.setTestVariable('createdCommunityName', communityData.name);

            done();
        }
    );
}

export default (testArgs: TestArguments): void => {
    assertErrors(
        {
            lengthNameMin,
            lengthNameMax,
            lengthDescriptionMin,
            lengthDescriptionMax,
            lengthIconMax,
        },
        testArgs,
        createCommunity
    );
};
