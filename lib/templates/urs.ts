export const ursDefinedContributionMergeFields = [
  "order_reference",
  "party1_name",
  "party2_name",
  "participant_name",
  "participant_full_address",
  "alternate_payee_name",
  "alternate_full_address",
  "marriage_date",
  "divorce_date",
  "case_number",
  "urs_plan_types",
  "award_text",
  "valuation_date",
  "adjust_market_shall",
  "urs_percent_amount"
];

export const ursPensionMergeFields = [
  "order_reference",
  "party1_name",
  "party2_name",
  "participant_name",
  "participant_full_address",
  "alternate_payee_name",
  "alternate_full_address",
  "marriage_date",
  "divorce_date",
  "case_number",
  "urs_percent_amount"
];

export const ursAddendumMergeFields = [
  "party1_name",
  "party2_name",
  "addendum_court_name",
  "case_number",
  "participant_name",
  "participant_ssn",
  "participant_dob",
  "participant_phone",
  "participant_email",
  "alternate_payee_name",
  "alternate_payee_ssn",
  "alternate_payee_dob",
  "alternate_payee_phone",
  "alternate_payee_email",
  "requesting_full_name"
];

export const ursDefinedContributionHtmlTemplate = `
  <p class="indent">This {{order_reference}} is intended to meet the requirements of a "Domestic Relations Order" (DRO) relating to the defined contribution ("DC") savings plans, 401(k), 457 and Individual Retirement Accounts ("Savings Plan") administered by Utah Retirement Systems ("URS"). The DRO is made pursuant to Utah Code 49-11-612, and rules promulgated thereunder. {{party1_name}} is not represented by counsel for purposes of this DRO. {{party2_name}} is not currently represented by counsel for purposes of this DRO.</p>

  <p class="court-heading"><strong>BACKGROUND INFORMATION</strong></p>

  <p class="indent">{{participant_name}} is a Member ("MEMBER") of the Defined Contribution Plans of the Utah Retirement Systems ("URS"), administered by the URS, whose last known address is {{participant_full_address}}. The Alternate Payee's date of birth and Social Security Number have been provided under separate private addendum.</p>

  <p class="indent">{{alternate_payee_name}} is the Alternate Payee ("Alternate Payee") of the Defined Contribution Plans of the Utah Retirement Systems ("URS"), administered by the URS, {{alternate_full_address}}. The Member's date of birth and Social Security Number have been provided under a separate private addendum.</p>

  <p class="indent">The Member and the Alternate Payee were married on {{marriage_date}}. The Member and Alternate Payee were divorced as of {{divorce_date}}, pursuant to a Decree of Divorce entered in the case of In the Matter of the Marriage of: {{party1_name}} and {{party2_name}}, Case No. {{case_number}}.</p>

  <p class="indent">The Participant's URS DC Savings Plan(s) is/are in the form of a {{urs_plan_types}}.</p>

  <p><strong>IT IS HEREBY ORDERED THAT:</strong></p>

  <p>I. BENEFITS</p>

  <p class="indent">1. URS shall distribute the amount from the Participant's account(s) to the Alternate Payee as follows:</p>

  <p class="subindent">A.</p>

  <p class="court-heading">{{urs_plan_types}}<br />{{award_text}}</p>

  <p class="subindent">B. Participant's Account(s) should be valued as of: {{valuation_date}}.</p>

  <p class="subindent">C. The Alternate Payee's interest {{adjust_market_shall}} be adjusted for market fluctuations, which include changes in the stock market, bond market, and other forces which affect the Participant's account between the date to be valued and the date segregated pursuant to this DRO.</p>

  <p class="subindent">D. For purposes of this DRO, the Participant's Account is the Participant's account under a Savings Plan (including elective deferrals and all other employee and employer contributions, transfers, rollovers, gains or losses), less: the outstanding balance of any Savings Plan loans or withdrawals taken by the Participant as of the valuation date indicated in paragraph I. B. above.</p>

  <p class="subindent">E. Upon URS approval of this DRO and within a practicable period of time, URS shall divide the Participant's Account(s) to reflect the Participant's and Alternate Payee's interests under this DRO. If, prior to segregation of the Participant's Account, the account balance has been reduced below the value awarded to the Alternate Payee as described (due to loans, withdrawals, market impact etc.), the Alternate Payee will be awarded the remaining funds in the account. The Alternate Payee's share shall be taken proportionately from each investment in the Participant's Account. The Alternate Payee's share shall be held in such investments until the Alternate Payee takes a distribution or provides new investment directions. The Participant and Alternate Payee shall each have sole authority to invest the vested monies in their own account under the parameters of the 401(k), 457, Roth IRA and Traditional IRA Plan Documents and other governing rules and laws.</p>

  <p class="subindent">F. On the date that URS segregates the Alternate Payee's assigned share of the benefits as set forth above, to the extent there are not sufficient funds in the Participant's accounts to satisfy the award of benefits to the Alternate Payee, then this DRO shall be interpreted as an award of One Hundred Percent (100%) of the Participant's account balance under the Savings Plan as of such segregation date.</p>

  <p>II. TIME OF BENEFIT RECEIPT</p>

  <p class="indent">A. URS will distribute the Alternate Payee's segregated account at the following time, payable in the following manner:</p>

  <p class="subindent">1. The Alternate Payee may elect to receive the vested portion of his or her segregated account from the Savings Plan at any time.</p>

  <p class="subindent">2. The Alternate Payee's portion held within a brokerage window will be transferred to the core funds prior to segregation. This may require URS to liquidate securities held in the brokerage account.</p>

  <p class="subindent">3. The Alternate Payee's benefit may be paid in any form of payment permitted by the Savings Plan and selected by the Alternate Payee.</p>

  <p class="subindent">4. The Alternate Payee may leave his or her segregated account in the Savings Plan, subject to the same rules and required distributions applicable to the Savings Plan.</p>

  <p class="subindent">5. After segregation, the Alternate Payee's funds are not allowed to be transferred into a brokerage window.</p>

  <p class="indent">B. If the Alternate Payee dies before the segregated account is depleted, the Alternate Payee's segregated account balance will be paid to the Alternate Payee's most recent beneficiary designation form on file with URS and according to the provisions of the Savings Plan.</p>

  <p>III. DEATH OF PARTICIPANT</p>

  <p>1. If the Participant dies actively employed with a URS participating employer and a lump sum death benefit is payable pursuant to U.C.A. §§ 49-22-501, 49-23-501. URS shall distribute benefits as follows:</p>

  <p class="indent">A. If the Participant dies prior to retirement, and a death benefit is payable in a lump sum, the Alternate Payee is awarded {{urs_percent_amount}} of the Participant's benefits accrued during the marriage. This percentage is to be used in the following formula:</p>

  <p class="subindent">Years of Credited Service<br />Accrued During Marriage<br />-------------------------------------------- X {{urs_percent_amount}} = Alternate Payee's Portion<br />Total Years of Retirement Credit</p>

  <p>IV. LIMITATIONS OF THIS DRO</p>

  <p class="indent">A. Nothing contained in this DRO shall be construed to require the Savings Plan, Plan administrator and/or URS:</p>

  <p class="subindent">1. To provide to the Alternate Payee any type or form of benefit or any investment option not otherwise available to the Participant under the applicable Savings Plan.</p>

  <p class="subindent">2. To pay any benefits to the Alternate Payee which are required to be paid to another Alternate Payee under another order determined by the Savings Plan administrator to be a DRO.</p>

  <p class="subindent">3. To provide the Alternate Payee a benefit or interest which exceeds the value of the account.</p>

  <p class="indent">B. If a Participant or Alternate Payee receives any distribution that should not have been paid under this DRO, the Participant or Alternate Payee is designated a constructive trustee for the amount received and shall immediately notify URS and comply with written instructions as to the disposition of the amount received.</p>

  <p class="indent">C. The Alternate Payee is ordered to report any payments received on any applicable income tax return in accordance with the Internal Revenue Code provisions or regulations in effect at the time any payments are issued by URS. URS will issue applicable tax forms on any direct payment made to the Alternate Payee. The Participant and Alternate Payee must comply with Internal Revenue Code and any applicable regulations.</p>

  <p class="indent">D. The Alternate Payee is ordered to provide the Savings Plan prompt written notification of any changes in the Alternate Payee's mailing address. URS shall not be liable for failing to make payments to the Alternate Payee if URS does not have a current mailing address for the Alternate Payee at the time of payment.</p>

  <p class="indent">E. A certified copy of this DRO shall be furnished to URS. URS' contact information is:</p>

  <p class="subindent">Utah Retirement Systems<br />Defined Contribution Department<br />P.O. Box 1590, Salt Lake City, Utah 84110-1590<br />Phone 801-366-7720<br />Fax 801-366-7733<br />Email dcplans@urs.org</p>

  <p class="indent">F. The Court retains jurisdiction over this DRO so that it will constitute a Domestic Relations Order under the Savings Plan even though all other matters incidental to this action or proceeding have been fully and finally adjudicated. URS will not accept an Amended DRO if under the original finalized DRO the account or accounts have been divided. URS will accept a new DRO that provides a fixed dollar division of accounts that have been previously divided. If URS determines at any time that changes in the law, administration of the Savings Plan, or any other circumstances make it impractical to calculate the portion of a distribution awarded to an Alternate Payee by this DRO and so notifies the parties, either or both parties shall immediately petition the Court for a reformation of this DRO with fixed dollar amounts only.</p>

  <p class="indent">G. Any DRO requiring market adjustments of more than 7 years must be in a fixed dollar amount with no market adjustment.</p>
`;

