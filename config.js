import path from 'path';
import bunyan from 'bunyan';
import BunyanSlack from 'bunyan-slack';

export const cumulocity = {
	apiUrl: 'https://telia.cumulocity.com'
};

export const server = {
	port: 80,
	controllersDirectory: path.join(__dirname, 'controllers')
};

export const slack = {
	url: 'https://hooks.slack.com/services/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'
};

export const logger = {
	name: 'cumulocity',
	serializers: {
		...bunyan.stdSerializers
	},
	streams: [{
		stream: process.stdout,
		level: 'info'
	}, {
		type: 'rotating-file',
		path: 'logs/log.txt',
		period: '1d',
		count: 3,
		level: 'info'
	}, {
		stream: new BunyanSlack({
			webhook_url: slack.url, // eslint-disable-line camelcase
			channel: '#test',
			username: 'Cumulocity.Error'
		}),
		level: 'error'
	}]
};

export default {
	cumulocity,
	server,
	slack,
	logger
};