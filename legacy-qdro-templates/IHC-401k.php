<?php
/**
 * Template Name: IHC - 401k
 * Version: 1.0
 * Description: A compliant Gravity PDF template.
 * Group: UtahQDRO
 * Required PDF Version: 4.0
 */

if ( ! class_exists( 'GFForms' ) ) {
    return;
}

// Phone formatting function
function format_phone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($phone) == 10) {
        return '(' . substr($phone, 0, 3) . ') ' . substr($phone, 3, 3) . '-' . substr($phone, 6);
    }
    return $phone;
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

//employer fields
$employer_name = trim($form_data['field'][37] ?? '');
if (!empty($employer_name)) {
    $employer_name = ucfirst($employer_name);
}

$employer_address = $form_data['field'][166] ?? [];
$employer_phone = format_phone($form_data['field'][42] ?? '');
$employer_fax = format_phone($form_data['field'][176] ?? '');
$employer_email = $form_data['field'][168] ?? '';

// Format employer address
$employer_address_line1 = trim($employer_address['street1'] ?? $employer_address['street'] ?? '');
$employer_address_line2 = trim($employer_address['street2'] ?? $employer_address['line2'] ?? '');
$employer_city = trim($employer_address['city'] ?? '');
$employer_state = trim($employer_address['state'] ?? '');
$employer_zip = trim($employer_address['zip'] ?? '');

