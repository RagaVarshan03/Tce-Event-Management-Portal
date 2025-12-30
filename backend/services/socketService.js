const socketIO = require('socket.io');

let io;

const init = (server) => {
    io = socketIO(server, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Student/Coordinator connected: ${socket.id}`);

        socket.on('joinEvent', (eventId) => {
            socket.join(`event_${eventId}`);
            console.log(`[Socket] User joined room: event_${eventId}`);
        });

        socket.on('leaveEvent', (eventId) => {
            socket.leave(`event_${eventId}`);
            console.log(`[Socket] User left room: event_${eventId}`);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] User disconnected');
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { init, getIO };
