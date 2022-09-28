import fs from 'fs'
import pdf from "pdf-lib";
import path from "path";

export async function fillFields( vc ) {
  const { credentialSubject: subject } = vc;
  const file = `${path.resolve()}/src/util/cudi.pdf`;
  const pdfDoc = await pdf.PDFDocument.load( fs.readFileSync( file ) );
  const form = pdfDoc.getForm();

  form.getTextField( 'name' ).setText( `${subject.attendant.givenName} ${subject.attendant.familyName}` );
  form.getTextField( 'workshop' ).setText( subject.diploma.title );
  return new Buffer(await pdfDoc.save()).toString('base64');
}