$employer_full_address = '';
if (!empty($employer_address_line1)) {
    $employer_full_address = ucwords(strtolower($employer_address_line1));
    if (!empty($employer_address_line2)) {
        $employer_full_address .= ",\n" . ucwords(strtolower($employer_address_line2));
    }
    if (!empty($employer_city) || !empty($employer_state) || !empty($employer_zip)) {
        $employer_full_address .= ",\n";
        if (!empty($employer_city)) {
            $employer_full_address .= ucwords(strtolower($employer_city));
        }
        if (!empty($employer_state)) {
            $employer_state_formatted = (strlen($employer_state) == 2) ? strtoupper($employer_state) : ucwords(strtolower($employer_state));
            $employer_full_address .= (!empty($employer_city) ? ', ' : '') . $employer_state_formatted;
        }
        if (!empty($employer_zip)) {
            $employer_full_address .= ' ' . $employer_zip;
        }
    }
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
				Re: IHC 401k<br><br>
				Case No. {What is your case number?:142}<br>
				Judge {Who was the judge that signed your decree?:143}
			</td>
		</tr>
	</table>

	<p style="text-indent: 3em;">
		This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>QUALIFIED DOMESTIC RELATIONS ORDER (“QDRO”) provides for the division and disposition of part of the benefits held on behalf of <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (the “participant”) under the Intermountain Healthcare Savings Plus 401(k) Plan (the “Plan”) and grants to <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?> (the “Alternative Payee”) rights in those benefits on the terms set forth in this QDRO.
	</p>

	<p style="text-indent: 3em;">
		The Court has previously granted and entered its Decree of Divorce in the above-captioned cause on <?php echo esc_html($divorce_date); ?>.  The Decree provides for the issuance of a supplemental order in the form of a QDRO.
	</p>
	<p style="text-indent: 3em;">
		This QDRO is issued pursuant to state domestic relations law, Utah Code 81-1-204.  This QDRO relates to the provision of child support, alimony payments and/or marital property rights of the Alternate Payee, who is the former spouse of the Participant.
		This QDRO is intended to meet the requirements of Section 414(p) of the Internal Revenue Code and Section 206(d) of the Employee Retirement Income Security Act of 1974 (“ERISA”).
	</p>
	<p style="text-indent: 3em;">
		The Court has examined the records and pleadings on file and being fully advised in the premises, and good cause having been shown,
	</p>
	<p style="text-indent: 3em;">IT IS HEREBY ORDERED:</p>
	<p style="text-indent: 3em;">1.	<u>Amount to be Paid to Alternate Payee</u></p>
	<p style="padding-left: 5em;">
		a.	That portion of the Participant’s entire vested and accrued benefit under the Plan described under paragraph 1(b) hereof, determined as of the most recent Plan valuation date preceding <?php echo esc_html($valuation_date); ?> shall be transferred and segregated from the Participant’s accounts under the Plan as soon as administratively possible after the Plan’s Administrator has received this order.  If permitted by the Plan and to the extent allowed under the procedures established by the Plan for qualified domestic relations orders, this amount, together with interest and earnings thereon as provided in Paragraph 4(d) below, shall be paid to the Alternate Payee as soon as practicable after this order has been accepted as a QDRO.  Payment shall be made in a lump sum unless the Alternate Payee elects another form of payment in a manner consistent with the Plan’s distribution options and procedures on QDROs.
	</p>
	<p style="padding-left: 5em;">
		b.	With respect to any distribution from the Plan to the Alternate Payee, the Alternate Payee shall provide such requests for payment, elections and consents to payment and receipts of payment as the Plan’s Administrator may require. <strong>The transfer from the Participant’s Account to the Account established for distribution to the Alternate Payee shall be made in the following manner:  The Plan’s Administrator shall transfer to the account of the Alternate Payee <?php echo esc_html($display_amount); ?> of the Participant’s Account.</strong> 
	</p>
	<p style="text-indent: 3em;">2.	<u>Names and Addresses</u></p>
	<p style="padding-left:5em;">
		a.	<u>Participant</u>:  The name, current mailing address and social security number of the Participant are:
		<div style="padding-left:7em;">
			Name: <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
			Address: <?php echo esc_html($owner_full_address); ?><br>
			Social Security Number:	<?php echo esc_html($owner_ssn); ?><br>
			Birth Date:	<?php echo esc_html($owner_dob); ?><br>
			Phone Number: <?php echo esc_html($owner_phone); ?><br>
			Email: <?php echo esc_html($owner_email); ?>
		</div>
	</p>
	<p style="text-indent: 5em;">
		b.	<u>Alternate Payee Information</u>:<br>
		<div style="padding-left:7em;">
			Name: <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
			Address: <?php echo esc_html($receiver_full_address); ?><br>
			Social Security Number:	<?php echo esc_html($receiver_ssn); ?><br>
			Birth Date:	<?php echo esc_html($receiver_dob); ?><br>
			Telephone: <?php echo esc_html($receiver_phone); ?><br>
			Email: <?php echo esc_html($receiver_email); ?>
		</div>
	</p>
	<p style="padding-left: 5em;">
		c.	If the Alternate Payee changes address prior to distribution in full of benefits as provided in this QDRO, the Alternate Payee shall inform the Plan’s Administrator of the Alternate Payee’s new address.  Notice of change of address shall be made in writing to the Plan’s Administrator, address as follows:
		<div style="padding-left:7em;">
			<?php 
			// Check if any meaningful employer contact info is provided
			$has_employer_info = false;
			if (!empty($employer_name) || !empty($employer_phone) || !empty($employer_fax) || !empty($employer_email)) {
				$has_employer_info = true;
			}
			// Check if address has meaningful content (not just commas and spaces)
			if (!empty($employer_full_address) && trim(str_replace([',', ' '], '', $employer_full_address)) !== '') {
				$has_employer_info = true;
			}
			
			if (!$has_employer_info) {
				// Use default IHC address
				echo 'Intermountain Retirement Program<br>';
				echo '5245 South College Drive<br>';
				echo 'Murray, UT 84123';
			} else {
				// Use provided employer info
				if (!empty($employer_name)) echo 'Plan Admin: ' . esc_html($employer_name) . '<br>';
				if (!empty($employer_full_address)) echo 'Address: ' . esc_html($employer_full_address) . '<br>';
				if (!empty($employer_phone)) echo 'Phone: ' . esc_html($employer_phone) . '<br>';
				if (!empty($employer_fax)) echo 'Fax: ' . esc_html($employer_fax) . '<br>';
				if (!empty($employer_email)) echo 'Email: ' . esc_html($employer_email);
			}
			?>
		</div>
	</p>
	<p style="text-indent: 5em;">
		Or to such other address as the Administrator may specify in a written notice to the Alternate Payee.
	</p>
	<p style="text-indent: 3em;">
		3.	<u>Death</u><br>
	</p>
	
	<p style="text-indent: 3em;">If the Alternate Payee dies before the Alternate Payee has received the full amount due to the Alternate Payee hereunder, the balance of the amount payable under this QDRO shall be paid to the Alternate Payee’s estate or designated beneficiary.</p>
	
	<p style="text-indent: 3em;">
		4. <u>Additional Provisions</u><br>
	</p>
	<p style="padding-left: 5em;">
		a.	In case of conflict between the terms of this QDRO and the terms of the Plan, the terms of the Plan shall prevail.
	</p>
	<p style="padding-left: 5em;">
		b.	The Plan’s Administrator and the Alternate Payee may modify (by written agreement) any provision of this QDRO without further court approval so long as the change has no adverse effect on the Participant.  The Plan’s Administrator may unilaterally modify any term of this QDRO to the extent necessary to comply with applicable law, provided such modification does not result in any reduction in the benefit payable to the Alternate Payee hereunder.
	</p>
	<p style="padding-left: 5em;">
		c.	The Alternate Payee shall be a “beneficiary” of the Plan for purposes of the Employee Retirement Income Security Act of 1974 (“ERISA”).
	</p>
	<p style="padding-left: 5em;">
		d.	The Alternate Payee shall be entitled to all interest and earnings on amounts due to the Alternate Payee hereunder, which interest and earnings shall accrue for the benefit of the Alternate Payee from <?php echo esc_html($valuation_date); ?> to the date the amounts in the Participant’s accounts shall be deemed transferred and segregated from the Participant’s Accounts in the Plan.
	</p>
	<p style="padding-left: 5em;">
		e.	All notices to be given or documents to be sent to the Plan’s Administrator shall be addressed in accordance with Paragraph 2 above and shall be deemed given to the Plan on the date mailed or hand-delivered.
	</p>
	<p style="padding-left: 5em;">
		f.	Distributions to the Alternate Payee under this QDRO shall be taxable to the Alternate Payee and not to the Participant.
	</p>
	<p style="padding-left: 5em;">
		g.	The Plan and its sponsor and fiduciaries shall not be responsible for any attorney’s fees incurred by the Participant or the Alternate Payee in connection with obtaining and enforcing this QDRO.
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
