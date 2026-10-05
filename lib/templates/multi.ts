export const multiTemplateFamilies = [
  "TIAA",
  "Betterment",
  "Merrill Lynch",
  "Kroger",
  "LPL Financial",
  "PCS",
  "Mass Mutual",
  "Milliman",
  "Mission Square",
  "Northwestern Mutual",
  "Wells Fargo",
  "Athene"
];

export const multiAdp401kFamilies = [
  "ADP",
  "Charles Schwab",
  "John Hancock",
  "Transamerica",
  "Vanguard"
];

export const multiMergeFields = [
  "order_title",
  "order_reference",
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
  "marriage_date",
  "divorce_date",
  "multi_valuation_date",
  "percent_amount",
  "adjust_market"
];

export const multiAdp401kMergeFields = [
  "order_reference",
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
  "employer_full_address",
  "employer_phone",
  "employer_fax",
  "employer_email",
  "plan_number_phrase",
  "plan_number_under_phrase",
  "divorce_date",
  "award_text",
  "multi_valuation_date"
];

export const multiHtmlTemplate = `
  <p class="indent">This has come before the Court based upon a Decree of Divorce entered {{divorce_date}}, and the submission of this {{order_reference}}. The Court having reviewed the file and it appearing there is no just reason for delay, and for good cause appearing, does now make the following Qualified Domestic Relations Order:</p>

  <p class="indent">WHEREAS, this Court has continuing jurisdiction over the parties and the subject matter of this Order; and</p>

  <p class="indent">WHEREAS, the parties and the Court intend that this Order shall be a Qualified Domestic Relations Order (hereinafter referred to as "QDRO") as defined in Section 206(d)(3) of the Employee Retirement Income Security Act of 1974, as amended ("ERISA") and Section 414(p) of the Internal Revenue Code of 1986, as amended; and,</p>

  <p class="indent">WHEREAS, pursuant to the referenced statutes, the Plan Administrator shall make a determination of the qualified status of this Order; and</p>

  <p class="indent">WHEREAS, following approval by the Plan Administrator, this order shall constitute a Qualified Domestic Relations Order; and</p>

  <p class="indent">WHEREAS, the parties have stipulated that the Court enter this Order;</p>

  <p class="indent">NOW, THEREFORE, pursuant to this state's Domestic Relations Laws, IT IS HEREBY</p>

  <p>ORDERED BY THE COURT as follows:</p>

  <p class="indent">1. As used in this Order, the following terms shall apply:</p>

  <p class="subindent">(a) "Participant" shall mean {{participant_name}}, whose current address is {{participant_full_address}}; SSN {{participant_ssn}}; DOB {{participant_dob}}; Phone {{participant_phone}}; Email {{participant_email}}</p>

  <p class="subindent">(b) "Alternate Payee" shall mean {{alternate_payee_name}}, whose current address is {{alternate_full_address}}; SSN {{alternate_payee_ssn}}; DOB {{alternate_payee_dob}}; Phone {{alternate_payee_phone}}; Email {{alternate_payee_email}}</p>

  <p class="subindent">(c) "Plan" shall mean {{formal_plan_name}} ("Plan").</p>

  <p class="indent">2. The Order relates to marital property rights.</p>

  <p class="indent">3. The date of marriage was {{marriage_date}}.</p>

  <p class="indent">4. The date of divorce was {{divorce_date}}.</p>

  <p class="indent">5. The Alternate Payee is the former spouse of the Participant.</p>

  <p class="indent">6. With respect to marital property, alimony or spousal support awards, the Participant and the Alternate Payee are/were considered married for federal income tax purposes.</p>

  <p class="indent">7. The "Valuation Date" shall be {{multi_valuation_date}}.</p>

  <p class="indent">8. <strong>The Alternate Payee's awarded interest in the Plan shall be {{percent_amount}} of the Participant's total vested account balance in the Plan as of the Valuation Date.</strong></p>

  <p class="indent">9. The Alternate Payee's award {{adjust_market}} subject to earnings (dividends, interest, gain and losses) from the Valuation Date to the date that the award is segregated from the Participant's Plan account. The Alternate Payee's award is entitled to earnings after the award is segregated from the Participant's account. From and after the Date of Segregation, the Alternate Payee's award shall be held in an account under the Plan and shall be entitled to all earnings attributable to the investments therein.</p>

  <p class="indent">10. Neither Party shall accept any benefits from the Plan which are the property of the other Party. In the event that the Plan Administrator inadvertently pays to the Participant any benefits that are assigned to the Alternate payee pursuant to the terms of this Order, the Participant shall forthwith return such benefits to the Plan. In the event that the Plan Administrator inadvertently pays to the Alternate Payee any benefits that are not assigned to the Alternate Payee pursuant to the terms of this Order, the Alternate Payee shall forthwith return such benefits to the Plan.</p>

  <p class="indent">11. For purposes of Sections 402 and 72 of the Internal Revenue Code, any Alternate Payee who is the spouse or former spouse of the Participant will be treated as the distributee of any distributions or payments made to the Alternate Payee under the terms of this Order, and as such, will be required to pay the appropriate federal and/or state income taxes on such distribution. If the Alternate Payee is a child or other dependent of the Participant, the Participant will be responsible for any federal and or state income taxes on any such distribution.</p>

  <p class="indent">12. The parties to this Order intend that it comply with the applicable provisions of ERISA and the Internal Revenue Code. Nothing in this Order shall require the Plan or the Plan Administrator to: (a) pay any benefits not permitted under ERISA or the Internal Revenue Code; (b) provide any type or form of benefit or any option not provided under the Plan; (c) provide increased benefits (determined on the basis of actuarial value) under the Plan; (d) pay benefits to the Alternate Payee which are required to be paid to another alternate payee under another order previously determined to be a QDRO; or (e) pay benefits to the Alternate Payee in the form of a qualified joint and survivor annuity for the lives of the Alternate Payee and his or her subsequent spouse.</p>

  <p class="indent">13. The Court shall retain jurisdiction with respect to this Order to the extent required to maintain its qualified status and the original intent of the parties as stipulated herein.</p>

  <p class="indent">14. Administrative fees, if any, will be paid by the parties equally.</p>
`;