export const ursPensionHtmlTemplate = `
  <p class="indent">This {{order_reference}} is intended to meet the requirements of a “Domestic Relations Order” (“DRO”) relating to the Defined Benefit Plans (“Plans”) administered by the Utah Retirement Systems (“URS”.) The DRO is made pursuant to U.C.A. § 49-11-612, and rules promulgated there under.</p>

  <p class="indent">{{participant_name}} is not represented by counsel for purposes of this DRO. {{alternate_payee_name}} is not currently represented by counsel for purposes of this DRO.</p>

  <p class="court-heading"><strong>BACKGROUND INFORMATION</strong></p>

  <p class="indent">{{participant_name}} is a Member ("MEMBER") of the Defined Benefit Plans of the Utah Retirement Systems ("URS"), administered by the URS, whose last known address is {{participant_full_address}}. The Member's date of birth and Social Security Number have been provided under separate private addendum.</p>

  <p class="indent">{{alternate_payee_name}} is the Alternate Payee ("Alternate Payee") whose last known address is {{alternate_full_address}}. The Alternate Payee's date of birth and Social Security Number have been provided under separate private addendum.</p>

  <p class="indent">The Member and the Alternate Payee were married on {{marriage_date}}. The Member and Alternate Payee were divorced as of {{divorce_date}} pursuant to a Decree of Divorce entered in the Matter of the Marriage of {{party1_name}}, and {{party2_name}}, Case No. {{case_number}}.</p>

  <p class="indent">The Member is entitled to retirement benefits under the Defined Benefit Plan.</p>

  <p><strong>IT IS HEREBY ORDERED THAT:</strong></p>

  <p><strong>I. MONTHLY BENEFITS</strong></p>

  <p class="indent">1. URS shall distribute benefits under the Defined Benefit Plan as follows:</p>

  <p class="indent">A. The Alternate Payee is awarded {{urs_percent_amount}} of the Member's benefits accrued during the marriage. This percentage is to be used in the following formula:</p>

  <p class="subindent">Years of Credited Service<br />Accrued During Marriage<br />-------------------------------------------- X {{urs_percent_amount}} = Alternate Payee's Portion<br />Total Years of Retirement Credit</p>

  <p class="indent">The Alternate Payee's share of the Member's accrued benefits shall be converted to an actuarially equivalent amount based on the life expectancy of the Alternate Payee for their life.</p>

  <p class="indent">2. If the Member elects a Partial Lump Sum Option (PLSO) at the time of retirement and the Alternate Payee is to receive a percentage of the monthly benefit, the Alternate Payee will receive the same percentage of the PLSO. The Alternate Payee will not receive a portion of the PLSO if the Alternate Payee is to receive a specific dollar amount.</p>

  <p class="indent">3. For Members of the Tier I Public Employees' Contributory or Noncontributory System(s) and the Tier II Public Employees' and Public Safety and Firefighter Contributory Hybrid System(s) who divorce after retirement and elected a continuing spousal benefit for the Alternate Payee at the time of retirement, the actuarial present value of the remaining payments under the current option will be determined as of the effective date of the DRO. Based on the court ordered percentage, this amount is then divided between the two parties, and then converted to two separate life annuities, one for the Member and one for the Alternate Payee. The continuing spousal benefit will no longer be payable. At the Member's death, the amount of the monthly benefit being paid to the Alternate Payee will not change. At the Alternate Payee's death, the amount of the monthly benefit being paid to the Member will not change.</p>

  <p><strong>II. ESTABLISHMENT OF BENEFITS</strong></p>

  <p class="indent">URS shall begin monthly payments to the Alternate Payee when the Alternate Payee files with URS the appropriate form and the earliest of the following occurs:</p>

  <p class="subindent">1. The Member terminates employment, qualifies for retirement, and applies for benefits; or</p>

  <p class="subindent">2. The month following receipt of an acceptable DRO by URS when the Member is currently retired and receiving benefits under the Plan.</p>

  <p><strong>III. DURATION OF PAYMENTS TO ALTERNATE PAYEE</strong></p>

  <p class="indent">After monthly payments begin to an Alternate Payee, URS shall cease payments at the death of the Alternate Payee. The Alternate Payee's portion does not revert to the Member.</p>

  <p><strong>IV. MEMBER WITHDRAWS FROM RETIREMENT SYSTEM</strong></p>

  <p class="indent">A. If the Member discontinues employment and withdraws the Member's account in a lump sum, the Alternate Payee shall receive {{urs_percent_amount}} of the Member account which accrued during the marriage. The percentage is to be used in the following formula:</p>

  <p class="subindent">Years of Credited Service<br />Accrued During Marriage<br />----------------------------------------------- X {{urs_percent_amount}} = Alternate Payee's Portion<br />Total Years of Retirement Credit</p>

  <p><strong>V. DEATH OF MEMBERS</strong></p>

  <p class="indent">1. If the Member dies prior to retirement and a continuing monthly benefit is created by the death of the Member, the Alternate Payee shall receive such portions of that benefit as granted under Section I - Monthly Benefits if the Alternate Payee meets the definition of surviving spouse pursuant to U.C.A. § 49-11-102(51), which requires that a valid DRO is on file with URS prior to the Member's death date.</p>

  <p class="indent">2. If the Member dies prior to retirement and a refund of the contribution account is part of the death benefit, the Alternate Payee's share will be calculated in accordance with Section IV - Member Withdraws from the Retirement System.</p>

  <p class="indent">3. If the Member dies prior to retirement and a lump sum death benefit is payable pursuant to U.C.A. §§ 49-12-501, 49-13-501, 49-14-501, 49-15-501, 49-16-501, 49-17-501, 49-18-501, 49-19-501, 49-22-501 or 49-23-501. URS shall distribute benefits as follows:</p>

  <p class="subindent">A. If the Member dies prior to retirement, and a death benefit is payable in a lump sum, the Alternate Payee is awarded {{urs_percent_amount}} of the Member's benefits accrued during the marriage. This percentage is to be used in the following formula:</p>

  <p class="subindent">Years of Credited Service<br />Accrued During Marriage<br />----------------------------------------------- X {{urs_percent_amount}} = Alternate Payee's Portion<br />Total Years of Retirement Credit</p>

  <p><strong>VI. LIMITATIONS OF THIS DRO</strong></p>

  <p class="indent">A. The provisions of this DRO shall not apply to long term disability benefits that the participating Member may be entitled to receive.</p>

  <p class="indent">B. If the Alternate Payee dies prior to when monthly benefits should have begun based upon the effective date established by URS under this DRO, the Member's benefit will not be reduced by this DRO.</p>

  <p class="indent">C. If the Alternate Payee dies after monthly benefits should have or have begun based upon the effective date established by URS under this DRO, the Alternate Payee's portion of the benefit does not revert to the Member.</p>

  <p class="indent">D. The Alternate Payee may not assign his/her rights to benefits under this DRO.</p>

  <p class="indent">E. Nothing contained in this DRO shall be construed to require any Plan or Plan administrator:</p>

  <p class="subindent">1. To provide to the Alternate Payee any type or form of benefit or any option not otherwise available to the Member under any Plan.</p>

  <p class="subindent">2. To provide the Alternate Payee benefits, as determined on the basis of actuarial value, not available to the Member.</p>

  <p class="subindent">3. To pay any benefits to the Alternate Payee which are required to be paid to another Alternate Payee under another order determined by the Plan administrator to be a DRO.</p>

  <p class="subindent">4. To provide the Alternate Payee a benefit or interest which exceeds the value of the account.</p>

  <p class="indent">F. If a Member or Alternate Payee receives any distribution that should not have been paid under this DRO, the Member or Alternate Payee is designated a constructive trustee for the amount received and shall immediately notify URS and comply with written instructions as to the distribution of the amount received.</p>

  <p class="indent">G. The Alternate Payee is ordered to report any payments received on any applicable income tax return in accordance with the Internal Revenue Code provisions or regulations in effect at the time any payments are issued by URS. URS will issue applicable tax forms on any direct payment made to the Alternate Payee. The Member and Alternate Payee must comply with Internal Revenue Code and any applicable regulations.</p>

  <p class="indent">H. The Alternate Payee is ordered to provide the plan prompt written notification of any changes in the Alternate Payee's mailing address. URS shall not be liable for failing to make payments to the Alternate Payee if URS does not have a current mailing address for the Alternate Payee at the time of payment.</p>

  <p class="indent">I. Once an Alternate Payee begins receiving monthly payments from the URS defined benefit plan pursuant to the DRO, the amount to be paid or the period for which payments are being made under the original DRO may not be altered.</p>

  <p class="indent">J. Pursuant to U.C.A. § 49-11-1401 an Alternate Payee will forfeit any benefit under a DRO if the Member/Employee has a forfeiture of retirement benefits for employment related felony convictions.</p>

  <p class="indent">K. A certified copy of this DRO shall be furnished to URS.</p>

  <p class="indent">L. The Court retains jurisdiction to amend this DRO so that it will constitute a DRO under the defined benefit plan even though all other matters incidental to this action or proceeding have been fully and finally adjudicated. If URS determines at any time that changes in the law, the administration of the plan, or any other circumstances make it impossible to calculate the portion of a distribution awarded to an Alternate Payee by this DRO and so notifies the parties, either or both parties shall immediately petition the Court for an amended DRO.</p>
`;

