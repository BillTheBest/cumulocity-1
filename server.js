import { server as config } from './config';
import Server from './lib/server/Server';
import logger from './lib/log';

const log = logger.get('server');

log('bootstrapping');

const server = new Server();

server.performDefaultSetup();

server.get('/test', (req, res) => {
	res.send('test response');
});

server.start(config.port);