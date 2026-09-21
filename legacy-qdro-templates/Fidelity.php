<?php
/**
 * Template Name: Fidelity Template
 * Version: 1.1
 * Description: A compliant Gravity PDF template.
 * Group: UtahQDRO
 * Required PDF Version: 4.0
 */

if ( ! class_exists( 'GFForms' ) ) {
    return;
}

// Court fields
$district   = isset( $form_data['field'][141] ) ? strtoupper( $form_data['field'][141] ) : '';
$county     = isset( $form_data['field'][140] ) ? strtoupper( $form_data['field'][140] ) : '';
$court_name = isset( $form_data['field'][139] ) ? strtoupper( $form_data['field'][139] ) : '';

// Account owner selection (label, since "Show Values" is off)
$account_owner_value = rgar( $entry, '109' );
if ( empty( $account_owner_value ) ) {
    $account_owner_value = $form_data['field'][109] ?? '';
}

//amended text field
$amended_text = trim($form_data['field'][174] ?? '');

// Default name and address values
$owner_first_name = 'Unknown';
$owner_last_name  = 'Owner';
$owner_address_line1 = 'Unknown Address';
$owner_address_line2 = '';
$owner_city = '';
$owner_state = '';
$owner_zip = '';

// Party 1 and Party 2 data
$party1_name = $form_data['field'][48] ?? [];
$party2_name = $form_data['field'][64] ?? [];

$party1_address = $form_data['field'][49] ?? [];
$party2_address = $form_data['field'][66] ?? [];

$party1_ssn = $form_data['field'][53] ?? '';
$party2_ssn = $form_data['field'][69] ?? '';

$party1_email = $form_data['field'][51] ?? '';
$party2_email = $form_data['field'][67] ?? '';

$party1_dob = $form_data['field'][55] ?? '';
$party2_dob = $form_data['field'][65] ?? '';

$party1_phone = $form_data['field'][50] ?? '';
$party2_phone = $form_data['field'][68] ?? '';

// Determine owner info based on selected party
if ( $account_owner_value === 'Party 1 (First person named in your case)' ) {
    $owner_first_name = ucfirst($party1_name['first'] ?? 'Unknown');
    $owner_last_name  = ucfirst($party1_name['last'] ?? 'Owner');

    // address
    $owner_address_line1 = $party1_address['street1'] ?? $party1_address['street'] ?? 'Unknown Address';
    $owner_address_line2 = $party1_address['street2'] ?? $party1_address['line2'] ?? '';
    $owner_city          = $party1_address['city']    ?? '';
    $owner_state         = $party1_address['state']   ?? '';
    $owner_zip           = $party1_address['zip']     ?? '';
    $owner_ssn           = $party1_ssn;
    $owner_email         = $party1_email;
    $owner_dob           = $party1_dob;
    $owner_phone         = $party1_phone;

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    $owner_first_name = ucfirst($party2_name['first'] ?? 'Unknown');
    $owner_last_name  = ucfirst($party2_name['last'] ?? 'Owner');

    $owner_address_line1 = $party2_address['street1'] ?? $party2_address['street'] ?? 'Unknown Address';
    $owner_address_line2 = $party2_address['street2'] ?? $party2_address['line2'] ?? '';
    $owner_city          = $party2_address['city']    ?? '';
    $owner_state         = $party2_address['state']   ?? '';
    $owner_zip           = $party2_address['zip']     ?? '';
    $owner_ssn           = $party2_ssn;
    $owner_email         = $party2_email;
    $owner_dob           = $party2_dob;
    $owner_phone         = $party2_phone;
}

// Combine full address for display
$owner_full_address = ucwords(trim($owner_address_line1));
if ($owner_address_line2) {
    $owner_full_address .= ",\n" . ucwords(trim($owner_address_line2));
}
$owner_full_address .= ",\n" . ucwords(trim("{$owner_city}, {$owner_state} {$owner_zip}"));


// Find the receiver of account
$receiver_first_name = 'Unknown';
$receiver_last_name  = 'Receiver';
$receiver_address_line1 = 'Unknown Address';
$receiver_address_line2 = '';
$receiver_city = '';
$receiver_state = '';
$receiver_zip = '';

