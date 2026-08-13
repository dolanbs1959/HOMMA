const fs = require('fs');
const path = require('path');
const {generateAgreementPdfBuffer} = require('./pdf/generateAgreementPdf');

const participantSignatureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80"><path d="M20 55 Q 60 25 110 50 T 210 40 T 280 60" fill="none" stroke="black" stroke-width="3"/><path d="M210 30 Q 230 20 250 45" fill="none" stroke="black" stroke-width="2"/></svg>';
const staffSignatureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80"><path d="M30 40 Q 70 70 120 35 T 220 50 T 270 30" fill="none" stroke="black" stroke-width="3"/><path d="M150 25 Q 170 15 190 40" fill="none" stroke="black" stroke-width="2"/></svg>';

const sampleData = {
  participantName: 'Bobby Wilson',
  participantId: 'Wils8257',
  effectiveDate: '2026-08-12',
  specifyGuideline: 'Curfew violations.',
  staffName: 'Barry Dolan',
  participantSignatureDate: 'August 12, 2026',
  staffSignatureDate: 'August 12, 2026',
  participantSignature: `data:image/svg+xml;base64,${Buffer.from(participantSignatureSvg).toString('base64')}`.replace(/\s+/g, ''),
  staffSignature: `data:image/svg+xml;base64,${Buffer.from(staffSignatureSvg).toString('base64')}`.replace(/\s+/g, ''),
  violationReasons: {
    alcohol: true,
    program: true,
  },
  selectedStipulations: {
    alcohol: ['celebrateRecovery', 'curfew8pm', 'overcomingAddiction'],
    program: ['curfew8pm', 'abidePolicies'],
  },
};

const outputPath = path.join(__dirname, '..', 'sample-stipulated-agreement.pdf');

generateAgreementPdfBuffer(sampleData)
  .then((base64) => {
    fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));
    console.log(`Sample PDF generated: ${outputPath}`);
  })
  .catch((err) => {
    console.error('Failed to generate sample PDF:', err);
    process.exit(1);
  });
