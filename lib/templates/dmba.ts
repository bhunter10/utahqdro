export const dmbaMergeFields = [
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
  "order_reference",
  "percent_amount",
  "marriage_date",
  "divorce_date"
];

export const dmba401kHtmlTemplate = `
  <p class="court-heading"><strong>I.<br />RECITALS</strong></p>

  <p>1. A judgment, decree or order providing for child support, alimony or marital property rights to {{participant_name}}'s spouse, former spouse, child or other dependent has been previously entered in this matter pursuant to state domestic relations laws.</p>

  <p>2. The Court intends this {{order_reference}} to be a Qualified Domestic Relations Order ("QDRO") within the meaning of § 414(p) of the Internal Revenue Code of 1986, as amended ("CODE") and § 206(d) of the Employee Retirement Income Security Act of 1974, as amended ("ERISA").</p>

  <p>3. The Court enters this QDRO pursuant to its authority under Utah law.</p>

  <p>4. This Order creates and recognizes the existence of {{alternate_payee_name}}'s right to receive a portion of the benefits of a certain Plan or Plans Maintained by the Deseret Mutual Employee Pension Plan Trust and administered by Deseret Mutual Benefit Administrators, and payable with respect to the Plan(s) thereunder.</p>

  <p class="court-heading"><strong>II.<br />STATEMENT OF FACTS PURSUANT TO<br />CODE Section 414(p)/ERISA Section 206(d)</strong></p>

  <p>5. This QDRO applies to the Deseret 401(k) Plan ("Plan") administered by Deseret Mutual Benefit Administrators.</p>

  <p>6. {{participant_name}} ("Participant") is a participant in the Plan(s). Participant's information is as follows:</p>

  <p class="subindent">Social Security Number: {{participant_ssn}}<br />Date of birth: {{participant_dob}}<br />Last known mailing address: {{participant_full_address}}<br />Telephone Number: {{participant_phone}}<br />Email address: {{participant_email}}</p>

  <p>7. {{alternate_payee_name}} ("Alternate Payee") is the alternate payee for purposes of this QDRO. Alternate Payee's Information is as follows:</p>

  <p class="subindent">Social Security Number: {{alternate_payee_ssn}}<br />Date of birth: {{alternate_payee_dob}}<br />Last known mailing address: {{alternate_full_address}}<br />Telephone Number: {{alternate_payee_phone}}<br />Email address: {{alternate_payee_email}}</p>

  <p>8. The Participant's Deseret 401(k) Plan benefit payable to the Alternate Payee under this QDRO is {{percent_amount}} of the value of the Plan at the time the QDRO is qualified. Alternate Payee is not responsible for any obligation that may be owed to the Plan.</p>

  <p>9. The Alternate Payee recognizes that the benefits will only be payable upon qualification and processing of this QDRO by the Plan Administrator and no benefits will be retroactively administered.</p>

  <p class="court-heading"><strong>III.<br />RECITALS PURSUANT TO CODE §414(p)(3)/ERISA §206(d)(3)(D)</strong></p>

  <p>10. This QDRO does not require the Plan(s) to provide any type or form of benefit, or any option, the Plan(s) does not otherwise provide.</p>

  <p>11. This QDRO does not require the Plan(s) to provide increased benefits.</p>

  <p>12. This QDRO does not require the Plan(s) to pay any benefits that another Order previously determined to be a qualified domestic relations order requires the Plan(s) to pay to another Alternate Payee.</p>

  <p class="court-heading"><strong>IV.<br />TIME AND MANNER OF PAYMENT</strong></p>

  <p>13. The Plan(s) shall pay, in lump sum or as may be allowed by the Plan(s), the percentage or amount described above, to the Alternate Payee, and the Plan(s) shall pay these amounts as soon as administratively feasible. Any allocable earnings or losses of these amounts will be calculated from the date the QDRO is qualified by Deseret Mutual to the present-day, and not from the date the divorce decree was signed or any other date.</p>

  <p>14. This QDRO does not require the consent of the Participant or the Alternate Payee to any distribution required hereunder, and the Plan(s) may distribute the amount described above without obtaining any further consent from either the Participant or the Alternate Payee.</p>

  <p>15. If the Plan(s) does not permit an immediate distribution of the amount described above, the Plan(s) shall pay that amount at Participant's earliest retirement age as defined by Code § 414(p)(4)(B)/ERISA § 206(d)(3)(E).</p>

  <p>16. After payment of the amount required by this QDRO, Alternate Payee shall have no further claim against Participant's interest in the Plan(s).</p>

  <p>17. Alternate Payee assumes sole responsibility for the tax consequences of his/her distributions under this QDRO.</p>

  <p>18. Until the Plan(s) completes payment of all benefits pursuant to this QDRO, the Plan(s) shall treat the Alternate Payee as a surviving spouse for purposes of Code Sections 401(a)(11) and 417, but Alternate Payee shall receive, as surviving spouse, only the amount described above. The sole purpose of this paragraph is to ensure payment to Alternate Payee in case of Participant's death prior to payment of the Plan(s) of the amounts described above.</p>

  <p>19. In case of Alternate Payee's death, payment shall be made as provided for by the Plan(s).</p>

  <p class="court-heading"><strong>V.<br />PROCEDURE FOR PROCESSING THIS QDRO</strong></p>

  <p>20. The Plan(s) shall treat this QDRO in accordance with Code §414(p)(7)/ERISA § 206(d)(3)(H), and while the Plan(s) is determining whether this order is a qualified domestic relations order, the Plan Administrator shall separately account for the amounts which would have been payable to Alternate Payee.</p>

  <p>21. The Plan Administrator shall promptly notify Participant and Alternate Payee of the receipt of this QDRO, shall notify Participant and Alternate Payee of the Plan's procedures for determining the qualified status of this QDRO, shall determine the qualified status of this QDRO, and shall notify Participant and Alternate Payee of the determination within a reasonable period of time after receipt of this QDRO.</p>

  <p>22. In the event the Administrator does not approve the form of this Order, all parties shall cooperate to devise a form of this Order that is acceptable to the Administrator.</p>

  <p>23. The Court retains jurisdiction over this matter as provided by law.</p>
`;