// Determine other party (not selected in field 109)
if ( $account_owner_value === 'Party 1 (First person named in your case)' ) {
    // Receiver is Party 2
    $receiver_first_name = ucfirst($party2_name['first'] ?? 'Unknown');
    $receiver_last_name  = ucfirst($party2_name['last'] ?? 'Receiver');

    $receiver_address_line1 = $party2_address['street1'] ?? $party2_address['street'] ?? 'Unknown Address';
    $receiver_address_line2 = $party2_address['street2'] ?? $party2_address['line2'] ?? '';
    $receiver_city          = $party2_address['city']    ?? '';
    $receiver_state         = $party2_address['state']   ?? '';
    $receiver_zip           = $party2_address['zip']     ?? '';
    $receiver_ssn           = $party2_ssn;
    $receiver_email         = $party2_email;
    $receiver_dob           = $party2_dob;
    $receiver_phone         = $party2_phone;

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    // Receiver is Party 1
    $receiver_first_name = ucfirst($party1_name['first'] ?? 'Unknown');
    $receiver_last_name  = ucfirst($party1_name['last'] ?? 'Receiver');

    $receiver_address_line1 = $party1_address['street1'] ?? $party1_address['street'] ?? 'Unknown Address';
    $receiver_address_line2 = $party1_address['street2'] ?? $party1_address['line2'] ?? '';
    $receiver_city          = $party1_address['city']    ?? '';
    $receiver_state         = $party1_address['state']   ?? '';
    $receiver_zip           = $party1_address['zip']     ?? '';
    $receiver_ssn           = $party1_ssn;
    $receiver_email         = $party1_email;
    $receiver_dob           = $party1_dob;
    $receiver_phone         = $party1_phone;
}

// Combine full address for display
$receiver_full_address = ucwords(trim($receiver_address_line1));
if ($receiver_address_line2) {
    $receiver_full_address .= ",\n" . ucwords(trim($receiver_address_line2));
}
$receiver_full_address .= ",\n" . ucwords(trim("{$receiver_city}, {$receiver_state} {$receiver_zip}"));


//marriage and divorce date
//Get raw date values from the form
$marriage_date_raw = $form_data['field'][56] ?? '';
$divorce_date_raw  = $form_data['field'][57] ?? '';

//Format the dates if set
$marriage_date = '';
if (!empty($marriage_date_raw)) {
    $marriage_date_obj = DateTime::createFromFormat('m/d/Y', $marriage_date_raw);
    if ($marriage_date_obj) {
        $marriage_date = $marriage_date_obj->format('F j, Y');
    }
}

$divorce_date = '';
if (!empty($divorce_date_raw)) {
    $divorce_date_obj = DateTime::createFromFormat('m/d/Y', $divorce_date_raw);
    if ($divorce_date_obj) {
        $divorce_date = $divorce_date_obj->format('F j, Y');
    }
}



// Division type fields:
// $form_data['field'][25] - "percentage" or "fixed amount"
// $form_data['field'][27] - Fixed amount (if selected)
// $form_data['field'][29] - Fixed amount valuation date
// $form_data['field'][33] - Percentage amount (if selected)
// $form_data['field'][34] - Percentage amount valuation date

//division type based on question fixed or percentage
$division_type = strtolower(trim($form_data['field'][25] ?? ''));

if ( $division_type === 'fixed' ) {
    $valuation_date_raw = $form_data['field'][29] ?? '';
} elseif ( $division_type === 'percentage' ) {
    $valuation_date_raw = $form_data['field'][34] ?? '';
} else {
    $valuation_date_raw = '';
}

$valuation_date = '';
// Check if both field 29 and 34 are blank
$field_29_raw = trim($form_data['field'][29] ?? '');
$field_34_raw = trim($form_data['field'][34] ?? '');

