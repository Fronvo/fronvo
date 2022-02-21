module.exports = {
    apps: [{
        // Customise to your liking if you have to (you shouldn't most likely)

        script: 'main/server.js',
        instances: process.env.FRONVO_PM2_INSTANCES || '1',
        exec_mode: 'cluster',
        max_memory_restart: process.env.FRONVO_PM2_MEM || '1G',
        autorestart: true,
        max_restarts: 5,
        env: {"TARGET_PM2": true},
        node_args: "--nouse-idle-notification"
    }]
}