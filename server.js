import config from './config';
import Server from './lib/server/Server';

const server = new Server(config.server);

server.setupDefault();

server.register('test', Server.Method.GET, '/test', (req, res) => {
	res.send('test response');
});

server.start(config.server.port);