import Router from "./router.js";
import { pkdService, tlService } from "../services/index.js";
import APIError from "../util/error.js";


export default class PKIRouter extends Router {

  constructor( logger ) {
    super( logger );
  }

  init() {
    this.get( '/pkd', 'PUBLIC', this.pkdList );
    this.get( '/pkd/:address/entities', 'PUBLIC', this.pkdEntities );
    this.post( '/pkd/deploy', 'PUBLIC', this.pkdDeploy );
    this.post( '/pkd/:address/register', 'PUBLIC', this.pkdRegister );
    this.delete( '/pkd/:address/revoke/:entity', 'PUBLIC', this.pkdRevoke );

    this.get( '/tl', 'PUBLIC', this.tlList );
    this.get( '/tl/:address/entities', 'PUBLIC', this.tlEntities );
    this.post( '/tl/deploy', 'PUBLIC', this.tlDeploy );
    this.post( '/tl/:address/register', 'PUBLIC', this.tlRegister );
    this.delete( '/tl/:address/revoke/:entity', 'PUBLIC', this.tlRevoke );
  }

  async pkdList() {
    const directories = await pkdService.getAll();
    return directories.map( pkd => pkd.address );
  }

  async pkdEntities( req ) {
    const { address } = req.params;
    const pkd = await pkdService.getPKD( address );
    if( !pkd ) throw new APIError( "PKD not found or invalid address", 1, 404  );
    return await pkdService.getEntities( pkd );
  }

  async pkdDeploy() {
    return await pkdService.deploy();
  }

  async pkdRegister( req ) {
    const { address } = req.params;
    const entity = req.body;
    //const pkd = await pkdService.getPKD( address );
    //if( !pkd ) throw new APIError( "PKD not found or invalid address", 1, 404 );
    return pkdService.registerEntity( { address }, entity );
  }

  async pkdRevoke( req ) {
    const { address, entity } = req.params;
    const pkd = await pkdService.getPKD( address );
    if( !pkd ) throw new APIError( "PKD not found or invalid address", 1, 404 );
    return await pkdService.revokeEntity( pkd, entity );
  }

  async tlList() {
    const lists = await tlService.getAll();
    return lists.map( list => ({ address: list.address, parent: list.parent, name: list.name }) );
  }

  async tlEntities( req ) {
    const { address } = req.params;
    const tl = await tlService.getTL( address );
    if( !tl ) throw new APIError( "TL not found or invalid address", 1, 404  );
    return await tlService.getEntities( tl );
  }

  async tlDeploy( req ) {
    const { parent, name } = req.body;
    return await tlService.deploy( parent, name );
  }

  async tlRegister( req ) {
    const { address } = req.params;
    const entity = req.body;
    const tl = await tlService.getTL( address );
    if( !tl ) throw new APIError( "TL not found or invalid address", 1, 404  );
    return tlService.registerEntity( tl, entity );
  }

  async tlRevoke( req ) {
    const { address, entity } = req.params;
    const tl = await tlService.getTL( address );
    return await tlService.revokeEntity( tl, entity );
  }

}
