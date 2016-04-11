import config from './config';
import Server from './lib/server/Server';
import restify from 'restify';
import cors from 'cors';
import path from 'path';

const server = new Server(config.server);

// setup CORS
server.handler.use(
	cors()
);

// setup static app routes
server.handler.get(/\/apps\/?.*/, restify.serveStatic({
	directory: path.join(__dirname, './'),
	default: 'index.html'
}));

server.start(config.server.port);