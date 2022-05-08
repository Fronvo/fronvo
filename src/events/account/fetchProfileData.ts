// ******************** //
// The fetchProfileData account-only event file.
// ******************** //

import { StringSchema } from '@ezier/validate';
import { AccountData } from '@prisma/client';
import {
    FetchProfileDataResult,
    FetchProfileDataServerParams,
} from 'interfaces/account/fetchProfileData';
import { EventTemplate, FronvoAccount, FronvoError } from 'interfaces/all';
import {
    findDocuments,
    generateError,
    getSocketAccountId,
} from 'utilities/global';

async function fetchProfileData({
    socket,
    profileId,
}: FetchProfileDataServerParams): Promise<
    FetchProfileDataResult | FronvoError
> {
    const accounts: { accountData: AccountData }[] = await findDocuments(
        'Account',
        { select: { accountData: true } }
    );

    for (const account in accounts) {
        const accountData = accounts[account].accountData;

        // If target account id isn't what were looking for, move on
        if (accountData.id != profileId) continue;

        // Dont spread the dictionary, only provide select info
        const finalAccountData: Partial<FronvoAccount> = {
            username: accountData.username,
            creationDate: accountData.creationDate,
        };

        // If it's the user's profile, provide more details (better than having 2 seperate events)
        if (profileId == getSocketAccountId(socket.id)) {
            finalAccountData.email = accountData.email;
        }

        return {
            profileData: finalAccountData,
        };
    }

    return generateError('PROFILE_NOT_FOUND');
}

const fetchProfileDataTemplate: EventTemplate = {
    func: fetchProfileData,
    template: ['profileId'],
    points: 3,
    schema: new StringSchema({
        profileId: {
            minLength: 5,
            maxLength: 14,
            regex: /^[a-z0-9]+$/,
        },
    }),
};

export default fetchProfileDataTemplate;
