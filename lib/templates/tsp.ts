export const tspMergeFields = [
  "order_title",
  "participant_name",
  "participant_full_address",
  "alternate_payee_name",
  "alternate_full_address",
  "valuation_date",
  "award_text",
  "adjust_market_shall",
  "tsp_civilian_checked",
  "tsp_uniformed_checked",
  "tsp_beneficiary_checked",
  "tsp_loan_reduction_clause"
];

export const tspAddendumMergeFields = [
  "participant_name",
  "participant_ssn",
  "participant_dob",
  "participant_phone",
  "participant_email",
  "alternate_payee_name",
  "alternate_payee_ssn",
  "alternate_payee_dob",
  "alternate_payee_phone",
  "alternate_payee_email"
];

export const tspHtmlTemplate = `
  <p class="court-heading"><strong>{{order_title}}</strong></p>

  <p>This order is entered pursuant to the authority granted under the applicable domestic relations laws of the state of Utah.</p>

  <p><strong>1. Plan</strong></p>

  <p>This order applies to the Thrift Savings Plan (the "Plan"):</p>

  <p class="subindent">{{tsp_civilian_checked}} Civilian Account<br />{{tsp_uniformed_checked}} Uniformed Services Account<br />{{tsp_beneficiary_checked}} Beneficiary Participant Account</p>

  <p><strong>2. Participant</strong></p>

  <p>The name, address, and Social Security Number of the participant is as follows:</p>

  <p class="subindent">Name: {{participant_name}}<br />Address: {{participant_full_address}}<br />Social Security Number: <u>See Attached Addendum</u></p>

  <p><strong>3. Payee</strong></p>

  <p>The person named as payee meets the requirements of the definition of payee as set forth in Section 4 of this order. The payee's name, address, Social Security number, and relationship to the participant are as follows:</p>

  <p class="subindent">Name: {{alternate_payee_name}}<br />Address: {{alternate_full_address}}<br />Social Security Number: <u>See Attached Addendum</u><br />Relationship to Participant: Former Spouse</p>

  <p>The payee shall be responsible for notifying the Plan in writing of any changes in his or her mailing address after the submission of this order.</p>

  <p><strong>4. Definitions</strong></p>

  <p><strong>Payee</strong> - The payee is any spouse, former spouse, child, or other dependent of a participant who is recognized by a domestic relations order as having a right to receive all or a portion of the benefits payable under the Plan with respect to the participant.</p>

  <p><strong>Date of Distribution</strong> - The date on which the awarded benefit is distributed to the payee.</p>

  <p><strong>Liquidation Date</strong> - The liquidation date is the date the amount assigned to the payee is transferred from the participant's vested account balance to a separate account established for the payee in accordance with the terms of the RBCO. An assignment as of the liquidation date assigns a portion of the participant's current vested account balance.</p>

  <p><strong>Valuation Date</strong> - The valuation date is the date on which the participant's vested account balance will be valued to determine the payee's designated portion in accordance with the terms of this order. Accounts are valued daily. The valuation date for this order is {{valuation_date}}.</p>

  <p><strong>Vested Account Balance</strong> - The participant's vested account balance is the dollar amount the participant has a nonforfeitable right to receive from the Plan.</p>

  <p><strong>5. Benefit Payable to the Payee</strong></p>

  <p>The order assigns to the payee an amount equal to {{award_text}} of the participant's vested account balance under the Plan (identified in Section 1) as of {{valuation_date}} (the valuation date). {{tsp_loan_reduction_clause}}</p>

  <p>From the valuation date to the liquidation date, the amount assigned to the payee {{adjust_market_shall}} include earnings and losses.</p>

  <p><strong>6. Form of Payment</strong></p>

  <p>The payee shall receive the portion of the plan benefits assigned to the payee in a single lump-sum payment. Such amount shall be adjusted for earnings and losses from the liquidation date to the date of distribution to the payee.</p>

  <p><strong>7. Commencement</strong></p>

  <p>The payee shall be eligible to receive payment as soon as administratively reasonable following the determination that this order is qualified, but in no event earlier than 30 days after the date of the decision letter.</p>

  <p><strong>8. Death Procedures</strong></p>

  <p>If the participant predeceases the payee prior to payment of the payee's assigned benefits under the RBCO, the payee's benefits will not be affected. In the event of the participant's death, the account balance, which remains the property of the participant, will be payable to the participant's designated beneficiary or in accordance with Plan provisions. This order does not require the participant to name the payee as the beneficiary for the benefits not assigned to the payee.</p>

  <p>In case of the death of the payee prior to distribution of the payee's benefits under the RBCO, the assigned benefits will be paid to the payee's estate, unless otherwise specified by the court order. A distribution to the estate of a deceased court order payee will be reported as income to the decedent's estate.</p>

  <p><strong>9. Retention of Jurisdiction</strong></p>

  <p>This matter arises from an action for divorce or legal separation in this court under the case number set forth at the beginning of this order. Accordingly, this court has jurisdiction to issue this order.</p>

  <p>In the event that this order is not a qualified Retirement Benefits Court Order, both parties shall cooperate with the Plan in making any changes needed for it to become qualified. This includes signing all necessary documents. For this purpose, this court expressly reserves jurisdiction over the dissolution proceeding involving the participant, the payee, and the participant's interest in the Plan.</p>

  <p><strong>10. Limitations</strong></p>

  <p>Pursuant to Section 414(p)(3) of the Code and except as provided by Section 414(p)(4), this order:</p>

  <p class="subindent">(i) Does not require the Plan to provide any type or form of benefit, or any option, not otherwise provided under the Plan;</p>

  <p class="subindent">(ii) Does not require the Plan to provide increased benefits; and</p>

  <p class="subindent">(iii) Does not require the payment of benefits to a payee that is required to be paid to another payee under another order previously determined to be a Retirement Benefits Court Order.</p>

  <p><strong>11. Taxation</strong></p>

  <p>For purposes of Sections 402 and 72 of the Code, any payee who is the spouse or former spouse of the participant shall be treated as the distributee of any distributions or payments made to the payee under the terms of the order and, as such, will be required to pay the appropriate federal, state, and local income taxes on such distributions.</p>

  <p><strong>12. Constructive Receipt</strong></p>

  <p>If the Plan inadvertently pays to the participant any benefit that is assigned to the payee pursuant to the terms of this order, the participant will immediately reimburse the Plan to the extent the participant has received such benefit payments from the Plan within ten (10) days of receipt.</p>

  <p>If the Plan inadvertently pays to the payee any benefit that is actually payable to the participant, the payee must make immediate reimbursement. The payee must reimburse the Plan to the extent he or she has received such benefit payments from the Plan within ten (10) days of receipt.</p>

  <p><strong>13. Certification of Necessary Information</strong></p>

  <p>All payments made pursuant to this order shall be conditioned on the certification by the Payee and the participant to the Plan of such information as the Plan may reasonably require from such parties to make the necessary calculation of the benefit amounts contained herein.</p>
`;

