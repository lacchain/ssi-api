import ethers from "ethers";
import moment from "moment";
import PKI from '../model/pki.js';
import { PKD_CONTRACT, PKD_CONTRACT_GAS, signer } from "../util/contracts.js";
import config from "../config.js";

export default class PKDService {

  async deploy() {
    const PDKContract = config.network.nodeAddress ?
      new ethers.ContractFactory( PKD_CONTRACT_GAS.abi, PKD_CONTRACT_GAS.bytecode, signer ) :
      new ethers.ContractFactory( PKD_CONTRACT.abi, PKD_CONTRACT.bytecode, signer );
    const pkd = await PDKContract.deploy( { gasPrice: 0 } );
    const receipt = await pkd.deployTransaction.wait();
    const pki = new PKI( { kind: 'PKD', address: receipt.contractAddress, hash: receipt.transactionHash } );
    await pki.save();
    return {
      address: receipt.contractAddress,
      hash: receipt.transactionHash
    };
  }

  async getAll() {
    return PKI.find( { kind: 'PKD' } );
  }

  async getPKD( address ) {
    return PKI.findOne( { kind: 'PKD', address } );
  }

  async getEntities( pkd ) {
    if( !pkd ) return [];
    const contract = config.network.nodeAddress ?
      new ethers.Contract( pkd.address, PKD_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( pkd.address, PKD_CONTRACT.abi, signer );
    const entities = [];
    for( const e of pkd.entities ) {
      const entity = await contract.publicKeys( e );
      entities.push( {
        address: e,
        did: entity[0],
        expires: moment( parseInt( entity[1].toString() ) * 1000 ).format( 'DD/MM/YYYY HH:mm:sss' ),
        status: entity[2] === 1 ? 'active' : 'revoked'
      } );
    }
    return entities;
  }

  async registerEntity( pkd, { address, did, expires } ) {
    const contract = config.network.nodeAddress ?
      new ethers.Contract( pkd.address, PKD_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( pkd.address, PKD_CONTRACT.abi, signer );
    const tx = await contract.register( address, did, expires );
    pkd.entities.push( address );
    await pkd.save();
    return { hash: tx.hash };
  }

  async revokeEntity( pkd, address ) {
    const contract = config.network.nodeAddress ?
      new ethers.Contract( pkd.address, PKD_CONTRACT_GAS.abi, signer ) :
      new ethers.Contract( pkd.address, PKD_CONTRACT.abi, signer );
    const tx = await contract.revoke( address );
    return tx.hash;
  }

}