if (empty($field_29_raw) && empty($field_34_raw)) {
    $valuation_date = 'the "Date of Transfer" meaning the date the Alternate Payee\'s account under the Plan is funded following qualification of this Order';
} elseif (!empty($valuation_date_raw)) {
    $valuation_date_obj = DateTime::createFromFormat('m/d/Y', $valuation_date_raw);
    if ($valuation_date_obj) {
        $valuation_date = $valuation_date_obj->format('F j, Y');
    } else {
        $valuation_date = 'Valuation date format is invalid';
    }
} else {
    $valuation_date = 'Valuation date not provided';
}

//market adjustment
$market_adjustment_value = rgar( $entry, '146' );
if ( empty( $market_adjustment_value ) ) {
    $market_adjustment_value = $form_data['field'][146] ?? '';
}
$market_adjustment_raw = strtolower(trim($market_adjustment_value));

if ( $market_adjustment_raw === 'no' ) {
    $adjust_market = 'is not';
} else {
    $adjust_market = 'is';
}

//formal plan name
$formal_plan_name = $form_data['field'][144] ?? '';

//your name fields
$your_name = $form_data['field'][130] ?? [];
$your_first_name = ucfirst($your_name['first'] ?? '');
$your_last_name = ucfirst($your_name['last'] ?? '');

//entity name and account type
$entity_name = $form_data['field'][147] ?? '';
$account_type = $form_data['field'][132] ?? '';
$employer_name = trim($form_data['field'][37] ?? '');

//amounts
$fixed_amount = trim($form_data['field'][27] ?? '');
$percent_amount = trim($form_data['field'][33] ?? '') . '%';

//display amount based on division type
if ($division_type === 'fixed' && !empty($fixed_amount)) {
    $display_amount = '$' . number_format((float)$fixed_amount, 2);
} elseif ($division_type === 'percentage' && !empty(trim($form_data['field'][33] ?? ''))) {
    $display_amount = $percent_amount;
} else {
    $display_amount = '[AMOUNT NOT PROVIDED]';
}


?>

<style>
	@page {
	  margin-top: 1.5in;
	  margin-bottom: 1in;
	  margin-left: 1in;
	  margin-right: 1in;
	}
	body {
	  margin: 0;
	  padding: 0;
	}
	p {
		margin: 10px 0;
		line-height: 1.5;
	}
	.section {
		page-break-inside: avoid;
	}
	.header-table,
	.case-info-table {
		width: 100%;
		margin-top: 10px;
		border-collapse: collapse;
	}
	.case-info-table td {
		border-top: 1px solid black;
		border-bottom: 1px solid black;
		padding: 15px;
		vertical-align: top;
	}
	.signature-block {
		margin-top: 20px;
		border-collapse: collapse;
	}
