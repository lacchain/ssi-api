import fs from 'fs'
import pdf from "pdf-lib";
import path from "path";
import moment from "moment";
import qrcode from "qrcode";
import fontkit from '@pdf-lib/fontkit'

const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export async function buildCUDIVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/cudi.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}`.toUpperCase() );
  form.getTextField( 'workshop' ).setText( subject.diploma.title );
  form.flatten();

  return new Buffer(await pdfDoc.save()).toString('base64');
}

export async function buildCediaVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/cedia.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}`.toUpperCase() );
  form.getTextField( 'description' ).setText( `Por haber aprobado el curso: ${subject.diploma.title} ${subject.diploma.description}` );
  form.flatten();

  return new Buffer(await pdfDoc.save()).toString('base64');
}

export async function buildRedClaraVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/redclara.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}`.toUpperCase() );
  form.flatten();

  return new Buffer(await pdfDoc.save()).toString('base64');
}

export async function buildFAirLACVC( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/fairlac.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}`.toUpperCase() );
  form.flatten();

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

  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(`${path.resolve()}/src/util/freeserif.ttf`);
  const fontBytesBold = fs.readFileSync(`${path.resolve()}/src/util/freeserif-bold.ttf`);
  const customFont = await pdfDoc.embedFont(fontBytes);
  const customFontBold = await pdfDoc.embedFont(fontBytesBold);

  const buffer = await new Promise( resolve => qrcode.toBuffer( subject.diploma.hashQR, ( err, buffer ) => resolve( buffer ) ) );
  const pdfImage = await pdfDoc.embedPng( buffer );

  form.getTextField( 'subject' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}` );
  form.getTextField( 'subject' ).updateAppearances( customFont );
  form.getTextField( 'title' ).setText( subject.diploma.title );
  form.getTextField( 'title' ).updateAppearances( customFont );
  form.getTextField( 'issued' ).setText( `${issued.date()} de ${months[issued.month()]} de ${issued.year()}` );
  form.getTextField( 'issued' ).updateAppearances( customFont );
  form.getTextField( 'issuance' ).setText( `${issuance.date()} de ${months[issuance.month()]} de ${issuance.year()}` );
  form.getTextField( 'issuance' ).updateAppearances( customFont );
  //form.getTextField( 'correlativo' ).setText( correlativo );
  //form.getTextField( 'correlativo' ).updateAppearances( customFont );
  form.getTextField( 'registro' ).setText( `${correlativo} - ${registro}` );
  form.getTextField( 'registro' ).updateAppearances( customFontBold );
  form.getTextField( 'resolucion' ).setText( resolucion );
  form.getTextField( 'resolucion' ).updateAppearances( customFont );
  form.getTextField( 'id' ).setText( subject.attendant.nationalId );
  form.getTextField( 'id' ).updateAppearances( customFont );
  form.getButton( 'qr' ).setImage( pdfImage );
  form.flatten();

  return new Buffer(await pdfDoc.save()).toString('base64');
}

