import mongoose from "mongoose";
import VCService from "./vc.js";
import PKDService from "./pkd.js";
import TLService from "./tl.js";
import RegistryService from "./registry.js";
import DIDConnectService from "./didconnect.js";
import config from "../config.js";

export const initServices = async() => {
	console.log( 'Connecting to mongo', config.mongo.url );
	await mongoose.connect( config.mongo.url );
}

export const vcService = new VCService();
export const tlService = new TLService();
export const pkdService = new PKDService();
export const registryService = new RegistryService();
export const didconnectService = new DIDConnectService();