</style>


	David J. Hunter (9015)<br>
	3915 Timpview Dr., Provo, UT 84604<br>
	801-473-4444 dave@utahmediations.com<br>
	<span style="font-style: italic;">Counsel for <?php echo $your_first_name . ' ' . $your_last_name; ?></span>

	<p style="text-align:center; margin-top:20px;">
		IN THE <?php echo $district; ?> JUDICIAL DISTRICT COURT IN AND FOR <?php echo $county; ?> COUNTY<br>
		STATE OF UTAH
	</p>

	<table class="case-info-table">
		<tr>
			<td style="padding:20px 20px 20px 0; width:50%; border-right:1px solid black;">
				In the Matter of the Marriage of<br><br>
				<?php echo strtoupper($party1_name['first'] ?? '') . ' ' . strtoupper($party1_name['last'] ?? ''); ?>, and<br>
				<?php echo strtoupper($party2_name['first'] ?? '') . ' ' . strtoupper($party2_name['last'] ?? ''); ?>.
			</td>
			<td style="padding:20px 0 20px 20px; width:50%;">
				<?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>QUALIFIED DOMESTIC RELATIONS ORDER<br><br>
				Re: <?php echo esc_html($entity_name . ' ' . $account_type); ?><br><br>
				Case No. {What is your case number?:142}<br>
				Judge {Who was the judge that signed your decree?:143}
			</td>
		</tr>
	</table>

	<p style="text-indent: 3em;">WHEREAS this Court has jurisdiction over Petitioner and Respondent and the subject matter of this Order pursuant to Utah Code 81-1-204; and</p>


	<p style="text-indent: 3em;">WHEREAS Petitioner, Respondent and the Court intend that this Order shall be a <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Qualified Domestic Relations Order (hereinafter referred to as a “QDRO”) as defined in Section 206(d)(3) of the Employee Retirement Income Security Act of 1974, as amended (“ERISA”) and Section 414(p) of the Internal Revenue Code of 1986, as amended (the “Code”); and,</p>

	<p style="text-indent: 3em;">WHEREAS, the parties have stipulated that the Court enter this Order, or the Court has determined that this Order shall enter;</p>

	<p style="text-indent: 3em;">NOW, THEREFORE, IT IS HEREBY ORDERED BY THE COURT as follows:</p>
	
	<p style="text-indent: 3em;">1.	As used in this Order, the following terms shall apply:</p>
	<p style="text-indent: 6em;">(a)	<strong>Participant</strong> shall mean <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>, whose current address is <?php echo esc_html($owner_full_address); ?>; SSN <?php echo esc_html($owner_ssn); ?>; DOB <?php echo esc_html($owner_dob); ?>; Phone <?php echo esc_html($owner_phone); ?>; Email <?php echo esc_html($owner_email); ?></p>
	
	<p style="text-indent: 6em;">(b)	<strong>Alternate Payee</strong> shall mean <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?>, whose current address is <?php echo esc_html($receiver_full_address); ?>; SSN <?php echo esc_html($receiver_ssn); ?>; DOB <?php echo esc_html($receiver_dob); ?>; Phone <?php echo esc_html($receiver_phone); ?>; Email <?php echo esc_html($receiver_email); ?></p>
	<p style="text-indent: 6em;">(c)	<strong>Plan</strong> shall mean <?php echo esc_html($formal_plan_name); ?> (“Plan”).</p>
	<p style="text-indent: 6em;">(d)	<strong>Plan Sponsor</strong> shall mean <?php echo esc_html($employer_name); ?>.</p>
	<p style="text-indent: 6em;">(e)	This order is to be reviewed <strong><u>only</u></strong> as it relates to the plans on Fidelity's QDRO Review Service.</p>

	<p style="text-indent: 3em;">2. The Alternate Payee is the former spouse of the Participant.</p>
	<p style="text-indent: 3em;">3. The Order relates to marital property rights.</p>
	<p style="text-indent: 3em;">4. The Participant and the Alternate Payee are/were considered married for federal income tax purposes.</p>
	<p style="text-indent: 3em;">5. The Participant and the Alternate Payee’s <strong>Marital History</strong>:</p>
	
	
	<p style="text-indent: 6em;">Date of Marriage: <?php echo esc_html ($marriage_date); ?>.</p>
	<p style="text-indent: 6em;">Date of Divorce: <?php echo esc_html($divorce_date); ?>.</p>


	<p style="text-indent: 3em;">6. The Valuation Date shall be for the purposes of calculating the Alternate Payee’s award shall mean: <?php echo esc_html($valuation_date); ?> OR DATE OF SEGREGATION.</p>

	<p style="text-indent: 3em;">7. <strong>The Alternate Payee’s awarded interest in the Plan shall be <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the Participant’s total vested account balance under the Plan as of the Valuation Date stated above</strong>.</p>
	
	<p style="text-indent: 3em;">8. The Alternate Payee’s award <?php echo esc_html($adjust_market); ?> entitled to <strong>earnings</strong> (defined as gains, lossses, dividends and interest) from the Valuation Date to the date that the award is segregated from the Participant’s account.</p>

	<p style="text-indent: 3em;">9. In the event that there is an outstanding loan balance as of the Valuation Date, the <strong>outstanding loan balance</strong>: WILL NOT be included for purposes of calculating the total vested account balance to be divided. If the Plan does not allow for loans, this provision will be disregarded.</p>

	<p style="text-indent: 3em;">10. To the extent allowed by the Plan, the <strong>Alternate Payee may initiate a distribution</strong> of the award as soon as administratively feasible following the qualification of this Order and segregation of the Alternate Payee’s award. The distribution must be made in accordance with the administrative procedures established for the Plan.</p>

	<p style="text-indent: 3em;">11. The Alternate Payee’s award will be <strong>transferred proportionally</strong> from all standard plan investment options in which the Participant's account is invested as of the Date of Segregation (not including BrokerageLink). In the event that the Participant has a BrokerageLink account and there are insufficient funds in the standard plan investment options in the Participant’s Plan account balance to satisfy the Alternate Payee’s award, the Participant's BrokerageLink account will be liquidated (using a last in, first out methodology) until sufficient assets have been obtained to satisfy the Alternate Payee's award.</p>

	<p style="text-indent: 3em;">12. The allocation of the <strong>tax cost basis</strong> to the Alternate Payee will be calculated based on the contribution sources in the Participant's account(s) as of the Valuation Date. Pursuant to Section 72(m)(10) of the Code, the tax cost basis of the investment options in the Participant’s account(s) must be transferred to the Alternate Payee proportionally from all contribution sources.</p>

	<p style="text-indent: 3em;">
		13. In the event of the <strong>Alternate Payee's death</strong> after the qualification of this
