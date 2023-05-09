import ethers from "ethers";
import moment from "moment";
import config from "../config.js";
import { TL_CONTRACT, signer, TL_CONTRACT_GAS } from "../util/contracts.js";
import PKI from "../model/pki.js";

export default class TLService {

  async deploy( parent, name ) {
    const TLContract = config.network.nodeAddress ?
      new ethers.ContractFactory( TL_CONTRACT_GAS.abi, TL_CONTRACT_GAS.bytecode, signer ) :
      new ethers.ContractFactory( TL_CONTRACT.abi, TL_CONTRACT.bytecode, signer );
    const tl = await TLContract.deploy( parent, name, { gasPrice: 0 } );
    const receipt = await tl.deployTransaction.wait();
    const pki = new PKI( { kind: 'TL', parent, name, address: receipt.contractAddress, hash: receipt.transactionHash } );
    await pki.save();
    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async getAll() {
    return PKI.find( { kind: 'TL' } );
  }

  async getTL( address ){
    return PKI.findOne({ kind: 'TL', address });
  }

  async getEntities( tl ){
    if( !tl ) return [];
    const contract = config.network.nodeAddress ?
      new ethers.Contract( tl.address, TL_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( tl.address, TL_CONTRACT.abi, signer );
    const entities = [];
    for( const e of tl.entities ){
      const entity = await contract.entities( e );
      entities.push( {
        address: e,
        name: entity[0],
        did: entity[1],
        expires: moment( parseInt( entity[2].toString() ) * 1000 ).format( 'DD/MM/YYYY HH:mm:sss' ),
        status: entity[3] === 1 ? 'active' : 'revoked',
      } );
    }
    return entities;
  }

  async registerEntity( tl, { address, did, name, expires } ) {
    const contract = config.network.nodeAddress ?
      new ethers.Contract( tl.address, TL_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( tl.address, TL_CONTRACT.abi, signer );
    const tx = await contract.register( address, did, name, expires );
    tl.entities.push( address );
    await tl.save();
    return { hash: tx.hash };
  }

  async revokeEntity( tl, address ) {
    const contract = config.network.nodeAddress ?
      new ethers.Contract( tl.address, TL_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( tl.address, TL_CONTRACT.abi, signer );
    const tx = await contract.revoke( address );
    return { hash: tx.hash };
  }

  async getRootOfTrust() {
    const users = await User.find( {} );
    const getChilds = parent => users
        .filter( u => u.trustedList === parent )
        .map( u => !u.adminOf ?
            ( { name: u.name, address: u.address, status: u.status, childs: [] } ) :
            ( { name: u.name, address: u.adminOf, status: u.status, childs: getChilds( u.adminOf ) } )
        );
    return getChilds( config.pkd.RACSEL );
  }

}