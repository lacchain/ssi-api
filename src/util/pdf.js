import fs from 'fs'
import pdf from "pdf-lib";
import path from "path";
import moment from "moment";
import qrcode from "qrcode";

const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export async function buildCUDIVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/cudi.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}` );
  form.getTextField( 'workshop' ).setText( subject.diploma.title );
  return new Buffer(await pdfDoc.save()).toString('base64');
}


export async function buildSerenaVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/serena.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  const [correlativo, registro, resolucion] = subject.diploma.recordID.split(';');
  const issued = moment( subject.diploma.issued );
  const issuance = moment( vc.issuanceDate );

  const buffer = await new Promise( resolve => qrcode.toBuffer( subject.diploma.hashQR, ( err, buffer ) => resolve( buffer ) ) );
  const pdfImage = await pdfDoc.embedPng( buffer );

  form.getTextField( 'subject' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}` );
  form.getTextField( 'title' ).setText( subject.diploma.title );
  form.getTextField( 'issued' ).setText( `${issued.date()} de ${months[issued.month()]} de ${issued.year()}` );
  form.getTextField( 'issuance' ).setText( `${issuance.date()} de ${months[issuance.month()]} de ${issuance.year()}` );
  form.getTextField( 'correlativo' ).setText( correlativo );
  form.getTextField( 'registro' ).setText( registro );
  form.getTextField( 'resolucion' ).setText( resolucion );
  form.getTextField( 'id' ).setText( subject.attendant.nationalId );
  form.getButton( 'qr' ).setImage( pdfImage );

  return new Buffer(await pdfDoc.save()).toString('base64');
}