Order, either prior to or subsequent to the segregation of assets for the Alternate Payee,
the Alternate Payee's award will be distributed pursuant to the administrative procedures
established for the Plan. To the extent allowed by the Plan, all beneficiary designations
will be made after the qualification of the Order and segregation of the award into a
separate account for the Alternate Payee pursuant to the administrative procedures
established for the Plan.</p>

	<p style="text-indent: 3em;">
		14. <strong>Neither Party shall accept any benefits from the Plan</strong> which are the
	property of the other Party. In the event that the Plan sponsor inadvertently pays to the
	Participant any benefits that are assigned to the Alternate Payee pursuant to the terms of
	this Order, the Participant shall forthwith return such benefits to the Plan. In the event that
	the Plan sponsor inadvertently pays to the Alternate Payee any benefits that are not
	assigned to the Alternate Payee pursuant to the terms of this Order, the Alternate Payee
	shall forthwith return such benefits to the Plan.</p>

	<p style="text-indent: 3em;">
		15. For purposes of Sections 402 and 72 of the Code, an Alternate Payee who is
	the spouse or former spouse of the Participant will be treated as the distributee of any
	distributions or payments made to the Alternate Payee under the terms of this Order, and
	as such, will be required to pay the appropriate federal and/or state income taxes on such
	distribution. If the Alternate Payee is a child or other dependent of the Participant, the
	Participant will be responsible for any federal and/or state income taxes on any such
	distribution.</p>

	<p style="text-indent: 3em;">
		16. <strong>Order Review Fees</strong>: The one-time fee for review of the domestic relations
	order will be deducted 50% from the Participant's account and 50% from the Alternate
	Payee's account. The fee will be deducted from the investment options in the applicable
	account(s) according to the plan-level fee method in effect as of the date the fee is
	deducted.</p>

	<p style="text-indent: 3em;">If the Order is determined to be non-qualified following the first review, the review fee will be deducted from the Participant’s account. If applicable, the Participant will be reimbursed from the Alternate Payee’s account following qualification of a subsequent Amended Order. Such fee adjustment will be a current transaction as of the date of the reimbursement.</p>



	<p style="text-indent: 3em;">17. The Court shall retain jurisdiction with respect to this Order to the extent
required to maintain its qualified status and the intent of the parties.</p>


	<table class="signature-block">
		<tr>
			<td style="padding-left: 3em; vertical-align: top;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top;">
					__________________________________<br>
					<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>, Participant<br>
					(Signed Electronically)
			</td>
		</tr>
		<tr>
			<td style="padding-left: 3em; vertical-align: top; padding-top:3em;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top; padding-top:3em;">
					__________________________________<br>
					<?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?>, Alternate Payee<br>
					(Signed Electronically)
			</td>
		</tr>
	</table>

	<p style="text-align:center; padding-top:30px"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
