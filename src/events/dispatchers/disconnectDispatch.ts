// ******************** //
// The disconnect dispatcher file which handles disconnections.
// ******************** //

import { ClientToServerEvents } from 'interfaces/events/c2s';
import { InterServerEvents } from 'interfaces/events/inter';
import { ServerToClientEvents } from 'interfaces/events/s2c';
import * as variables from 'variables/global';
import { Server, Socket } from 'socket.io';
import utilities from 'utilities/all';

export default async function disconnectDispatch(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>,
    socket: Socket<ServerToClientEvents, ClientToServerEvents>,
    reason: string
): Promise<void> {
    // Logout if logged in
    if (utilities.isSocketLoggedIn(socket)) {
        utilities.logoutSocket(io, socket);
    }

    console.log('Socket ' + socket.id + ' has disconnected.');

    // Cleanup and exit process when the test client disconnects
    if (variables.testMode) {
        // Delete all collections
        await variables.prismaClient.account.deleteMany({});
        await variables.prismaClient.post.deleteMany({});
        await variables.prismaClient.token.deleteMany({});
        await variables.prismaClient.log.deleteMany({});
        await variables.prismaClient.report.deleteMany({});

        process.exit();
    }
}
