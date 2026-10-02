export const withdrawalOfCounselMergeFields = [
  "counsel_for",
  "district",
  "court_county",
  "party1_name",
  "party1_email",
  "party2_name",
  "party2_email",
  "case_number",
  "judge_name",
  "current_date"
];

export const withdrawalOfCounselHtmlTemplate = `
<section class="supplemental-document">
  <p class="attorney-block">
    David J. Hunter (9015)<br />
    3915 Timpview Dr., Provo, UT 84604<br />
    801-473-4444 dave@utahmediations.com
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
          WITHDRAWAL OF COUNSEL<br /><br />
          Case No. {{case_number}}<br />
          Judge {{judge_name}}
        </td>
      </tr>
    </tbody>
  </table>

  <p class="caption-spacer">&nbsp;</p>

  <p class="body-text">COMES NOW David J. Hunter and withdrawals as limited counsel effective immediately.</p>

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
    <u>Certificate of Service E-FILING</u>: The forgoing was served upon opposing counsel of record, if any, via the court's e-filing service to the email on file on this date.
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
    <u>Certificate of Service Email</u>: The forgoing was served upon the following persons via email along with a copy of the signed and certified QDRO on this date:
  </p>

  <table class="service-list">
    <tbody>
      <tr>
        <td class="service-party"><div class="service-line">{{party1_name}}</div></td>
        <td class="service-email"><div class="service-line">{{party1_email}}</div></td>
      </tr>
      <tr>
        <td class="service-party"><div class="service-line">{{party2_name}}</div></td>
        <td class="service-email"><div class="service-line">{{party2_email}}</div></td>
      </tr>
    </tbody>
  </table>

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
