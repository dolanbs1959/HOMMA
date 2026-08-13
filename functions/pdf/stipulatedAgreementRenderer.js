/**
 * Server-side HTML renderer for the Disciplinary Stipulated Agreement PDF.
 * Returns a complete standalone HTML document ready for Puppeteer to convert to PDF.
 */
const {loadLogoBase64} = require('./logo');

const VIOLATION_REASONS = [
  {key: 'alcohol', label: 'Alcohol, Drug, or Pornography Use'},
  {key: 'financial', label: 'Failure to Pay Program Fees in A Timely Manner'},
  {key: 'employment', label: 'Failure to Find Employment in A Timely Manner'},
  {key: 'program', label: 'Failure to Obey Program Rules/Policies'},
];

const STIPULATION_SECTIONS = [
  {
    key: 'alcohol',
    title: 'Alcohol/Drug Use Violation',
    items: [
      {key: 'randomUA', label: 'Complete Random UA'},
      {
        key: 'celebrateRecovery',
        label: 'Attend Celebrate Recovery at 22604 16th Ave S, Des Moines, WA 98198 at 6 PM Every Friday'
      },
      {key: 'curfew8pm', label: 'Curfew of 8 PM'},
      {key: 'overcomingAddiction', label: 'Attend and complete Overcoming Addiction Class'},
      {key: 'drugEvaluation', label: 'Drug Evaluation'},
      {key: 'drugTreatment', label: 'Entry into Drug Treatment'},
    ],
  },
  {
    key: 'financial',
    title: 'Financial Violation',
    items: [
      {key: 'financialFreedom', label: 'Attend and complete Financial Freedom Class'},
      {key: 'paymentPlan', label: 'Pay Program Fees IAW Payment Plan'},
    ],
  },
  {
    key: 'employment',
    title: 'Employment Violation',
    items: [
      {key: 'workLifeReadiness', label: 'Attend and complete Work Life Readiness Class'},
      {key: 'nextStepWorkHub', label: 'Enroll and participate in Next Step Work Hub employment services'},
    ],
  },
  {
    key: 'program',
    title: 'Program Rule Violation',
    items: [
      {key: 'curfew8pm', label: 'Curfew of 8 PM'},
      {key: 'abidePolicies', label: 'Abide in all HOM policies and guidelines.'},
      {key: 'personalDevelopment', label: 'Attend Personal Development Class'},
      {key: 'other', label: 'Other'},
    ],
  },
];

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkboxSvg(checked) {
  if (checked) {
    return `<svg class="checkbox" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke="#000" stroke-width="1"/>
      <path d="M3 8 L6.5 11.5 L13 4.5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  return `<svg class="checkbox" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke="#000" stroke-width="1"/>
  </svg>`;
}

function formatDisplayDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderViolationReasons(violationReasons = {}) {
  return VIOLATION_REASONS.map((reason) => {
    const checked = !!violationReasons[reason.key];

    return `
      <div class="reason-row">
        ${checkboxSvg(checked)}
        <span>${escapeHtml(reason.label)}</span>
      </div>
    `;
  }).join('\n');
}

function renderStipulations(selectedStipulations = {}) {
  return STIPULATION_SECTIONS.map((section) => {
    const selectedKeys = new Set(selectedStipulations[section.key] || []);

    const rows = section.items.map((item) => {
      const checked = selectedKeys.has(item.key);

      let label = escapeHtml(item.label);

      label = label.replace(
        '22604 16th Ave S, Des Moines, WA 98198 at 6 PM Every Friday',
        '<strong class="bold-emphasis">22604 16th Ave S, Des Moines, WA 98198 at 6 PM Every Friday</strong>'
      );

      if (checked) {
        label = label.replace(
          /\b8 PM\b/g,
          '<strong class="bold-emphasis">8 PM</strong>'
        );
      }

      if (item.key === 'other') {
        const otherText = selectedStipulations.otherText || '';
        const otherDisplay = escapeHtml(otherText) || '___________________________';
        label += `: ${otherDisplay}`;
      }

      return `
        <div class="stipulation-row">
          ${checkboxSvg(checked)}
          <span>${label}</span>
        </div>
      `;
    }).join('\n');

    return `
      <h3 class="section-title">${escapeHtml(section.title)}</h3>
      ${rows}
    `;
  }).join('\n');
}

async function renderStipulatedAgreementPdf(data) {
  const logoBase64 = await loadLogoBase64();

  const participantName =
    escapeHtml(data.participantName || 'Unknown Participant');

  const effectiveDate =
    escapeHtml(data.effectiveDate || '');

  const displayDate =
    formatDisplayDate(effectiveDate) || effectiveDate;

  const specifyGuideline =
    escapeHtml(data.specifyGuideline || '');

  const staffName =
    escapeHtml(data.staffName || 'Unknown Staff');

  const participantSignatureDate =
    escapeHtml(data.participantSignatureDate || '');

  const staffSignatureDate =
    escapeHtml(data.staffSignatureDate || '');

  const participantSignature =
    escapeHtml(data.participantSignature || '');

  const participantRefusal =
    !!data.participantRefusal;

  const staffSignature =
    escapeHtml(data.staffSignature || '');

  const violationReasonsHtml =
    renderViolationReasons(data.violationReasons);

  const stipulationsHtml =
    renderStipulations(data.selectedStipulations || {});

  const participantSignatureBlock = (() => {
    if (participantRefusal) {
      return `<div class="refused-stamp"><div class="main-text">Participant Refused to Sign</div><div class="sub-text">(Per participant request)</div></div>`;
    }
    return participantSignature
      ? `<img src="${participantSignature}" alt="Participant signature" class="signature-image" />`
      : '<div class="signature-line">&nbsp;</div>';
  })();

  const staffSignatureBlock = staffSignature
    ? `<img src="${staffSignature}" alt="HOM Staff signature" class="signature-image" />`
    : '<div class="signature-line">&nbsp;</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Disciplinary Stipulated Agreement - ${participantName}</title>

  <style>
    @page {
      size: letter;
      margin: 0.35in 0.45in;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #000;
      margin: 0;
      padding: 0;
    }

    .bold-emphasis {
      font-weight: bold;
    }

    .underline-text {
      text-decoration: underline;
    }

    .header {
      text-align: center;
      margin-bottom: 8px;
    }

    .logo {
      display: block;
      width: 90px;
      margin: 0 auto 4px;
    }

    .title {
      font-variant: small-caps;
      font-size: 20pt;
      font-weight: bold;
      margin: 2px 0;
      letter-spacing: 0.5px;
    }

    .subtitle-blue {
      color: #1f4e79;
      font-size: 11pt;
      font-weight: bold;
      margin: 2px 0;
    }

    .subtitle-org {
      font-size: 10pt;
      font-style: italic;
      margin: 1px 0 4px;
    }

    .header-rule {
      border: 0;
      border-top: 1px solid #1f4e79;
      margin: 4px 0 0;
    }

    .participant-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: 4px 0 6px;
    }

    .participant-field {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .participant-field:last-child {
      justify-content: flex-end;
    }

    .field-label {
      font-weight: bold;
    }

    .field-value {
      display: inline-block;
      min-width: 180px;
      border-bottom: 1px solid #000;
      padding: 0 2px;
    }

    .divider {
      border: 0;
      border-top: 2px solid #000;
      margin: 4px 0;
    }

    .intro-heading {
      font-weight: bold;
      margin: 5px 0 3px;
    }

    .violation-reasons {
      margin: 2px 0;
    }

    .reason-row,
    .stipulation-row {
      display: flex;
      align-items: flex-start;
      margin: 2px 0;
      line-height: 1.15;
    }

    .stipulation-row {
      padding-left: 18px;
    }

    .checkbox {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      margin-right: 5px;
      margin-top: 2px;
    }

    .guideline-row {
      margin: 4px 0 6px;
    }

    .guideline-label {
      font-weight: bold;
      margin-right: 3px;
    }

    .guideline-value {
      display: inline-block;
      min-width: 300px;
      border-bottom: 1px solid #000;
      padding: 0 2px;
    }

    .reconciliation {
      font-weight: bold;
      font-style: italic;
      margin: 8px 0 6px;
      line-height: 1.2;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      margin: 6px 0 2px;
      text-decoration: underline;
      line-height: 1.1;
    }

    .acknowledgement {
      margin: 8px 0;
      line-height: 1.2;
    }

    .signatures {
      display: flex;
      gap: 50px;
      margin-top: 16px;
    }

    .signature-block {
      flex: 1;
      min-width: 0;
    }

    .signature-label {
      font-weight: bold;
      margin-bottom: 3px;
    }

    .signature-image {
      display: block;
      max-width: 100%;
      max-height: 30px;
      margin-bottom: 2px;
    }

    .signature-line {
      height: 30px;
      border-bottom: 1px solid #000;
      margin-bottom: 2px;
    }

    .refused-stamp {
      display: inline-block;
      border: 3px double red;
      color: red;
      background: #fff;
      padding: 4px 8px;
      margin: 2px 0 6px;
      transform: rotate(-4deg);
      transform-origin: center center;
      font-family: Arial, Helvetica, sans-serif;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.1;
      max-width: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .refused-stamp .main-text {
      font-weight: bold;
      font-size: 9pt;
      letter-spacing: 0.3px;
    }

    .refused-stamp .sub-text {
      font-size: 6.5pt;
      text-transform: none;
      margin-top: 1px;
    }

    .signature-name {
      font-weight: bold;
      margin: 2px 0;
    }

    .signature-date {
      margin: 1px 0;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>

  <div class="header">
    <img
      src="${logoBase64}"
      alt="House of Mercy logo"
      class="logo"
    />

    <div class="title">
      Disciplinary Stipulated Agreement
    </div>

    <div class="subtitle-blue">
      House of Mercy – Clean & Sober Living
    </div>

    <div class="subtitle-org">
      (Faith-Based Nonprofit Organization)
    </div>

    <hr class="header-rule" />
  </div>

  <div class="participant-row">
    <div class="participant-field">
      <span class="field-label">Participant Name:</span>
      <span class="field-value">${participantName}</span>
    </div>

    <div class="participant-field">
      <span class="field-label">Effective Date:</span>
      <span class="field-value">${displayDate}</span>
    </div>
  </div>

  <hr class="divider" />

  <div class="intro-heading">
    This stipulated agreement is warranted based on the following:
  </div>

  <div class="violation-reasons">
    ${violationReasonsHtml}
  </div>

  <div class="guideline-row">
    <span class="guideline-label">*Specify Guideline:</span>
    <span class="guideline-value">${specifyGuideline}</span>
  </div>

  <hr class="divider" />

  <p class="reconciliation">
    <em>
      House of Mercy desires reconciliation, responsibility and cooperation.
      Based on the following actions, and in agreement with the following
      stipulations, participant agrees to the following:
    </em>
  </p>

  <div class="stipulations">
    ${stipulationsHtml}
  </div>

  <hr class="divider" />

  <div class="acknowledgement">
    I, <strong>${participantName}</strong>, agree to abide by all checked
    stipulations, HOM rules, and DOC conditions.
    <strong class="bold-emphasis">
      Failure to do so could subject myself to immediate termination of the
      House of Mercy program.
    </strong>
    Stipulated agreement will end upon successful completion
    <span class="underline-text">90 days after its effective date.</span>
  </div>

  <div class="signatures">

    <div class="signature-block">
      <div class="signature-label">
        Participant Signature
      </div>

      ${participantSignatureBlock}

      <div class="signature-name">
        ${participantName}
      </div>

      <div class="signature-date">
        ${participantSignatureDate}
      </div>
    </div>

    <div class="signature-block">
      <div class="signature-label">
        HOM Staff Signature
      </div>

      ${staffSignatureBlock}

      <div class="signature-name">
        ${staffName}
      </div>

      <div class="signature-date">
        ${staffSignatureDate}
      </div>
    </div>

  </div>

</body>
</html>`;
}

module.exports = {renderStipulatedAgreementPdf};