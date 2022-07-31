// ******************** //
// The createPost account-only event file.
// ******************** //

import { StringSchema } from '@ezier/validate';
import {
    CreatePostResult,
    CreatePostServerParams,
} from 'interfaces/account/createPost';
import { EventTemplate, FronvoError } from 'interfaces/all';
import { getSocketAccountId } from 'utilities/global';
import { prismaClient } from 'variables/global';

async function createPost({
    socket,
    title,
    attachment,
    content,
}: CreatePostServerParams): Promise<CreatePostResult | FronvoError> {
    title = title.replace(/\n\n/g, '\n');
    content = content.replace(/\n\n/g, '\n');

    await prismaClient.post.create({
        data: {
            author: getSocketAccountId(socket.id),
            title,
            content,
            attachment,
        },
    });

    return {};
}

const updateProfileDataTemplate: EventTemplate = {
    func: createPost,
    template: ['title', 'content', 'attachment'],
    points: 5,
    schema: new StringSchema({
        title: {
            minLength: 5,
            maxLength: 30,
        },

        content: {
            minLength: 10,
            maxLength: 128,
        },

        attachment: {
            maxLength: 256,
            regex: /^(https:\/\/).+$/,
            optional: true,
        },
    }),
};

export default updateProfileDataTemplate;
