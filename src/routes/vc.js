import Router from "./router.js";
import { vcService } from "../services/index.js";
import { buildVaccinationCredential } from "../util/vc.js";
import config from "../config.js";
import APIError from "../util/error.js";

export default class VCRouter extends Router {

  constructor( logger ) {
    super( logger );
  }

  init() {
    this.get( '/', 'PUBLIC', this.list );
    this.get( '/:id', 'PUBLIC', this.getVC );
    this.post( '/verify', 'PUBLIC', this.verify );
    this.post( '/', 'PUBLIC', this.issue );
    this.delete( '/:id', 'PUBLIC', this.revoke );
  }

  async list() {
    const credentials = await vcService.list();
    return credentials.map( credential => ( {
      id: credential._id,
      status: credential.status,
      claimsVerifier: credential.verifier
    } ) );
  }

  async getVC( req ) {
    const { id } = req.params;
    const vc = await vcService.getById( id );
    if( !vc ) throw new APIError( "VC not found", 404 )
    return {
      id: vc._id,
      status: vc.status,
      claimsVerifier: vc.verifier,
      credential: vc.data,
      createdAt: vc.created_at,
      revokedAt: vc.revokedAt,
    }
  }

  async issue( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildVaccinationCredential( config.account, data, trustedList );
    return await vcService.issue( credential, claimsVerifier );
  }

  async verify( req ){
    return vcService.verify( req.body );
  }

  async revoke( req ) {
    const { id } = req.params;
    const vc = await vcService.getById( id );
    if( !vc ) throw new APIError( "VC not found", 404 )
    return await vcService.revoke( vc );
  }

}