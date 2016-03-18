import serveStatic from 'serve-static';
import config from './config';
import Server from './lib/server/Server';
import logger from './lib/logger';

const log = logger.get(__filename, { env: 'dev' });

log('bootstrapping', 123, { 'a': 1 });


const server = new Server();

server.setupDefault();

// serve static files from apps
server.app.use(serveStatic('apps', {
	index: 'index.html'
}));

server.get('/test', (req, res) => {
	res.send('test response');
});

server.start(config.server.port);