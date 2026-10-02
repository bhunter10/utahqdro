export const ihcMergeFields = [
  "order_title",
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
  "marriage_date",
  "divorce_date"
];

function ihc401kTemplate(planAdministratorContact: string) {
  return `
  <p class="indent">This {{order_title}} ("QDRO") provides for the division and disposition of part of the benefits held on behalf of {{participant_name}} (the "Participant") under the Intermountain Healthcare Savings Plus 401(k) Plan (the "Plan") and grants to {{alternate_payee_name}} (the "Alternate Payee") rights in those benefits on the terms set forth in this QDRO.</p>

  <p class="indent">The Court has previously granted and entered its Decree of Divorce in the above-captioned cause on {{divorce_date}}. The Decree provides for the issuance of a supplemental order in the form of a QDRO.</p>

  <p class="indent">This QDRO is issued pursuant to state domestic relations law, Utah Code 81-1-204. This QDRO relates to the provision of child support, alimony payments and/or marital property rights of the Alternate Payee, who is the former spouse of the Participant. This QDRO is intended to meet the requirements of Section 414(p) of the Internal Revenue Code and Section 206(d) of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

  <p class="indent">The Court has examined the records and pleadings on file and being fully advised in the premises, and good cause having been shown,</p>

  <p class="indent">IT IS HEREBY ORDERED:</p>

  <p class="indent">1. <u>Amount to be Paid to Alternate Payee</u></p>

  <p class="subindent">a. That portion of the Participant's entire vested and accrued benefit under the Plan described under paragraph 1(b) hereof, determined as of the most recent Plan valuation date preceding {{valuation_date}} shall be transferred and segregated from the Participant's accounts under the Plan as soon as administratively possible after the Plan's Administrator has received this order. If permitted by the Plan and to the extent allowed under the procedures established by the Plan for qualified domestic relations orders, this amount, together with interest and earnings thereon as provided in Paragraph 4(d) below, shall be paid to the Alternate Payee as soon as practicable after this order has been accepted as a QDRO. Payment shall be made in a lump sum unless the Alternate Payee elects another form of payment in a manner consistent with the Plan's distribution options and procedures on QDROs.</p>

  <p class="subindent">b. With respect to any distribution from the Plan to the Alternate Payee, the Alternate Payee shall provide such requests for payment, elections and consents to payment and receipts of payment as the Plan's Administrator may require. <strong>The transfer from the Participant's Account to the Account established for distribution to the Alternate Payee shall be made in the following manner: The Plan's Administrator shall transfer to the account of the Alternate Payee {{award_text}} of the Participant's Account.</strong></p>

  <p class="indent">2. <u>Names and Addresses</u></p>

  <p class="subindent">a. <u>Participant</u>: The name, current mailing address and social security number of the Participant are:</p>

  <p class="subindent">Name: {{participant_name}}<br />Address: {{participant_full_address}}<br />Social Security Number: {{participant_ssn}}<br />Birth Date: {{participant_dob}}<br />Phone Number: {{participant_phone}}<br />Email: {{participant_email}}</p>

  <p class="subindent">b. <u>Alternate Payee Information</u>:</p>

  <p class="subindent">Name: {{alternate_payee_name}}<br />Address: {{alternate_full_address}}<br />Social Security Number: {{alternate_payee_ssn}}<br />Birth Date: {{alternate_payee_dob}}<br />Telephone: {{alternate_payee_phone}}<br />Email: {{alternate_payee_email}}</p>

  <p class="subindent">c. If the Alternate Payee changes address prior to distribution in full of benefits as provided in this QDRO, the Alternate Payee shall inform the Plan's Administrator of the Alternate Payee's new address. Notice of change of address shall be made in writing to the Plan's Administrator, address as follows:</p>

  <p class="subindent">${planAdministratorContact}</p>

  <p class="subindent">Or to such other address as the Administrator may specify in a written notice to the Alternate Payee.</p>

  <p class="indent">3. <u>Death</u></p>

  <p class="indent">If the Alternate Payee dies before the Alternate Payee has received the full amount due to the Alternate Payee hereunder, the balance of the amount payable under this QDRO shall be paid to the Alternate Payee's estate or designated beneficiary.</p>

  <p class="indent">4. <u>Additional Provisions</u></p>

  <p class="subindent">a. In case of conflict between the terms of this QDRO and the terms of the Plan, the terms of the Plan shall prevail.</p>

  <p class="subindent">b. The Plan's Administrator and the Alternate Payee may modify (by written agreement) any provision of this QDRO without further court approval so long as the change has no adverse effect on the Participant. The Plan's Administrator may unilaterally modify any term of this QDRO to the extent necessary to comply with applicable law, provided such modification does not result in any reduction in the benefit payable to the Alternate Payee hereunder.</p>

  <p class="subindent">c. The Alternate Payee shall be a "beneficiary" of the Plan for purposes of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

  <p class="subindent">d. The Alternate Payee shall be entitled to all interest and earnings on amounts due to the Alternate Payee hereunder, which interest and earnings shall accrue for the benefit of the Alternate Payee from {{valuation_date}} to the date the amounts in the Participant's accounts shall be deemed transferred and segregated from the Participant's Accounts in the Plan.</p>

  <p class="subindent">e. All notices to be given or documents to be sent to the Plan's Administrator shall be addressed in accordance with Paragraph 2 above and shall be deemed given to the Plan on the date mailed or hand-delivered.</p>

  <p class="subindent">f. Distributions to the Alternate Payee under this QDRO shall be taxable to the Alternate Payee and not to the Participant.</p>

  <p class="subindent">g. The Plan and its sponsor and fiduciaries shall not be responsible for any attorney's fees incurred by the Participant or the Alternate Payee in connection with obtaining and enforcing this QDRO.</p>
`;
}

