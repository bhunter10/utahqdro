export const principalMergeFields = [
  "order_title",
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
  "adjust_market"
];

export const principal401kHtmlTemplate = `
  <p class="court-heading"><strong>{{order_title}}</strong></p>

  <p>It is intended that this Order constitute a "Qualified Domestic Relations Order" ("QDRO") as defined in Section 414(p) of the Internal Revenue Code of 1986, as amended (the "Code"), and Section 206(d)(3)(B) of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

  <p class="indent">1. This Order applies to {{formal_plan_name}} (the "Plan").</p>

  <p class="indent">2. <u>Participant Information</u>: The name, last known address, social security number, and date of birth of the Participant are:</p>

  <p class="subindent">Name: {{participant_name}}<br />Address: {{participant_full_address}}<br />Phone Number: {{participant_phone}}<br />Email: {{participant_email}}<br />Social Security Number: {{participant_ssn}}<br />Date of Birth: {{participant_dob}}</p>

  <p class="indent">3. <u>Alternate Payee Information</u>: The name, last known address, social security number and date of birth of the Alternate Payee are:</p>

  <p class="subindent">Name: {{alternate_payee_name}}<br />Address: {{alternate_full_address}}<br />Phone Number: {{alternate_payee_phone}}<br />Email: {{alternate_payee_email}}<br />Social Security Number: {{alternate_payee_ssn}}<br />Date of Birth: {{alternate_payee_dob}}</p>

  <p class="indent">The Alternate Payee shall notify the Plan Administrator in writing of any changes in mailing address subsequent to the entry of this Order. Notice of change of address shall be made in writing to the Plan's Administrator, address as follows:</p>

  <p class="subindent">Principal Life Insurance Co.<br />401k Plan Administrator<br />PO Box 9394<br />Des Moines, IA 50306-9394<br />Phone: 800-986-3343<br />Fax: 866-704-3481</p>

  <p class="indent">4. This Order assigns to the Alternate Payee as sole and separate property an amount equal to {{award_text}} of the vested account balance under the Plan determined as of {{valuation_date}} ("Assigned Benefit").</p>

  <p class="indent">The Participant's vested account balance includes the outstanding balance of any loan made to the Participant, and the Participant shall remain responsible for repaying the outstanding loan balance, if any.</p>

  <p class="indent">The Alternate Payee's Assigned Benefit {{adjust_market}} entitled to earnings (dividends, interest, gains, and losses) from the date of its determination listed above to the date of its full distribution.</p>

  <p class="indent">The Alternate Payee's share of the benefits shall be allocated on a pro-rata basis among all of the Participant's investment funds maintained under the Plan.</p>

  <p class="indent">5. The Participant and Alternate Payee agree to equally share any additional costs for administrative services incurred by the Plan due to the review and implementation of the terms of this Order.</p>

  <p class="indent">6. Except as otherwise provided in this Order, on and after the date that this Order is deemed to be a QDRO, but before the Alternate Payee receives a total distribution under the Plan, the Alternate Payee shall be considered a "beneficiary" within the meaning of the Code and ERISA and shall be entitled to such rights, privileges and options as are available to beneficiaries including, but not limited to, the rules regarding the right to designate a beneficiary for death benefit purposes and the right to direct plan investments to the extent permitted under the terms of the Plan.</p>

  <p class="indent">7. This Order is not intended, and shall not be constructed in such a manner as to require the Plan:</p>

  <p class="subindent">(a) to provide any type or form of benefit the Plan does not otherwise provide; or</p>

  <p class="subindent">(b) to require the Plan to provide increased benefits (determined on the basis of actuarial value); or</p>

  <p class="subindent">(c) to require the Plan to pay any benefits to the Alternate Payee that are required to be paid to another alternate payee under another order previously determined to be a QDRO.</p>

  <p class="indent">8. If the Alternate Payee so elects, benefits shall be paid as soon as administratively feasible after the date on which the Plan Administrator determines that this Order is qualified and has established the Alternate Payee's account, or at the earliest date permitted under the Plan or Section 414(p) of the Code, if later. Benefits shall be payable to the Alternate Payee in any form allowed under the terms of the Plan, except that the Alternate Payee may not elect the designation of a subsequent spouse under a joint and survivor annuity.</p>

  <p class="indent">9. The Alternate Payee shall not be deemed for any purpose to be the spouse or surviving spouse of the Participant and shall not be entitled to any benefit with respect to the portion of the Participant's Benefit not assigned to the Alternate Payee hereunder. Any subsequent spouse of the Participant shall not be treated as the Participant's spouse or surviving spouse with respect to the Alternate Payee's Assigned Benefit. The death of the Participant prior to full distribution of the Alternate Payee's Assigned Benefit shall have no effect on the Alternate Payee's right to the Alternate Payee's Assigned Benefit.</p>

  <p class="indent">In the event that the Participant dies prior to the establishment of separate account(s) in the name of the Alternate Payee, such Alternate Payee shall be treated as the surviving spouse of the Participant to the extent of the full amount of the Assigned Benefit.</p>

  <p class="indent">In the event of the Alternate Payee's death prior to Alternate Payee receiving the full amount of the Assigned Benefits assigned under this Order, any remaining interest shall be paid to the Alternate Payee's designated beneficiary on record or, if there is no designated beneficiary, to the estate of the Alternate Payee.</p>

  <p class="indent">10. This Order is entered pursuant to the domestic relations laws of the State of Utah and relates to the provision of marital property rights and/or spousal support to the Alternate Payee as a result of the order of divorce between the Participant and the Alternate Payee.</p>

  <p class="indent">11. For purposes of Sections 402(a)(1) and 72 of the Code, the Alternate Payee who is the spouse or former spouse of the Participant shall be treated as the distributee of any distributions or payments made to the Alternate Payee under the terms of this Order, and as such, will be required to pay all applicable federal income taxes on such distributions.</p>

  <p class="indent">12. The Court shall retain jurisdiction to amend this Order solely for purposes of establishing or maintaining its status as a QDRO; provided, that no amendment of this Order shall require the Plan to provide any type or form of benefits, or any options not otherwise provided under the Plan.</p>

  <p class="indent">13. The parties shall furnish a court-certified copy of this Order to the Plan Administrator as soon as practicable after entry of the Order for a determination whether this Order meets the requirements of a qualified domestic relations order under the Code and ERISA.</p>
`;
