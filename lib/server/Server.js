import path from 'path';
import glob from 'glob';
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

	constructor(config = {}) {
		this.config = config;
		this.handler = restify.createServer(config);

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
		this.setupControllerRoutes();

		return this;
	}
	
	setupCurlSupport() {
		this.handler.pre(restify.pre.userAgentConnection());
	}

	setupCors() {
		log('setting up CORS');

		// allow cors from all requests
		this.handler.use(cors());
	}

	setupBodyParser() {
		log('setting up body parser');

		// use json body parser
		this.handler.use(bodyParser.json({
			limit: '1mb'
		}));
	}

	setupGlobalRoute() {
		log('setting up global route');

		this.handler.use((req, res, next) => {
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

		this.handler.get(/\/apps\/?.*/, restify.serveStatic({
			directory: path.join(__dirname, '../..'),
			default: 'index.html'
		}));
	}

	setupControllerRoutes() {
		const controllers = this.getControllersInDirectory(this.config.controllersDirectory);

		controllers.forEach((controller) => {
			this.register(controller.name, Method.GET, '/' + controller.name, (req, res, next) => {
				const response = controller.instance.get();

				res.send(response);

				next();
			});
		});

		log('controllers', controllers);
	}

	getControllersInDirectory(directory) {
		const controllersPattern = path.join(directory, '**/*.js');
		const controllerFilenames = glob.sync(controllersPattern);

		return controllerFilenames.map((controllerFilename) => {
			const controller = {
				name: 'user',
				handler: 'index',
				filename: controllerFilename,
				include: require(controllerFilename),
				instance: null
			};

			controller.instance = new controller.include.default(); // eslint-disable-line new-cap

			return controller;
		});
	}

	updateStatistics(/* req, res */) {
		this.statistics.requestCount++;
	}

	use(...args) {
		return this.handler.use(...args);
	}

	start(port) {
		log('starting server on port ' + port);

		// start the server
		this.handler.listen(port, () => {
			log('server started on port ' + port);
		});

		return this;
	}

	register(name, method = Server.Method.GET, handlerPath, callback) {
		log('registering route "' + name + '" to ' + method + ' ' + handlerPath);

		this.handler[method.toLowerCase()]({
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