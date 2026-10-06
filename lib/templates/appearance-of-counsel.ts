export const appearanceOfCounselMergeFields = [
  "counsel_for",
  "district",
  "court_county",
  "party1_name",
  "party2_name",
  "case_number",
  "judge_name",
  "current_date"
];

export const appearanceOfCounselHtmlTemplate = `
<section class="supplemental-document">
  <p class="attorney-block">
    David J. Hunter (9015)<br />
    3915 Timpview Dr., Provo, UT 84604<br />
    801-473-4444 help@utahqdro.com
  </p>

  <p class="counsel-line"><em>Counsel for {{counsel_for}}</em></p>

  <table class="court-caption">
    <tbody>
      <tr>
        <td colspan="2" class="court-heading">
          IN THE {{district}} JUDICIAL DISTRICT COURT IN AND FOR {{court_county}} COUNTY<br />
          STATE OF UTAH
        </td>
      </tr>
      <tr>
        <td>
          <div class="caption-line">In the Matter of the Marriage of</div>
          <div class="caption-blank">&nbsp;</div>
          <div class="caption-line">{{party1_name}}, and</div>
          <div class="caption-line">{{party2_name}}.</div>
        </td>
        <td>
          LIMITED APPEARANCE OF COUNSEL<br /><br />
          Case No. {{case_number}}<br />
          Judge {{judge_name}}
        </td>
      </tr>
    </tbody>
  </table>

  <p class="caption-spacer">&nbsp;</p>

  <p class="body-text">
    COMES NOW David J. Hunter hereby enters this limited appearance of counsel for the sole purpose of drafting and submitting an uncontested QDRO for court signature, and then afterward to send a certified copy of the QDRO to the plan administrator for processing. Counsel is not making a general appearance or an appearance for any other purposes or litigation.
  </p>

  <table class="signature-row">
    <tbody>
      <tr>
        <td class="signature-date">DATED {{current_date}}.</td>
        <td class="signature-name">
          <div class="signature-line"><u>/s/ David J. Hunter</u></div>
          <div class="signature-line">David J. Hunter</div>
        </td>
      </tr>
    </tbody>
  </table>

  <p class="service-certificate">
    <u>Certificate of Service E-FILING</u>: The foregoing was served upon counsel of record, if any, via the court's e-filing service to the email on file on this date.
  </p>

  <table class="signature-row">
    <tbody>
      <tr>
        <td class="signature-date">DATED {{current_date}}.</td>
        <td class="signature-name">
          <div class="signature-line"><u>/s/ David J. Hunter</u></div>
          <div class="signature-line">David J. Hunter</div>
        </td>
      </tr>
    </tbody>
  </table>
</section>`;
