// ******************** //
// The updateProfileData account-only event file.
// ******************** //

import { StringSchema } from '@ezier/validate';
import {
    communityIdOptionalSchema,
    communityNameOptionalSchema,
} from 'events/shared';
import {
    UpdateCommunityDataResult,
    UpdateCommunityDataServerParams,
} from 'interfaces/account/updateCommunityData';
import { EventTemplate, FronvoError } from 'interfaces/all';
import { generateError, getSocketAccountId } from 'utilities/global';
import { prismaClient } from 'variables/global';

async function updateCommunityData({
    io,
    socket,
    communityId,
    name,
    description,
    icon,
    chatRequestsEnabled,
}: UpdateCommunityDataServerParams): Promise<
    UpdateCommunityDataResult | FronvoError
> {
    // If none provided, return immediately
    if (
        !communityId &&
        !name &&
        !description &&
        description != '' &&
        !icon &&
        icon != '' &&
        chatRequestsEnabled == undefined
    ) {
        return {
            err: undefined,
        };
    }

    // Name validation not needed here, see schema below
    // Nor icon, may need for content-type and extension if applicable (|| ?)

    // Check community id availability
    if (communityId) {
        const communityIdData = await prismaClient.community.findFirst({
            where: {
                communityId,
            },
        });

        if (communityIdData) {
            return generateError('INVALID_COMMUNITY_ID');
        }
    }

    if (chatRequestsEnabled) {
        if (typeof chatRequestsEnabled != 'boolean') {
            return generateError('NOT_BOOLEAN');
        }
    }

    // Fetch old community id
    const accountData = await prismaClient.account.findFirst({
        where: {
            profileId: getSocketAccountId(socket.id),
        },

        select: {
            communityId: true,
        },
    });

    const previousCommunity = await prismaClient.community.findFirst({
        where: {
            communityId: accountData.communityId,
        },
    });

    const communityData = await prismaClient.community.update({
        data: {
            communityId,
            name,
            icon,
            chatRequestsEnabled,
        },

        where: {
            communityId: previousCommunity.communityId,
        },

        select: {
            communityId: true,
            name: true,
            icon: true,
            chatRequestsEnabled: true,
        },
    });

    if (communityId) {
        // Update related entries

        // Update accounts
        await prismaClient.account.updateMany({
            where: {
                communityId: previousCommunity.communityId,
            },

            data: {
                communityId,
            },
        });

        // Update messages
        await prismaClient.communityMessage.updateMany({
            where: {
                communityId: previousCommunity.communityId,
            },

            data: {
                communityId,
            },
        });
    }

    // Send chat request update if updated
    if (previousCommunity.chatRequestsEnabled != chatRequestsEnabled) {
        io.to(communityData.communityId).emit('communityChatRequestsUpdated', {
            state: chatRequestsEnabled,
        });
    }

    return { communityData };
}

const updateCommunityDataTemplate: EventTemplate = {
    func: updateCommunityData,
    template: ['communityId', 'name', 'icon', 'chatRequestsEnabled'],
    schema: new StringSchema({
        ...communityIdOptionalSchema,

        ...communityNameOptionalSchema,

        icon: {
            // Ensure https
            regex: /^(https:\/\/).+$/,
            maxLength: 512,
            optional: true,
        },

        chatRequestsEnabled: {
            optional: true,
        },
    }),
};

export default updateCommunityDataTemplate;
