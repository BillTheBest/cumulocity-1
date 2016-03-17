import fs from 'fs';
import inquirer from 'inquirer';

export default {

	loadJSON(filename) {
		try {
			return JSON.parse(fs.readFileSync(filename, 'UTF8'));
		} catch (e) {
			return {};
		}
	},
	
	storeJSON(filename, data) {
		fs.writeFileSync(
			filename,
			JSON.stringify(data, null, '\t')
		);
	},
	
	prompt(questions) {
		return new Promise((resolve) => {
			inquirer.prompt(questions, (answers) => {
				resolve(answers);
			});
		});
	},
	
	getIsoDate() {
		return (new Date()).toISOString();
	}

};