<?php
/**
 * Template Name: Multi Template - ADP - 401k
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

// Phone formatting function
function format_phone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($phone) == 10) {
        return '(' . substr($phone, 0, 3) . ') ' . substr($phone, 3, 3) . '-' . substr($phone, 6, 4);
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

//contract number
$contract_number = str_replace('#', '', $form_data['field'][145] ?? '');

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

	<p style="text-indent: 3em;">
		Pursuant to Section 414(p) of the Internal Revenue Code, in recognition of his marital property rights in Participant’s retirement account, this <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order assigns a portion of the benefits in the <?php echo esc_html($formal_plan_name); ?> (“Plan”) with plan administrator <?php echo esc_html($employer_name); ?><?php if (!empty($contract_number)) { echo ' under Plan #' . esc_html($contract_number); } ?> from <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (“Participant”) to <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?> (“Alternative Payee”). This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order is granted in accordance with the domestic relations law of the State of Utah, found in Utah Code 81-1-204, which relates to marital property rights, child support, and/or spousal support between spouses and former spouses in matrimonial actions.
	</p>

	<p style="text-align:center; font-weight:bold">SECTION 1. IDENTIFICATION OF THE PLAN</p>

	<p style="text-indent: 3em;">This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order applies to benefits maintained in the <?php echo esc_html($formal_plan_name); ?> (the “Plan”) at <?php echo esc_html($employer_name); ?><?php if (!empty($contract_number)) { echo ' with Plan #' . esc_html($contract_number); } ?>.</p>
	<p style="text-align:center; font-weight:bold">SECTION 2. IDENTIFICATION OF PARTICIPANT AND ALTERNATE PAYEE</p>
	<p style="text-indent: 3em;">Participant and the Alternate Payee identification and contact information:</p>
	<p style="padding-left: 3em;">
		a.	Participant Information:<br>
		<div style="padding-left:6em;">
			Name: <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
			Address: <?php echo esc_html($owner_full_address); ?><br>
			Social Security Number:	<?php echo esc_html($owner_ssn); ?><br>
			Birth Date:	<?php echo esc_html($owner_dob); ?><br>
			Telephone: <?php echo esc_html($owner_phone); ?><br>
			Email: <?php echo esc_html($owner_email); ?>
		</div>
	</p>

	<p style="padding-left: 3em;">
		b.	Alternate Payee Information:<br>
		<div style="padding-left:6em;">
			Name: <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
			Address: <?php echo esc_html($receiver_full_address); ?><br>
			Social Security Number:	<?php echo esc_html($receiver_ssn); ?><br>
			Birth Date:	<?php echo esc_html($receiver_dob); ?><br>
			Telephone: <?php echo esc_html($receiver_phone); ?><br>
			Email: <?php echo esc_html($receiver_email); ?>
		</div>
	</p>
	<p style="text-indent: 3em;">The Participant has a vested interest in the Plan, and the Alternate Payee is the former spouse of the Participant, and has an interest in all or a portion of the Participant’s interest under the Plan, as described in Section 3 below.  The Alternate Payee shall have the duty to notify the Plan Administrator in writing of any change in mailing address subsequent to the entry of this Order.</p>

	<p style="text-align:center; font-weight:bold">SECTION 3. ALTERNATE PAYEE’S BENEFITS</p>

	<p style="text-indent: 3em;">
		The Court recognizes the Alternate Payee’s right to receive benefits otherwise payable to the Participant pursuant to the Decree of Divorce signed by this Court on <?php echo esc_html($divorce_date); ?>.  <strong>Pursuant to the order of the Court, the Alternative Payee’s interest in the Plan shall be <?php echo esc_html($display_amount); ?> of the Participant’s account balance as of <?php 
		if (empty($field_29_raw) && empty($field_34_raw)) {
			echo 'the "Date of Transfer" meaning the date the Alternate Payee\'s account under the Plan is funded following qualification of this Order';
		} else {
			echo esc_html($valuation_date);
		}
		?>.</strong> Such interest of Alternate Payee shall be subject to earnings and losses subsequent to <?php 
		if (empty($field_29_raw) && empty($field_34_raw)) {
			echo 'the "Date of Transfer" meaning the date the Alternate Payee\'s account under the Plan is funded following qualification of this Order';
		} else {
			echo esc_html($valuation_date);
		}
		?>.
	</p>
	
	<p style="text-indent: 3em;">Under no circumstances shall the Alternate Payee’s portion of the account include any loan obligation due the Plan from the Participant.  On and after the date that a determination is made that this Order is a QDRO, but before the Alternate Payee receives the Alternate Payee’s total distribution under the Plan, the Alternate Payee shall be entitled to all of the rights that are afforded to participants under the Plan including, but not limited to, the right to direct investments.</p>
	
	<p style="text-align:center; font-weight:bold">SECTION 4. COMMENCEMENT AND FORM OF BENEFITS</p>
	
	<p style="text-indent: 3em;">To the extent permitted under the Plan, benefits in the amount specified above are payable to the Alternate Payee as soon as administratively feasible following the date this Order is determined to constitute a QDRO, in the form of an immediate distribution or a rollover after the Alternate Payee’s account has been established under the Plan. Any benefits paid under this Order must comply with the minimum distribution requirements of Code Section 401(a)(9).  Any Alternate Payee who is the spouse or former spouse of the Participant shall be treated as the distributee of any distribution of payment made to the Alternate Payee under the terms of this Order and, as such, will be responsible for payment of all taxes attributable to such distribution. In the event that the Participant is paid any benefits that are assigned to the Alternate Payee pursuant to the terms of this Order, the Participant will immediately reimburse the Alternate Payee to the extent he/she has received such payments.  In the event of the Alternate Payee’s death prior to receiving the full amount required under this Order, such Alternate Payee’s beneficiary(ies), as designated on a form provided by the Plan Administrator, shall receive the full balance of any unpaid amounts under the terms of this Order.  In the event of the Participant’s death before the Alternate Payee’s separate account is established under the terms of this Order, such Alternate Payee shall be treated as the surviving spouse of the participant for purposes of receiving any death benefits payable under the Plan, to the extent of the full amount set forth in Section 3 of this Order.</p>
	
	<p style="text-align:center; font-weight:bold">SECTION 5. LIMITATIONS</p>
	
	<p style="text-indent: 3em;">In the event there is a conflict between this Order and the terms of the Plan, the provisions of the Plan shall control. This Order is not intended, and shall not be construed in such a manner as to require the Plan: (a) to provide any type or form of benefit, or any option, not otherwise provided under the terms of the Plan; (b) to require the Plan to provide increased benefits determined on the basis of actuarial value; or (c) to pay any benefits to the Alternate Payee that is required to be paid to another alternate payee under another Order previously deemed to be a QDRO.</p>

	<p style="text-align:center; font-weight:bold">SECTION 6. PLAN ADMINISTRATOR
</p>

	<p>
		The Plan Administrator for the <?php echo esc_html($formal_plan_name); ?> (“Plan”) is <?php echo esc_html($employer_name); ?><?php if (!empty($contract_number)) { echo ' under Plan #' . esc_html($contract_number); } ?>:<br>

		<div style="padding-left:3em;">
			<span style="font-style:italic;">
				Plan Admin:  <?php echo esc_html($employer_name); ?><br>
				Address: <?php echo esc_html($employer_full_address); ?><br>
				<?php if (!empty($employer_phone)) echo 'Phone: ' . esc_html($employer_phone) . '<br>'; ?>
				<?php if (!empty($employer_fax)) echo 'Fax: ' . esc_html($employer_fax) . '<br>'; ?>
				<?php if (!empty($employer_email)) echo 'Email: ' . esc_html($employer_email); ?>
			</span>
		</div>
	</p>

	<p style="text-align:center; font-weight:bold">SECTION 7. JURISDICTION</p>

	<p style="text-indent: 3em;">
		This Court, having jurisdiction over the parties and the Plan subject to this Order, shall retain jurisdiction to enforce this Order and to amend this Order for the purpose of establishing and maintaining this Order as a QDRO.
	</p>


	<table class="signature-block">
		<tr>
			<td style="padding-left: 3em; vertical-align: top;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top;">
					___________________________________<br>
					<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>, 
					Participant<br>
					(Signed Electronically)
			</td>
		</tr>
		<tr>
			<td style="padding-left: 3em; vertical-align: top; padding-top:3em;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top; padding-top:3em;">
					__________________________________<br>
					<?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?>, 
					Alternate Payee<br>
					(Signed Electronically)
			</td>
		</tr>
	</table>

	<p style="text-align:center; padding-top:30px"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