export const ursAddendumHtmlTemplate = `
  <section class="urs-addendum">
    <p class="urs-addendum-title"><strong>Approved Domestic Relations Order</strong></p>
    <p class="urs-addendum-subtitle"><em>Defined Benefit / Defined Contribution Savings Plans</em></p>

    <table class="urs-addendum-banner">
      <tbody>
        <tr>
          <td class="urs-addendum-banner-cell"><span class="urs-addendum-banner-text"><strong>PRIVATE SEPARATE ADDENDUM</strong> &raquo; This addendum must accompany all proposed domestic relations orders submitted to URS for pre-approval or approval.</span></td>
        </tr>
      </tbody>
    </table>

    <table class="urs-addendum-table">
      <tbody>
        <tr>
          <td class="addendum-label">Case Name:</td>
          <td class="addendum-value">
            <div class="addendum-line">In the Matter of the Marriage of</div>
            <div class="addendum-line">{{party1_name}}, and {{party2_name}}</div>
          </td>
        </tr>
        <tr>
          <td class="addendum-label">County/City and Court:</td>
          <td class="addendum-value">{{addendum_court_name}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Case No.:</td>
          <td class="addendum-value">{{case_number}}</td>
        </tr>
        <tr>
          <td colspan="2" class="urs-addendum-section">MEMBER INFORMATION</td>
        </tr>
        <tr>
          <td class="addendum-label">Member Name:</td>
          <td class="addendum-value">{{participant_name}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Member Social Security Number:</td>
          <td class="addendum-value">{{participant_ssn}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Member Date of Birth:</td>
          <td class="addendum-value">{{participant_dob}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Member Phone Number:</td>
          <td class="addendum-value">{{participant_phone}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Member Email:</td>
          <td class="addendum-value">{{participant_email}}</td>
        </tr>
        <tr>
          <td colspan="2" class="urs-addendum-section">ALTERNATE PAYEE INFORMATION</td>
        </tr>
        <tr>
          <td class="addendum-label">Alternate Payee Name:</td>
          <td class="addendum-value">{{alternate_payee_name}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Alternate Payee Social Security Number:</td>
          <td class="addendum-value">{{alternate_payee_ssn}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Alternate Payee Date of Birth:</td>
          <td class="addendum-value">{{alternate_payee_dob}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Alternate Payee Phone Number:</td>
          <td class="addendum-value">{{alternate_payee_phone}}</td>
        </tr>
        <tr>
          <td class="addendum-label">Alternate Payee Email:</td>
          <td class="addendum-value">{{alternate_payee_email}}</td>
        </tr>
      </tbody>
    </table>

    <p class="urs-addendum-provided">This information provided by:</p>
    <p class="urs-addendum-signature"><strong>Signature:</strong> ___________________________________________________</p>
    <p class="urs-addendum-field"><strong>Print Name:</strong> {{requesting_full_name}}</p>
  </section>
`;
