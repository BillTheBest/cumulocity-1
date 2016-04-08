import config from './config';
import Server from './lib/server/Server';
import cors from 'cors';

const server = new Server(config.server);

// setup CORS
server.use(
	cors()
);

server.start(config.server.port);