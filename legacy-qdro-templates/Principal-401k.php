<?php
/**
 * Template Name: Principal - 401k
 * Version: 1.0
 * Description: A compliant Gravity PDF template.
 * Group: UtahQDRO
 * Required PDF Version: 4.0
 */

if ( ! class_exists( 'GFForms' ) ) {
    return;
}

//amended text field
$amended_text = trim($form_data['field'][174] ?? '');

// Court fields
$district   = isset( $form_data['field'][141] ) ? strtoupper( $form_data['field'][141] ) : '';
$county     = isset( $form_data['field'][140] ) ? strtoupper( $form_data['field'][140] ) : '';
$court_name = isset( $form_data['field'][139] ) ? strtoupper( $form_data['field'][139] ) : '';

// Account owner selection (label, since "Show Values" is off)
$account_owner_value = rgar( $entry, '109' );
if ( empty( $account_owner_value ) ) {
    $account_owner_value = $form_data['field'][109] ?? '';
}

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
$owner_full_address = ucwords(strtolower(trim($owner_address_line1)));
if ($owner_address_line2) {
    $owner_full_address .= ",\n" . ucwords(strtolower(trim($owner_address_line2)));
}
$owner_state_formatted = (strlen(trim($owner_state)) == 2) ? strtoupper($owner_state) : ucwords(strtolower($owner_state));
$owner_full_address .= ",\n" . ucwords(strtolower(trim($owner_city))) . ", " . $owner_state_formatted . " " . trim($owner_zip);


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
$receiver_full_address = ucwords(strtolower(trim($receiver_address_line1)));
if ($receiver_address_line2) {
    $receiver_full_address .= ",\n" . ucwords(strtolower(trim($receiver_address_line2)));
}
$receiver_state_formatted = (strlen(trim($receiver_state)) == 2) ? strtoupper($receiver_state) : ucwords(strtolower($receiver_state));
$receiver_full_address .= ",\n" . ucwords(strtolower(trim($receiver_city))) . ", " . $receiver_state_formatted . " " . trim($receiver_zip);


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

//contract number
$contract_number = str_replace('#', '', $form_data['field'][145] ?? '');

// Phone formatting function
function format_phone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($phone) == 10) {
        return '(' . substr($phone, 0, 3) . ') ' . substr($phone, 3, 3) . '-' . substr($phone, 6);
    }
    return $phone;
}

//employer fields
$employer_name = ucfirst($form_data['field'][37] ?? '');
$employer_phone = format_phone($form_data['field'][42] ?? '');
$employer_address = $form_data['field'][166] ?? [];
$employer_fax = format_phone($form_data['field'][176] ?? '');
$employer_email = $form_data['field'][168] ?? '';

// Format employer address
$employer_address_line1 = $employer_address['street1'] ?? $employer_address['street'] ?? '';
$employer_address_line2 = $employer_address['street2'] ?? $employer_address['line2'] ?? '';
$employer_city = $employer_address['city'] ?? '';
$employer_state = $employer_address['state'] ?? '';
$employer_zip = $employer_address['zip'] ?? '';