export const ihc401kHtmlTemplate = ihc401kTemplate(
  "Intermountain Retirement Program<br />5245 South College Drive<br />Murray, UT 84123"
);

export const tRowePriceIhc401kHtmlTemplate = ihc401kTemplate(
  "Intermountain Retirement Program<br />5245 South College Drive<br />Murray, UT 84123<br />Submit Certified QDRO c/o QDRO Consultants<br />https://qdros.com/submit/"
);

export const ihcPensionHtmlTemplate = `
  <p class="indent">This {{order_title}} ("QDRO") provides for the division and disposition of part of the benefits due to {{participant_name}} (the "Participant") under the Intermountain Healthcare Pension Plan (the "Plan") and grants to {{alternate_payee_name}} (the "Alternate Payee") rights in those benefits on the terms set forth in this QDRO.</p>

  <p class="indent">The Court has previously granted and entered its Decree of Divorce in the above-captioned cause. The Decree provides for the issuance of a supplemental order in the form of a QDRO.</p>

  <p class="indent">This QDRO is issued pursuant to state domestic relations law of the State of Utah, found in Utah Code 81-1-204. This QDRO relates to the provision of child support, alimony payments and/or marital property rights of the Alternate Payee, who is the spouse of the Participant. This QDRO is intended to meet the requirements of Section 414(p) of the Internal Revenue Code and Section 206(d) of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

  <p class="indent">The Court has examined the records and pleadings on file and being fully advised in the premises, and good cause having been shown,</p>

  <p class="indent">IT IS HEREBY ORDERED:</p>

  <p class="indent">1. <u>Amount to be Paid to Alternate Payee</u></p>

  <p class="subindent">a. The Plan shall pay a benefit to the Alternate Payee in the amount, at the time and in the manner set forth in this Order.</p>

  <p class="subindent">(1) <u>Time and Manner of Distribution</u>: The benefit payable to the Alternate Payee shall be distributable at the earliest date a benefit could be paid to the Participant under the terms of the Plan, without regard to whether the Participant has terminated employment or elected to commence receiving benefits. Distribution to the Alternate Payee may commence at any time thereafter as elected by the Alternate Payee. Payment should be made in a manner consistent with the Plan's distribution options available for alternate payees and the terms and conditions of the Plan prevailing at that time, based upon the Alternate Payee's life expectancy, and as elected by the Alternate Payee. In no event will payments to the Alternate Payee commence later than the earlier of: (A) the Participant's normal retirement date, or (B) the Participant's actual retirement date.</p>

  <p class="subindent">(2) <u>Amount of Benefit</u>: <strong>This Order assigns to Alternate Payee a monthly amount equal to {{award_text}} of the Marital Portion of Participant's vested Accrued Benefit (as such term is defined in the Plan) determined as of the earlier of the date: (i) Participant's benefit accruals cease, or (ii) Alternate Payee's benefits commence. The Marital Portion shall be determined by multiplying Participant's vested Accrued Benefit by a fraction (less than or equal to 1.0), the numerator of which is the Participant's Benefit Service (as such term is defined in the Plan) earned during the marriage (from the date of the marriage on {{marriage_date}} to the date of the divorce on {{divorce_date}}) and the denominator of which is the total number of months of Participant's Benefit Service credited under the Plan as of the earlier of the date: (i) Participant's benefit accruals cease, or (ii) Alternate Payee's benefits commence.</strong> Such monthly amount shall be adjusted to reflect the actuarial adjustments described in subparagraphs (4) and (5) below.</p>

  <p class="subindent">(3) <u>Request for Distribution</u>: At the time of distribution, the Alternate Payee shall provide to the Plan such written requests for distribution, elections, consents to distribution and receipts as the Plan's Administrator may require.</p>

  <p class="subindent">(4) <u>Actuarial Valuation</u>: The Alternate Payee's benefit will be actuarially adjusted using the Plan factors in effect at the time benefits commence so that the present value of the benefit payable to the Alternate Payee will be equal to the present value of such benefit if it were payable to the Participant. In determining such present value where the commencement of benefits to the Alternate Payee is before the Participant retires, it shall be assumed that the Participant's annuity starting date shall be the later of age 65 or the Participant's current age. The actuarial adjustment shall take into account the age difference between the Alternate Payee and the Participant. The Participant's accrued benefit under the Plan shall be reduced actuarially by the equivalent value of the benefit payable to the Alternate Payee, determined as of the earlier of the date benefit payments are commenced to the Alternate Payee or the date benefit payments are commenced to the Participant.</p>

  <p class="subindent">If the benefit of the Alternate Payee commences prior to the annuity starting date of the benefits of the Participant, the benefit of the Alternate Payee shall not include any benefit subsidy or supplement (including any subsidy for early retirement) and shall not be adjusted subsequently to reflect any subsidy or supplement subsequently payable to the Participant. If the benefit of the Alternate Payee commences concurrently with or after the annuity starting date of the benefits of the Participant, the Alternate Payee shall share proportionately in any benefit subsidy or supplement (including any subsidy for early retirement) subsequently payable to the Participant.</p>

  <p class="subindent">(5) <u>Actuarial Assumptions</u>: Any actuarial calculations made pursuant to this QDRO shall be performed by or on behalf of the Plan's Administrator in accordance with the actuarial assumptions and methods used for similar calculations under the Plan.</p>

  <p class="subindent">(6) <u>No Prior Order</u>: There is no prior QDRO which has awarded amounts to another alternate payee which this QDRO awards the Alternate Payee.</p>

  <p class="indent">2. <u>Names and Addresses</u></p>

  <p class="subindent">a. <u>Participant</u>: The name, current mailing address, social security number, date of birth, phone and email of the Participant are:</p>

  <p class="subindent">Name: {{participant_name}}<br />Address: {{participant_full_address}}<br />Social Security Number: {{participant_ssn}}<br />Birth Date: {{participant_dob}}<br />Telephone: {{participant_phone}}<br />Email: {{participant_email}}</p>

  <p class="subindent">b. <u>Alternate Payee</u>: The name, current mailing address, social security number, and date of birth of the Alternate Payee are:</p>

  <p class="subindent">Name: {{alternate_payee_name}}<br />Address: {{alternate_full_address}}<br />Social Security Number: {{alternate_payee_ssn}}<br />Birth Date: {{alternate_payee_dob}}<br />Telephone: {{alternate_payee_phone}}<br />Email: {{alternate_payee_email}}</p>

  <p class="subindent">c. The Participant and Alternate Payee shall inform the Plan Administrator of any change in mailing address or legal name from those set forth, respectively. The Plan Administrator contact information is:</p>

  <p class="subindent">Intermountain Retirement Program<br />5245 South College Drive<br />Murray, UT 84123<br />Phone: (801) 442-7547<br />Email: AskHR@imail.org</p>

  <p class="indent">3. <u>Death</u></p>

  <p class="subindent">a. <u>Alternate Payee</u>: If the Alternate Payee dies before the Alternate Payee has commenced receiving benefits from the Plan, then the share allocated to the Alternate Payee shall revert to the Participant. If the Alternate Payee is in pay status at the time of the Alternate Payee's death then all benefit payments shall cease. After benefit commencement, the death of the Alternate Payee shall not result in any increase in the value of the Participant's benefit under the Plan.</p>

  <p class="subindent">b. <u>Participant</u>: In the event the Participant dies at any time under circumstances which would give rise to payment under the Plan of a qualified pre-retirement survivor annuity if the Participant were married, then unless the Alternate Payee is in pay status, the Alternate Payee shall be treated as the Participant's surviving spouse with respect to all benefits accrued by the Participant under the Plan except any portion thereof:</p>

  <p class="subindent">(1) Previously paid to the Alternate Payee under this QDRO</p>

  <p class="subindent">(2) With respect to which another spouse has been awarded "surviving spouse" status under a prior QDRO</p>

  <p class="subindent">(3) Accruing after the date of the divorce, that is, the portion of the Participant's accrued benefit after such date, which exceeds the benefit the Participant would have had if the Participant had terminated employment on that date with a fully vested benefit.</p>

  <p class="subindent">The benefit payable to the Alternate Payee shall be the qualified pre-retirement survivor annuity, or if permitted by the Plan and if larger, the benefit payable pursuant to this QDRO. The benefit will commence on the Participant's date of death.</p>

  <p class="indent">4. <u>Additional Provisions</u></p>

  <p class="subindent">a. No provision in this QDRO shall be construed to require the Plan, the Plan Administrator of the Plan, or any trustee or other fiduciary with respect to the Plan to take any action, which is inconsistent with any provision of the Plan as now in effect or hereafter amended. In case of conflict between the terms of this QDRO and the terms of the Plan, the terms of the Plan shall prevail.</p>

  <p class="subindent">b. This QDRO is not intended to provide benefits to the Alternate Payee which are required to be paid to another alternate payee under a prior qualified domestic relations order. To the extent any previous qualified domestic relations order has awarded amounts to another alternate payee which this QDRO awards to the Alternate Payee, the duplicate amount awarded hereunder shall not be payable.</p>

  <p class="subindent">c. This QDRO shall not require the Plan to provide any increased benefits (in actuarial value) over those benefits otherwise provided for under the Plan.</p>

  <p class="subindent">d. The Alternate Payee shall be a "beneficiary" of the Plan for purposes of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

  <p class="subindent">e. This QDRO applies to the Plan designated in the initial paragraph of this QDRO and all subsequent employer Plan(s) to which liability for payment of the benefit described in this QDRO may be transferred. Changes in Plan Sponsor, Plan Administrator or change of Plan Name shall not affect this QDRO.</p>

  <p class="subindent">f. The Participant and the Alternate Payee shall each be responsible for his or her own federal, state and local income and other taxes attributable to any and all payments from the Plan, which are received by the Participant and the Alternate Payee, respectively. The Plan shall provide to the Participant and the Alternate Payee in accordance with its customary procedures such information as is normally provided to participants in the Plan with respect to the taxability of distributions from the Plan.</p>

  <p class="subindent">g. The Plan and its sponsor and fiduciaries shall not be responsible for any attorney's fees incurred by the Participant or the Alternate Payee in connection with obtaining and enforcing this QDRO.</p>
`;
