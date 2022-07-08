import fs from 'fs'
import pdf from "pdf-lib";
import path from "path";
import moment from "moment";
import { gzip } from "pako";
import qrcode from "qrcode";

export async function extractFields() {
  const file = `${path.resolve()}/src/util/vaccination_template.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  return pdfDoc.getForm().getFields().map( f => f.getName() );
}

export async function fillFields( vc, issuer, status = 'revoked' ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/vaccination_template.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  const compressed = new Buffer( gzip( JSON.stringify( vc, null, 2 ) ) ).toString( 'base64' );

  const buffer = await new Promise( resolve => qrcode.toBuffer( compressed, ( err, buffer ) => resolve( buffer ) ) );
  const pdfImage = await pdfDoc.embedPng( buffer );

  form.getTextField( 'fullName' ).setText( `${subject.recipient.givenName} ${subject.recipient.familyName}` );
  form.getTextField( 'birthDate' ).setText( moment( subject.birthDate ).format( 'DD/MM/YYYY' ) );
  form.getTextField( 'gender' ).setText( subject.recipient.gender === 'male' ? 'Male' : 'Female' );
  form.getTextField( 'vaccinationDate' ).setText( moment( vc.issuanceDate ).format( 'DD/MM/YYYY' ) );
  form.getTextField( 'id' ).setText( vc.id );
  form.getTextField( 'issuer' ).setText( issuer.name );
  form.getTextField( 'dose' ).setText( `${subject.order}` );
  form.getTextField( 'vaccine' ).setText( subject.vaccine.disease );
  form.getTextField( 'disease' ).setText( subject.vaccine.disease );
  form.getTextField( 'atcCode' ).setText( subject.vaccine.atcCode );
  form.getTextField( 'batchNumber' ).setText( subject.batchNumber );
  form.getTextField( 'vaccinationCentre' ).setText( subject.administeringCentre );
  form.getTextField( 'status' ).setAlignment( 1 );
  if( status === 'revoked' ) {
    form.getTextField( 'status' ).setText( 'REVOKED' );
  } else if( moment().diff( moment( vc.expirationDate ), 'days' ) > 0 ) {
    form.getTextField( 'status' ).setText( 'EXPIRED' );
  } else {
    form.getTextField( 'status' ).setText( 'ACTIVE' );
  }
  form.getButton( 'qr_af_image' ).setImage( pdfImage );
  return await pdfDoc.save();
}
