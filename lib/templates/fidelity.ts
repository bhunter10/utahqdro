export const fidelityMergeFields = [
  "counsel_for",
  "district",
  "court_county",
  "party1_name_upper",
  "party2_name_upper",
  "order_title",
  "entity_account_type",
  "case_number",
  "judge_name",
  "participant_name",
  "participant_full_address",
  "participant_ssn",
  "participant_dob",
  "participant_phone",
  "participant_email",
  "alternate_payee_name",
  "alternate_full_address",
  "alternate_payee_ssn",
  "alternate_payee_dob",
  "alternate_payee_phone",
  "alternate_payee_email",
  "formal_plan_name",
  "employer_name",
  "marriage_date",
  "divorce_date",
  "valuation_date",
  "percent_amount",
  "adjust_market"
];

export const fidelityHtmlTemplate = `
<div style="font-family: Times New Roman; font-size: 12pt; line-height: 14pt;">
    David J. Hunter (9015)<br />
    3915 Timpview Dr., Provo, UT 84604<br />
    801-473-4444 dave@utahmediations.com<br />
    <br />
    <em>Counsel for {{counsel_for}}</em>
  <br>

  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: none; margin: 12pt 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
    <tbody>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase; font-family: Times New Roman; font-size: 12pt; line-height: 12pt;">IN THE {{district}} JUDICIAL DISTRICT COURT IN AND FOR {{court_county}} COUNTY</td>
      </tr>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase; font-family: Times New Roman; font-size: 12pt; line-height: 12pt;">STATE OF UTAH</td>
      </tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border-left: none; border-right: none; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">
    <colgroup>
      <col style="width: 50%;" />
      <col style="width: 50%;" />
    </colgroup>
    <tbody>
      <tr>
        <td style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: 1px solid #000000; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">In the Matter of the Marriage of</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">{{party1_name_upper}}, and</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">{{party2_name_upper}}.</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; padding-left:12pt; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">{{order_title}}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Re: {{entity_account_type}}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Case No. {{case_number}}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Judge {{judge_name}}</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
<br>
  <p class="indent">WHEREAS this Court has jurisdiction over Petitioner and Respondent and the subject matter of this Order pursuant to Utah Code 81-1-204; and</p>
  <p class="indent">WHEREAS Petitioner, Respondent and the Court intend that this Order shall be a {{order_title}} (hereinafter referred to as a “QDRO”) as defined in Section 206(d)(3) of the Employee Retirement Income Security Act of 1974, as amended (“ERISA”) and Section 414(p) of the Internal Revenue Code of 1986, as amended (the “Code”); and,</p>
  <p class="indent">WHEREAS, the parties have stipulated that the Court enter this Order, or the Court has determined that this Order shall enter;</p>
  <p class="indent">NOW, THEREFORE, IT IS HEREBY ORDERED BY THE COURT as follows:</p>

  <p class="indent">1. As used in this Order, the following terms shall apply:</p>
  <p class="subindent">(a) <strong>Participant</strong> shall mean {{participant_name}}, whose current address is {{participant_full_address}}; SSN {{participant_ssn}}; DOB {{participant_dob}}; Phone {{participant_phone}}; Email {{participant_email}}</p>
  <p class="subindent">(b) <strong>Alternate Payee</strong> shall mean {{alternate_payee_name}}, whose current address is {{alternate_full_address}}; SSN {{alternate_payee_ssn}}; DOB {{alternate_payee_dob}}; Phone {{alternate_payee_phone}}; Email {{alternate_payee_email}}</p>
  <p class="subindent">(c) <strong>Plan</strong> shall mean {{formal_plan_name}} (“Plan”).</p>
  <p class="subindent">(d) <strong>Plan Sponsor</strong> shall mean {{employer_name}}.</p>
  <p class="subindent">(e) This order is to be reviewed <strong><u>only</u></strong> as it relates to the plans on Fidelity's QDRO Review Service.</p>

  <p class="indent">2. The Alternate Payee is the former spouse of the Participant.</p>
  <p class="indent">3. The Order relates to marital property rights.</p>
  <p class="indent">4. The Participant and the Alternate Payee are/were considered married for federal income tax purposes.</p>
  <p class="indent">5. The Participant and the Alternate Payee’s <strong>Marital History</strong>:</p>
  <p class="subindent">Date of Marriage: {{marriage_date}}.</p>
  <p class="subindent">Date of Divorce: {{divorce_date}}.</p>
  <p class="indent">6. The Valuation Date shall be for the purposes of calculating the Alternate Payee’s award shall mean: {{valuation_date}} OR DATE OF SEGREGATION.</p>
  <p class="indent">7. <strong>The Alternate Payee’s awarded interest in the Plan shall be {{percent_amount}} of the Participant’s total vested account balance under the Plan as of the Valuation Date stated above</strong>.</p>
  <p class="indent">8. The Alternate Payee’s award {{adjust_market}} entitled to <strong>earnings</strong> (defined as gains, losses, dividends and interest) from the Valuation Date to the date that the award is segregated from the Participant’s account.</p>
  <p class="indent">9. In the event that there is an outstanding loan balance as of the Valuation Date, the <strong>outstanding loan balance</strong>: WILL NOT be included for purposes of calculating the total vested account balance to be divided. If the Plan does not allow for loans, this provision will be disregarded.</p>
  <p class="indent">10. To the extent allowed by the Plan, the <strong>Alternate Payee may initiate a distribution</strong> of the award as soon as administratively feasible following the qualification of this Order and segregation of the Alternate Payee’s award. The distribution must be made in accordance with the administrative procedures established for the Plan.</p>
  <p class="indent">11. The Alternate Payee’s award will be <strong>transferred proportionally</strong> from all standard plan investment options in which the Participant's account is invested as of the Date of Segregation (not including BrokerageLink). In the event that the Participant has a BrokerageLink account and there are insufficient funds in the standard plan investment options in the Participant’s Plan account balance to satisfy the Alternate Payee’s award, the Participant's BrokerageLink account will be liquidated until sufficient assets have been obtained to satisfy the Alternate Payee's award.</p>
  <p class="indent">12. The allocation of the <strong>tax cost basis</strong> to the Alternate Payee will be calculated based on the contribution sources in the Participant's account(s) as of the Valuation Date.</p>
  <p class="indent">13. In the event of the <strong>Alternate Payee's death</strong> after the qualification of this Order, either prior to or subsequent to the segregation of assets for the Alternate Payee, the Alternate Payee's award will be distributed pursuant to the administrative procedures established for the Plan.</p>
  <p class="indent">14. <strong>Neither Party shall accept any benefits from the Plan</strong> which are the property of the other Party.</p>
  <p class="indent">15. For purposes of Sections 402 and 72 of the Code, an Alternate Payee who is the spouse or former spouse of the Participant will be treated as the distributee of any distributions or payments made to the Alternate Payee under the terms of this Order.</p>
  <p class="indent">16. <strong>Order Review Fees</strong>: The one-time fee for review of the domestic relations order will be deducted 50% from the Participant's account and 50% from the Alternate Payee's account.</p>
  <p class="indent">If the Order is determined to be non-qualified following the first review, the review fee will be deducted from the Participant’s account. If applicable, the Participant will be reimbursed from the Alternate Payee’s account following qualification of a subsequent Amended Order.</p>
  <p class="indent">17. The Court shall retain jurisdiction with respect to this Order to the extent required to maintain its qualified status and the intent of the parties.</p>

  <table class="signature-block" style="width: 100%; border-collapse: collapse; table-layout: fixed; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">
    <colgroup>
      <col style="width: 50%;" />
      <col style="width: 50%;" />
    </colgroup>
    <tbody>
      <tr>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Approved as to form:_____________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0 0 0 0; font-family: Times New Roman; font-size: 12pt; color: #000000;">________________________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0 0 0 0; font-family: Times New Roman; font-size: 12pt; color: #000000;">{{participant_name}}, Participant,</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0 0 0 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">(Signed Electronically)</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Approved as to form: ____________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">________________________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">{{alternate_payee_name}}, Alternate Payee,</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">(Signed Electronically)</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <p class="court-footer" style="font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000; padding-top:12pt; text-align:center;"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
</div>`;
