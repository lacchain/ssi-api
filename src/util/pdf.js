import fs from 'fs'
import pdf from "pdf-lib";
import path from "path";
import moment from "moment";

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

  form.getTextField( 'subject' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}` );
  form.getTextField( 'title' ).setText( subject.diploma.title );
  form.getTextField( 'issued' ).setText( moment(subject.diploma.issued).format('DD [de] MMM [de] YYYY') );
  form.getTextField( 'issuance' ).setText( moment(vc.issuanceDate).format('DD [de] MMM [de] YYYY') );
  form.getTextField( 'id' ).setText( subject.attendant.nationalId );
  return new Buffer(await pdfDoc.save()).toString('base64');
}