export const multiAdp401kHtmlTemplate = `
  <p class="indent">Pursuant to Section 414(p) of the Internal Revenue Code, in recognition of his marital property rights in Participant's retirement account, this {{order_reference}} assigns a portion of the benefits in the {{formal_plan_name}} ("Plan") with plan administrator {{employer_name}}{{plan_number_under_phrase}} from {{participant_name}} ("Participant") to {{alternate_payee_name}} ("Alternate Payee"). This {{order_reference}} is granted in accordance with the domestic relations law of the State of Utah, found in Utah Code 81-1-204, which relates to marital property rights, child support, and/or spousal support between spouses and former spouses in matrimonial actions.</p>

  <p class="court-heading"><strong>SECTION 1. IDENTIFICATION OF THE PLAN</strong></p>

  <p class="indent">This {{order_reference}} applies to benefits maintained in the {{formal_plan_name}} (the "Plan") at {{employer_name}}{{plan_number_phrase}}.</p>

  <p class="court-heading"><strong>SECTION 2. IDENTIFICATION OF PARTICIPANT AND ALTERNATE PAYEE</strong></p>

  <p class="indent">Participant and the Alternate Payee identification and contact information:</p>

  <p class="subindent">a. Participant Information:</p>

  <p class="subindent">Name: {{participant_name}}<br />Address: {{participant_full_address}}<br />Social Security Number: {{participant_ssn}}<br />Birth Date: {{participant_dob}}<br />Telephone: {{participant_phone}}<br />Email: {{participant_email}}</p>

  <p class="subindent">b. Alternate Payee Information:</p>

  <p class="subindent">Name: {{alternate_payee_name}}<br />Address: {{alternate_full_address}}<br />Social Security Number: {{alternate_payee_ssn}}<br />Birth Date: {{alternate_payee_dob}}<br />Telephone: {{alternate_payee_phone}}<br />Email: {{alternate_payee_email}}</p>

  <p class="indent">The Participant has a vested interest in the Plan, and the Alternate Payee is the former spouse of the Participant, and has an interest in all or a portion of the Participant's interest under the Plan, as described in Section 3 below. The Alternate Payee shall have the duty to notify the Plan Administrator in writing of any change in mailing address subsequent to the entry of this Order.</p>

  <p class="court-heading"><strong>SECTION 3. ALTERNATE PAYEE'S BENEFITS</strong></p>

  <p class="indent">The Court recognizes the Alternate Payee's right to receive benefits otherwise payable to the Participant pursuant to the Decree of Divorce signed by this Court on {{divorce_date}}. <strong>Pursuant to the order of the Court, the Alternate Payee's interest in the Plan shall be {{award_text}} of the Participant's account balance as of {{multi_valuation_date}}.</strong> Such interest of Alternate Payee shall be subject to earnings and losses subsequent to {{multi_valuation_date}}.</p>

  <p class="indent">Under no circumstances shall the Alternate Payee's portion of the account include any loan obligation due the Plan from the Participant. On and after the date that a determination is made that this Order is a QDRO, but before the Alternate Payee receives the Alternate Payee's total distribution under the Plan, the Alternate Payee shall be entitled to all of the rights that are afforded to participants under the Plan including, but not limited to, the right to direct investments.</p>

  <p class="court-heading"><strong>SECTION 4. COMMENCEMENT AND FORM OF BENEFITS</strong></p>

  <p class="indent">To the extent permitted under the Plan, benefits in the amount specified above are payable to the Alternate Payee as soon as administratively feasible following the date this Order is determined to constitute a QDRO, in the form of an immediate distribution or a rollover after the Alternate Payee's account has been established under the Plan. Any benefits paid under this Order must comply with the minimum distribution requirements of Code Section 401(a)(9). Any Alternate Payee who is the spouse or former spouse of the Participant shall be treated as the distributee of any distribution of payment made to the Alternate Payee under the terms of this Order and, as such, will be responsible for payment of all taxes attributable to such distribution. In the event that the Participant is paid any benefits that are assigned to the Alternate Payee pursuant to the terms of this Order, the Participant will immediately reimburse the Alternate Payee to the extent he/she has received such payments. In the event of the Alternate Payee's death prior to receiving the full amount required under this Order, such Alternate Payee's beneficiary(ies), as designated on a form provided by the Plan Administrator, shall receive the full balance of any unpaid amounts under the terms of this Order. In the event of the Participant's death before the Alternate Payee's separate account is established under the terms of this Order, such Alternate Payee shall be treated as the surviving spouse of the participant for purposes of receiving any death benefits payable under the Plan, to the extent of the full amount set forth in Section 3 of this Order.</p>

  <p class="court-heading"><strong>SECTION 5. LIMITATIONS</strong></p>

  <p class="indent">In the event there is a conflict between this Order and the terms of the Plan, the provisions of the Plan shall control. This Order is not intended, and shall not be construed in such a manner as to require the Plan: (a) to provide any type or form of benefit, or any option, not otherwise provided under the terms of the Plan; (b) to require the Plan to provide increased benefits determined on the basis of actuarial value; or (c) to pay any benefits to the Alternate Payee that is required to be paid to another alternate payee under another Order previously deemed to be a QDRO.</p>

  <p class="court-heading"><strong>SECTION 6. PLAN ADMINISTRATOR</strong></p>

  <p>The Plan Administrator for the {{formal_plan_name}} ("Plan") is {{employer_name}}{{plan_number_under_phrase}}:</p>

  <p class="subindent"><em>Plan Admin: {{employer_name}}<br />Address: {{employer_full_address}}<br />Phone: {{employer_phone}}<br />Fax: {{employer_fax}}<br />Email: {{employer_email}}</em></p>

  <p class="court-heading"><strong>SECTION 7. JURISDICTION</strong></p>

  <p class="indent">This Court, having jurisdiction over the parties and the Plan subject to this Order, shall retain jurisdiction to enforce this Order and to amend this Order for the purpose of establishing and maintaining this Order as a QDRO.</p>
`;