$employer_full_address = ucwords(strtolower(trim($employer_address_line1)));
if ($employer_address_line2) {
    $employer_full_address .= ",\n" . ucwords(strtolower(trim($employer_address_line2)));
}
$employer_state_formatted = (strlen(trim($employer_state)) == 2) ? strtoupper($employer_state) : ucwords(strtolower($employer_state));
$employer_full_address .= ",\n" . ucwords(strtolower(trim($employer_city))) . ", " . $employer_state_formatted . " " . trim($employer_zip);

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
                Re: Principal 401k<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>

	<p style="text-align:center"><?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>QUALIFIED DOMESTIC RELATIONS ORDER</p>

	<p>It is intended that this <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order constitute a "Qualified Domestic Relations Order" ("QDRO") as defined in Section 414(p) of the Internal Revenue Code of 1986, as amended (the "Code"), and Section 206(d)(3)(B) of the Employee Retirement Income Security Act of 1974 ("ERISA").</p>

	<p style="text-indent: 3em;">1. This Order applies to <?php echo esc_html($formal_plan_name); ?> (the "Plan").<?php 
		$employer_associated = rgar($entry, '36') ?: ($form_data['field'][36] ?? '');
		if (strtolower(trim($employer_associated)) === 'yes') {
			echo ' The Plan Administrator of the Plan is ' . esc_html($employer_name) . '.';
		}
	?></p>


	<p style="padding-left:3em;">
		2.	<u>Participant Information</u>:  The name, Last known address, social security number, and date of birth of the Participant are:
		<div style="padding-left:5em;">
			Name: <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
			Address: <?php echo esc_html($owner_full_address); ?><br>
			Phone Number: <?php echo esc_html($owner_phone); ?><br>
			Email: <?php echo esc_html($owner_email); ?><br>
			Social Security Number:	<?php echo esc_html($owner_ssn); ?><br>
			Date of Birth:	<?php echo esc_html($owner_dob); ?>
		</div>
	</p>

	<p style="padding-left:3em;">
		3.	<u>Alternate Payee Information</u>:  The name, last known address, social security number and date of birth of the Alternate Payee are:
		<div style="padding-left:5em;">
			Name: <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
			Address: <?php echo esc_html($receiver_full_address); ?><br>
			Phone Number: <?php echo esc_html($receiver_phone); ?><br>
			Email: <?php echo esc_html($receiver_email); ?><br>
			Social Security Number:	<?php echo esc_html($receiver_ssn); ?><br>
			Date of Birth:	<?php echo esc_html($receiver_dob); ?>
		</div>
	</p>


	<p style="text-indent: 3em;">The Alternate Payee shall notify the Plan Administrator in writing of any changes in mailing address subsequent to the entry of this Order.  Notice of change of address shall be made in writing to the Plan’s Administrator, address as follows:</p>
	
	<p style="padding-left: 5em;">
		<?php if (strtolower(trim($employer_associated)) === 'yes') { ?>
			Plan Admin:  <?php echo esc_html($employer_name); ?><br>
			Address: <?php echo esc_html($employer_full_address); ?><br>
			<?php if (!empty($employer_phone)) echo 'Phone: ' . esc_html($employer_phone) . '<br>'; ?>
			<?php if (!empty($employer_fax)) echo 'Fax: ' . esc_html($employer_fax) . '<br>'; ?>
			<?php if (!empty($employer_email)) echo 'Email: ' . esc_html($employer_email); ?>
			<?php } else { ?>
				Principal Life Insurance Co.<br>
				401k Plan Administrator<br>
				PO Box 9394<br>
				Des Moines, IA 50306-9394<br>
				Phone:  800-986-3343<br>
				Fax:  866-704-3481
		<?php } ?>
	</p>
	<p style="text-indent: 3em;">
		4. This Order assigns to the Alternate Payee as sole and separate property an amount equal to <?php echo esc_html($display_amount); ?> of the vested account balance under the Plan determined as of <?php echo esc_html($valuation_date); ?> ("Assigned Benefit"). 
	</p>
	<p style="text-indent: 3em;">
		The Participant's vested account balance includes the outstanding balance of any loan made to the Participant, and the Participant shall remain responsible for repaying the outstanding loan balance, if any.
	</p>
	<p style="text-indent: 3em;">The Alternate Payee’s Assigned Benefit <?php echo esc_html($adjust_market); ?> entitled to earnings (dividends, interest, gains, and losses) from the date of its determination listed above to the date of its full distribution.
</p>
	<p style="text-indent: 3em;">The Alternate Payee's share of the benefits shall be allocated on a pro-rata basis among all of the Participant's investment funds maintained under the Plan. 
