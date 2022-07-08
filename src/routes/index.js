import Router from "./router.js";
import swaggerDocument from '../resources/swagger.json';

export default class IndexRouter extends Router {

	constructor( logger ) {
		super( logger );
	}

	init() {
		this.swagger( '/', swaggerDocument );
	}
}