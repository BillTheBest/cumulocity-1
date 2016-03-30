import path from 'path';
import restify from 'restify';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from '../logger';

const log = logger.get(__filename);

export const Method = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT'
};

export default class Server {

	static Method = Method;

	constructor(serverConfig = {}) {
		// create the server app
		this.server = restify.createServer(serverConfig);

		this.statistics = {
			requestCount: 0
		};
	}

	setupDefault() {
		log('performing default setup');

		this.setupCurlSupport();
		this.setupCors();
		this.setupBodyParser();
		this.setupGlobalRoute();
		this.setupIndexRoute();
		this.setupAppRoutes();

		return this;
	}
	
	setupCurlSupport() {
		this.server.pre(restify.pre.userAgentConnection());
	}

	setupCors() {
		log('setting up CORS');

		// allow cors from all requests
		this.server.use(cors());
	}

	setupBodyParser() {
		log('setting up body parser');

		// use json body parser
		this.server.use(bodyParser.json({
			limit: '1mb'
		}));
	}

	setupGlobalRoute() {
		log('setting up global route');

		this.server.use((req, res, next) => {
			this.updateStatistics(req, res);

			next();
		});
	}

	setupIndexRoute() {
		log('setting up index route');

		this.register('index', Method.GET, '/', (req, res) => {
			res.send('index route response: ' + this.statistics.requestCount);
		});
	}

	setupAppRoutes() {
		log('setting up app routes');

		this.server.get(/\/apps\/?.*/, restify.serveStatic({
			directory: path.join(__dirname, '../..'),
			default: 'index.html'
		}));
	}

	updateStatistics(/* req, res */) {
		this.statistics.requestCount++;
	}

	use(...args) {
		return this.server.use(...args);
	}

	start(port) {
		log('starting server on port ' + port);

		// start the server
		this.server.listen(port, () => {
			log('server started on port ' + port);
		});

		return this;
	}

	register(name, method = Server.Method.GET, handlerPath, callback) {
		log('registering route "' + name + '" to ' + method + ' ' + handlerPath);

		this.server[method.toLowerCase()]({
			name: name,
			path: handlerPath
		}, callback);
	}

	// logs the request info to console
	logRequest(req) {
		let message = req.method + ' ' + req.url;

		if (req.body) {
			message += '\n' + JSON.stringify(req.body, null, '  ') + '\n\n';
		}

		log.info(message);
		// log.info({ req: req }, message);
	}

}