export const tspAddendumHtmlTemplate = `
  <section class="tsp-addendum">
    <p class="tsp-addendum-heading">DO NOT FILE WITH COURT</p>

    <p class="tsp-addendum-heading">Addendum to RBCO<br />Personal Information<br />Thrift Savings Plan</p>

    <p class="tsp-addendum-notice">This attachment is not required to be filed with the court. This attachment should be included with the order when it's delivered to the plan. This information is required to process the RBCO.</p>

    <p class="tsp-addendum-section-title">Participant:</p>
    <table class="tsp-addendum-info">
      <tbody>
        <tr>
          <td class="tsp-addendum-label">Name:</td>
          <td class="tsp-addendum-value">{{participant_name}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Social Security Number:</td>
          <td class="tsp-addendum-value">{{participant_ssn}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Date of Birth:</td>
          <td class="tsp-addendum-value">{{participant_dob}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Phone:</td>
          <td class="tsp-addendum-value">{{participant_phone}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Email:</td>
          <td class="tsp-addendum-value">{{participant_email}}</td>
        </tr>
      </tbody>
    </table>

    <table class="tsp-addendum-signature">
      <tbody>
        <tr>
          <td>My Information is Correct</td>
          <td>_____________________</td>
          <td>___________</td>
        </tr>
        <tr>
          <td></td>
          <td>Participant</td>
          <td>Date</td>
        </tr>
      </tbody>
    </table>

    <p class="tsp-addendum-section-title">Payee:</p>
    <table class="tsp-addendum-info">
      <tbody>
        <tr>
          <td class="tsp-addendum-label">Name:</td>
          <td class="tsp-addendum-value">{{alternate_payee_name}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Social Security Number:</td>
          <td class="tsp-addendum-value">{{alternate_payee_ssn}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Date of Birth:</td>
          <td class="tsp-addendum-value">{{alternate_payee_dob}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Phone:</td>
          <td class="tsp-addendum-value">{{alternate_payee_phone}}</td>
        </tr>
        <tr>
          <td class="tsp-addendum-label">Email:</td>
          <td class="tsp-addendum-value">{{alternate_payee_email}}</td>
        </tr>
      </tbody>
    </table>

    <table class="tsp-addendum-signature">
      <tbody>
        <tr>
          <td>My Information is Correct</td>
          <td>_____________________</td>
          <td>___________</td>
        </tr>
        <tr>
          <td></td>
          <td>Payee</td>
          <td>Date</td>
        </tr>
      </tbody>
    </table>

    <p class="tsp-addendum-small"><em>Benefit processing requires the Social Security number and address of the payee. Failure to provide this information prohibits the Plan from establishing a separate benefit for the payee, which will prevent distribution of funds to the payee. As such, orders that do not contain this information, either in the order itself or in an addendum, will not be qualified.</em></p>

    <p class="tsp-addendum-heading">DO NOT FILE WITH COURT</p>
  </section>
`;
