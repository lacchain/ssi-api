import Router from "./router.js";
import { registryService } from "../services/index.js";

export default class RegistryRouter extends Router {

  constructor( logger ) {
    super( logger );
  }

  init() {
    this.post( '/credentials/deploy', 'PUBLIC', this.deployRegistry );
    this.post( '/verifier/deploy', 'PUBLIC', this.deployVerifier );
    this.put( '/verifier/:address/issuer', 'PUBLIC', this.addIssuer );
  }

  async deployRegistry() {
    return registryService.deployCredentialRegistry();
  }

  async deployVerifier( req ) {
    const { credentialsRegistry } = req.body;
    return registryService.deployClaimsVerifier( credentialsRegistry );
  }

  async addIssuer( req ) {
    const { params: { address }, body: { issuer } } = req;
    return registryService.addIssuer( address, issuer );
  }

}