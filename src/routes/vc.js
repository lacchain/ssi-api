import Router from "./router.js";
import { vcService } from "../services/index.js";
import { buildRedClaraCredential, buildVerifiablePresentation, buildW3CVaccinationCredential } from "../util/vc.js";
import config from "../config.js";
import APIError from "../util/error.js";
import { buildCediaVC, buildCUDIVC, buildRedClaraVC, buildSerenaVC } from "../util/pdf.js";
import { sendVC } from "../util/mailbox.js";
import fs from "fs";

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
    this.post( '/education/serena', 'PUBLIC', this.issueSerena );
    this.post( '/education/cedia', 'PUBLIC', this.issueCedia );
    this.post( '/education/redclara', 'PUBLIC', this.issueRedClara );
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
    const credential = buildW3CVaccinationCredential( config.account, data, trustedList );
    const vc = await vcService.issue( credential, claimsVerifier );
    await sendVC( config.account, vc.data.credentialSubject.id, vc.data );
    return { id: vc._id };
  }

  async issueEducation( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildRedClaraCredential( config.account, data, trustedList );
    const vc = await vcService.issue( credential, claimsVerifier );
    await sendVC( config.account, vc.data.credentialSubject.id, vc.data );
    return { id: vc._id };
  }

  async issueCUDI( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildRedClaraCredential( config.account, data, trustedList );
    const pdf = await buildCUDIVC( credential );
    const vc = await vcService.issue( credential, claimsVerifier );
    const presentation = buildVerifiablePresentation( credential, pdf );
    await sendVC( config.account, vc.data.credentialSubject.id, presentation ).catch(e=>console.error('err', e.message));
    return { id: vc._id };
  }

  async issueSerena( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildRedClaraCredential( config.account, data, trustedList );
    const pdf = await buildSerenaVC( credential );
    const vc = await vcService.issue( credential, claimsVerifier );
    const presentation = buildVerifiablePresentation( credential, pdf );
    await sendVC( config.account, vc.data.credentialSubject.id, presentation ).catch(e=>{
      console.error('err', e.message)
    });
    return { id: vc._id };
  }

  async issueCedia( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildRedClaraCredential( config.account, data, trustedList );
    const pdf = await buildCediaVC( credential );
    const vc = await vcService.issue( credential, claimsVerifier );
    const presentation = buildVerifiablePresentation( credential, pdf );
    await sendVC( config.account, vc.data.credentialSubject.id, presentation ).catch(e=>{
      console.error('err', e.message)
    });
    return { id: vc._id };
  }

  async issueRedClara( req ) {
    const { claimsVerifier, trustedList, data } = req.body;
    const credential = buildRedClaraCredential( config.account, data, trustedList );
    const pdf = await buildRedClaraVC( credential );
    const vc = await vcService.issue( credential, claimsVerifier );
    const presentation = buildVerifiablePresentation( credential, pdf );
    await sendVC( config.account, vc.data.credentialSubject.id, presentation ).catch(e=>{
      console.error('err', e.message)
    });
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