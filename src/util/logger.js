import winston from "winston";
import config from "../config.js";

export default class Logger {

	instance() {
		const level = config.logger.level;
		return winston.createLogger( {
			transports: [
				new winston.transports.Console( {
					level,
					handleExceptions: true,
					json: true,
					colorize: true
				} )
			],
			silent: level === 'none'
		} );

	}
}