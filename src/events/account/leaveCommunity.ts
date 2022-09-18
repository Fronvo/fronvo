// ******************** //
// The leaveCommunity account-only event file.
// ******************** //

import {
    LeaveCommunityParams,
    LeaveCommunityServerParams,
} from 'interfaces/account/leaveCommunity';
import { EventTemplate, FronvoError } from 'interfaces/all';
import { generateError, getSocketAccountId } from 'utilities/global';
import { prismaClient } from 'variables/global';

async function leaveCommunity({
    socket,
}: LeaveCommunityServerParams): Promise<LeaveCommunityParams | FronvoError> {
    const accountData = await prismaClient.account.findFirst({
        where: {
            profileId: getSocketAccountId(socket.id),
        },
    });

    if (!accountData.isInCommunity) {
        return generateError('NOT_IN_COMMUNITY');
    }

    const community = await prismaClient.community.findFirst({
        where: {
            communityId: accountData.communityId,
        },
    });

    // Finally, leave / delete the community
    if (accountData.profileId == community.ownerId) {
        // First of all, remove all references to this community from the members
        await prismaClient.account.updateMany({
            where: {
                communityId: accountData.communityId,
            },

            data: {
                communityId: '',
                isInCommunity: false,
            },
        });

        // Then, delete the community
        await prismaClient.community.delete({
            where: {
                communityId: accountData.communityId,
            },
        });
    } else {
        // First, remove references to this community from the member's account
        await prismaClient.account.update({
            where: {
                profileId: accountData.profileId,
            },

            data: {
                communityId: '',
                isInCommunity: false,
            },
        });

        // Then, update the member from the community's members array

        // Set in-place
        const newMembers = community.members;

        // Remove current member
        newMembers.splice(newMembers.indexOf(accountData.profileId), 1);

        await prismaClient.community.update({
            where: {
                communityId: accountData.communityId,
            },

            data: {
                members: newMembers,
            },
        });
    }

    return {};
}

const leavecommunityTemplate: EventTemplate = {
    func: leaveCommunity,
    template: [],
    points: 5,
};

export default leavecommunityTemplate;