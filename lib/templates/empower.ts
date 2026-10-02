export const empowerMergeFields = [
  "order_title",
  "order_reference",
  "formal_plan_name",
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
  "award_text",
  "valuation_date",
  "adjust_market_shall"
];

export const empowerHtmlTemplate = `
  <p class="court-heading"><strong><u>{{order_title}}</u></strong></p>

  <p class="indent">WHEREAS {{participant_name}} (hereinafter "Participant") is a participant in the {{formal_plan_name}} (the "Plan"), an employee benefit plan established pursuant to and maintained in compliance with the Employee Retirement Income Security Act of 1974, as amended ("ERISA"), 29 U.S.C. § 1001 et seq; and</p>

  <p class="indent">WHEREAS the parties have agreed and this Court has determined that it is just and appropriate for this Court to enter an order awarding a portion of the Participant's account balance to {{alternate_payee_name}} (hereinafter "Alternate Payee");</p>

  <p class="indent">NOW THEREFORE it is AWARDED, ADJUDGED, and DECREED as follows:</p>

  <p class="indent">1. This {{order_reference}} is intended to be a Qualified Domestic Relations Order ("QDRO") under Section 414(p) of the Internal Revenue Code of 1986, as amended (the "Code") and Section 206(d) of ERISA, 29 U.S.C. § 1056(d), and is issued by this court pursuant to Utah Code 30-3-5.</p>

  <p class="indent">2. <u>Participant Information</u>. {{participant_name}} ("Participant") is a participant in the Plan.</p>

  <p>Participant's information is as follows:</p>

  <p class="subindent">Social Security Number: {{participant_ssn}}<br />Date of birth: {{participant_dob}}<br />Last known mailing address: {{participant_full_address}}<br />Telephone Number: {{participant_phone}}<br />Email address: {{participant_email}}</p>

  <p class="indent">3. <u>Alternate Payee Information</u>. {{alternate_payee_name}} ("Alternate Payee") is the alternate payee for purposes of this QDRO. Alternate Payee's Information is as follows:</p>

  <p class="subindent">Social Security Number: {{alternate_payee_ssn}}<br />Date of birth: {{alternate_payee_dob}}<br />Last known mailing address: {{alternate_full_address}}<br />Telephone Number: {{alternate_payee_phone}}<br />Email address: {{alternate_payee_email}}</p>

  <p>The Alternate Payee is instructed to keep the Plan advised of any change of mailing address or name by sending written notice, with reference to the Participant's name, to the Plan Administrator at Empower, c/o QDROS.com, P.O. Box 173764, Denver, CO, 80217-3764; Phone 800-527-8481; Fax 330-722-2735.</p>

  <p class="indent">4. The Alternate Payee is the Participant's former spouse.</p>

  <p class="indent">5. The Alternate Payee is hereby awarded a portion of the Participant's account balance in the Plan and the Plan is directed to establish a separate account after this {{order_reference}} is qualified.</p>

  <p class="indent">6. Alternate Payee's portion is to be calculated as follows: The Plan shall pay to the Alternate Payee as a separate interest an amount equal to {{award_text}} of Participant's total account balance in the Plan as of the closest valuation date under the terms of the Plan prior to {{valuation_date}}. The Alternate Payee's assignment {{adjust_market_shall}} include any earnings or losses thereon from the aforesaid valuation date (or the closest valuation date) under the terms of the Plan to the date of distribution. The Alternate Payee's separate account shall be distributed in the form of a single lump-sum payment within a reasonable period of time following the Plan Administrator's receipt of a request for distribution after this {{order_reference}} is qualified.</p>

  <p class="indent">7. The assignment to the Alternate Payee will not be affected by the death of the Participant. If the Alternate Payee dies after the Plan Administrator approves an Order but before all the assigned account balance has been distributed to the Alternate Payee, the Plan will make any payments due to a beneficiary pursuant to the terms of the Alternate Payee's beneficiary designation on file with the Plan or, if no beneficiary designation is on file with the Plan, according to the terms of the Plan.</p>

  <p class="indent">8. This order is not intended, and is not to be interpreted, to require the Plan to provide any type or form of benefit, or any option, not otherwise provided under the Plan; to require the Plan to provide increased benefits; or to require the payment of benefits to the Alternate Payee which are required to be paid to another alternate payee under another order previously determined to be a QDRO.</p>

  <p class="indent">9. The distribution of an assigned account balance to the Alternate Payee is to be governed by all rules of the Plan, including those requiring that all intended recipients submit an application, on a form provided on request by the Plan's recordkeeper, prior to the desired distribution of the account balance. The terms and rules governing the Plan shall prevail in the event of any conflict between this Order and the Plan.</p>

  <p class="indent">10. This Order, after entry and execution by all Parties, shall be submitted to the Plan Administrator, who shall determine whether the Order constitutes a QDRO for purposes of the Plan. If the Plan Administrator concludes that the Order is qualified, the Plan Administrator shall honor the Order, in accordance with Section 414(p) of the Code and Section 206(d) of ERISA, 29 U.S.C. § 1056(d). The Plan Administrator shall be entitled to rely on this Order in payment of benefits to the Alternate Payee and shall be held harmless from any action by the Participant or by any other party arising from the distribution of the assigned account balance to the Alternate Payee, in accordance with this Order.</p>

  <p class="indent">11. The parties' signatures below signify their agreement with the division of the Participant's account balance set forth herein and specifically agree to waive any claim against the Plan Administrator relating to distribution of the account balance, so long as the distribution is made in compliance with the terms of this {{order_reference}}.</p>

  <p class="indent">12. The Court retains jurisdiction over this {{order_reference}} to amend same, in order to establish or maintain its qualification as a QDRO.</p>
`;
