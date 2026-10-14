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
    801-473-4444 help@utahqdro.com
  </p>

  <p class="counsel-line"><em>Counsel for {{counsel_for}}</em></p>

  <table class="court-heading-table">
    <tbody>
      <tr><td class="court-heading-line">IN THE {{district}} JUDICIAL DISTRICT COURT IN AND FOR {{court_county}} COUNTY</td></tr>
      <tr><td class="court-heading-line">STATE OF UTAH</td></tr>
    </tbody>
  </table>

  <table class="court-caption">
    <colgroup><col style="width: 50%;" /><col style="width: 50%;" /></colgroup>
    <tbody>
      <tr>
        <td class="caption-parties">
          <p class="caption-intro">In the Matter of the Marriage of</p>
          <div class="caption-party">{{party1_name}}, and</div>
          <div class="caption-party">{{party2_name}}.</div>
        </td>
        <td class="caption-details">
          <p class="caption-title">WITHDRAWAL OF COUNSEL</p>
          <div class="caption-line">Case No. {{case_number}}</div>
          <div class="caption-line">Judge {{judge_name}}</div>
        </td>
      </tr>
    </tbody>
  </table>

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