</p>
	<p style="text-indent: 3em;">
		5. The Participant and Alternate Payee agree to equally share any additional costs for administrative services incurred by the Plan due to the review and implementation of the terms of this Order.
	</p>
	<p style="text-indent: 3em;">
		6. Except as otherwise provided in this Order, on and after the date that this Order is deemed to be a QDRO, but before the Alternate Payee receives a total distribution under the Plan, the Alternate Payee shall be considered a "beneficiary" within the meaning of the Code and ERISA and shall be entitled to such rights, privileges and options as are available to beneficiaries including, but not limited to, the rules regarding the right to designate a beneficiary for death benefit purposes and the right to direct plan investments to the extent permitted under the terms of the Plan.
	</p>
	<p style="text-indent: 3em;">
		7. This Order is not intended, and shall not be constructed in such a manner as to require the plan:
	</p>
	<p style="padding-left: 5em;">(a) to provide any type or form of benefit the Plan does not otherwise provide; or</p>
	<p style="padding-left: 5em;">(b) to require the Plan to provide increased benefits (determined on the basis of actuarial value); or</p>
	<p style="padding-left: 5em;">
		(c) to require the Plan to pay any benefits to the Alternate Payee that are required to be paid to another alternate payee under another order previously determined to be a QDRO.
	</p>
	
	<p style="text-indent: 3em;">
		8.	If the Alternate Payee so elects, benefits shall be paid as soon as administratively feasible after the date on which the Plan Administrator determines that this Order is qualified and has established the Alternate Payee's account, or at the earliest date permitted under the Plan or Section 414(p) of the Code, if later. Benefits shall be payable to the Alternate Payee in any form allowed under the terms of the Plan, except that the Alternate Payee may not elect the designation of a subsequent spouse under a joint and survivor annuity.
	</p>
	
	<p style="text-indent: 3em;">
		9. The Alternate Payee shall not be deemed for any purpose to be the spouse or surviving spouse of the Participant and shall not be entitled to any benefit with respect to the portion of the Participant's Benefit not assigned to the Alternate Payee hereunder. Any subsequent spouse of the Participant shall not be treated as the Participant's spouse or surviving spouse with respect to the Alternate Payee's Assigned Benefit. The death of the Participant prior to full distribution of the Alternate Payee's Assigned Benefit shall have no effect on the Alternate Payee's right to the Alternate Payee's Assigned Benefit. </p>
	<p style="text-indent: 3em;">
		In the event that the Participant dies prior to the establishment of separate account(s) in the name of the Alternate Payee, such Alternate Payee shall be treated as the surviving spouse of the Participant to the extent of the full amount of the Assigned Benefit. 
	</p>
	<p style="text-indent: 3em;">
		In the event of the Alternate Payee's death prior to Alternate Payee receiving the full amount of the Assigned Benefits assigned under this Order, any remaining interest shall be paid to the Alternate Payee's designated beneficiary on record or, if there is no designated beneficiary, to the estate of the Alternate Payee.
	</p>
	<p style="text-indent: 3em;">
		10. This Order is entered pursuant to the domestic relations laws of the State of Utah and relates to the provision of marital property rights and/or spousal support to the Alternate Payee as a result of the order of divorce between the Participant and the Alternate Payee.
	</p>
	<p style="text-indent: 3em;">
		11. For purposes of Sections 402(a)(1) and 72 of the Code, the Alternate Payee who is the spouse or former spouse of the Participant shall be treated as the distributee of any distributions or payments made to the Alternate Payee under the terms of this Order, and as such, will be required to pay all applicable federal income taxes on such distributions.
	</p>
	<p style="text-indent: 3em;">
		12. The Court shall retain jurisdiction to amend this Order solely for purposes of establishing or maintaining its status as a QDRO; provided, that no amendment of this Order shall require the Plan to provide any type or form of benefits, or any options not otherwise provided under the Plan.
	</p>
	<p style="text-indent: 3em;">
		13. The parties shall furnish a court-certified copy of this Order to the Plan Administrator as soon as practicable after entry of the Order for a determination whether this Order meets the requirements of a qualified domestic relations order under the Code and ERISA.
	</p>

	<table class="signature-block">
		<tr>
			<td style="padding-left: 3em; vertical-align: top;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top;">
					____________________________________<br>
					<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
					Participant<br>
					(Signed Electronically)
			</td>
		</tr>
		<tr>
			<td style="padding-left: 3em; vertical-align: top; padding-top:3em;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top; padding-top:3em;">
					____________________________________<br>
					<?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
					Alternate Payee<br>
					(Signed Electronically)
			</td>
		</tr>
	</table>

	<p style="text-align:center; padding-top:30px"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