export const dmbaPensionHtmlTemplate = `
  <p>IT IS HEREBY ORDERED, ADJUDGED AND DECREED:</p>

  <p class="court-heading"><strong>I. RECITALS</strong></p>

  <p>1. A judgment, decree or order providing for marital property rights to {{participant_name}}'s former spouse has been previously entered in this matter pursuant to state domestic relations laws.</p>

  <p>2. The Court intends this {{order_reference}} to be a Qualified Domestic Relations Order ("QDRO") within the meaning of §414(p) of the Internal Revenue Code of 1986, as amended ("CODE") and §206(d) of the Employee Retirement Income Security Act of 1974, as amended ("ERISA").</p>

  <p>3. The Court enters this QDRO pursuant to its authority under Utah Code §30-3-5.</p>

  <p>4. This Order creates and recognizes the existence of {{alternate_payee_name}}'s right to receive a portion of the benefits of a certain Plan or Plans Maintained by the Deseret Mutual Employee Pension Plan Trust and administered by Deseret Mutual Benefit Administrators, and payable with respect to the Plan(s) thereunder.</p>

  <p class="court-heading"><strong>II. STATEMENT OF FACTS PURSUANT TO CODE Section 414(p)/ERISA Section 206(d)</strong></p>

  <p>5. This QDRO applies to the Deseret Mutual Master Retirement Plan ("Plan" or "Plans") administered by Deseret Mutual Benefit Administrators.</p>

  <p>6. {{participant_name}} ("Participant") is a participant in the Plan(s). Participant's information is as follows:</p>

  <p class="subindent">Social Security Number: {{participant_ssn}}<br />Date of birth: {{participant_dob}}<br />Last known mailing address: {{participant_full_address}}<br />Telephone Number: {{participant_phone}}<br />Email address: {{participant_email}}</p>

  <p>7. {{alternate_payee_name}} ("Alternate Payee") is the alternate payee for purposes of this QDRO. Alternate Payee's Information is as follows:</p>

  <p class="subindent">Social Security Number: {{alternate_payee_ssn}}<br />Date of birth: {{alternate_payee_dob}}<br />Last known mailing address: {{alternate_full_address}}<br />Telephone Number: {{alternate_payee_phone}}<br />Email address: {{alternate_payee_email}}</p>

  <p>8. The Participant's Deseret Mutual Master Retirement Plan benefit payable to the Alternate Payee under this QDRO is {{percent_amount}} of all benefits accrued in the Plan by Participant from {{marriage_date}} to {{divorce_date}}.</p>

  <p>9. The Alternate Payee recognizes that the benefits will only be payable upon qualification and processing of this QDRO by the Plan Administrator and no benefits will be retroactively administered.</p>

  <p class="court-heading"><strong>III. RECITALS PURSUANT TO CODE §414(p)(3)/ERISA §206(d)(3)(D)</strong></p>

  <p>10. This QDRO does not require the Plan(s) to provide any type or form of benefit, or any option, the Plan(s) does not otherwise provide.</p>

  <p>11. This QDRO does not require the Plan(s) to provide increased benefits.</p>

  <p>12. This QDRO does not require the Plan(s) to pay any benefits that another Order previously determined to be a qualified domestic relations order requires the Plan(s) to pay to another Alternate Payee.</p>

  <p class="court-heading"><strong>IV. TIME AND MANNER OF PAYMENT</strong></p>

  <p>13. The Plan(s) shall pay, in lump sum or as may be allowed by the Plan(s), the percentage or amount described above, to the Alternate Payee, and the Plan(s) shall pay these amounts as soon as administratively feasible. Any allocable earnings or losses of these amounts will be calculated from the date the QDRO is qualified by Deseret Mutual to the present-day, and not from the date the divorce decree was signed or any other date.</p>

  <p>14. This QDRO does not require the consent of the Participant or the Alternate Payee to any distribution required hereunder, and the Plan(s) may distribute the amount described above without obtaining any further consent from either the Participant or the Alternate Payee.</p>

  <p>15. If the Plan(s) does not permit an immediate distribution of the amount described above, the Plan(s) shall pay that amount at Participant's earliest retirement age as defined by Code § 414(p)(4)(B)/ERISA § 206(d)(3)(E).</p>

  <p>16. After payment of the amount required by this QDRO, Alternate Payee shall have no further claim against Participant's interest in the Plan(s).</p>

  <p>17. Alternate Payee assumes sole responsibility for the tax consequences of his/her distributions under this QDRO.</p>

  <p>18. Until the Plan(s) completes payment of all benefits pursuant to this QDRO, the Plan(s) shall treat the Alternate Payee as a surviving spouse for purposes of Code Sections 401(a)(11) and 417, but Alternate Payee shall receive, as surviving spouse, only the amount described above. The sole purpose of this paragraph is to ensure payment to Alternate Payee in case of Participant's death prior to payment of the Plan(s) of the amounts described above.</p>

  <p>19. In case of Alternate Payee's death, payment shall be made as provided for by the Plan(s).</p>

  <p class="court-heading"><strong>V. PROCEDURE FOR PROCESSING THIS QDRO</strong></p>

  <p>20. The Plan(s) shall treat this QDRO in accordance with Code §414(p)(7)/ERISA § 206(d)(3)(H), and while the Plan(s) is determining whether this order is a qualified domestic relations order, the Plan Administrator shall separately account for the amounts which would have been payable to Alternate Payee.</p>

  <p>21. The Plan Administrator shall promptly notify Participant and Alternate Payee of the receipt of this QDRO, shall notify Participant and Alternate Payee of the Plan's procedures for determining the qualified status of this QDRO, shall determine the qualified status of this QDRO, and shall notify Participant and Alternate Payee of the determination within a reasonable period of time after receipt of this QDRO.</p>

  <p>22. In the event the Administrator does not approve the form of this Order, all parties shall cooperate to devise a form of this Order that is acceptable to the Administrator.</p>

  <p>23. The Court retains jurisdiction over this matter as provided by law.</p>
`;
