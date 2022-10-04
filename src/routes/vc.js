import Router from "./router.js";
import { vcService } from "../services/index.js";
import { buildEducationCredential, buildVaccinationCredential, buildVerifiablePresentation } from "../util/vc.js";
import config from "../config.js";
import APIError from "../util/error.js";
import { fillFields } from "../util/pdf.js";
import { sendVC } from "../util/mailbox.js";

export default class VCRouter extends Router {

  constructor( logger ) {
    super( logger );
  }

  init() {
    this.get( '/', 'PUBLIC', this.list );
    this.get( '/:id', 'PUBLIC', this.getVC );
    this.post( '/verify', 'PUBLIC', this.verify );
    this.post( '/vaccination', 'PUBLIC', this.issueVaccination );
    this.post( '/education', 'PUBLIC', this.issueEducation );
    this.post( '/education/cudi', 'PUBLIC', this.issueCUDI );
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

  async issueVaccination( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildVaccinationCredential( config.account, data, trustedList );
    const vc = await vcService.issue( credential, claimsVerifier );
    await sendVC( config.account, vc.data.credentialSubject.id, vc.data );
    return { id: vc._id };
  }

  async issueEducation( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildEducationCredential( config.account, data, trustedList );
    const vc = await vcService.issue( credential, claimsVerifier );
    await sendVC( config.account, vc.data.credentialSubject.id, vc.data );
    return { id: vc._id };
  }

  async issueCUDI( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildEducationCredential( config.account, data, trustedList );
    const pdf = await fillFields( credential );
    const vc = await vcService.issue( credential, claimsVerifier );
    const presentation = buildVerifiablePresentation( credential, pdf );
    await sendVC( config.account, vc.data.credentialSubject.id, presentation ).then( r=>console.log('success', r) ).catch(e=>console.error('err', e));
    return { id: vc._id };

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