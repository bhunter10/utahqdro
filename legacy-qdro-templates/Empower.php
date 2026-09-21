<?php
/**
 * Template Name: Empower Template
 * Version: 1.0
 * Description: A compliant Gravity PDF template for QDROs.
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
// Get raw date values from the form
//$marriage_date_raw = $form_data['field'][56] ?? '';
//$divorce_date_raw  = $form_data['field'][57] ?? '';

// Format the dates if set
// $marriage_date = '';
// if (!empty($marriage_date_raw)) {
//     $marriage_date_obj = DateTime::createFromFormat('m/d/Y', $marriage_date_raw);
//     if ($marriage_date_obj) {
//         $marriage_date = $marriage_date_obj->format('F j, Y');
//     }
// }

// $divorce_date = '';
// if (!empty($divorce_date_raw)) {
//     $divorce_date_obj = DateTime::createFromFormat('m/d/Y', $divorce_date_raw);
//     if ($divorce_date_obj) {
//         $divorce_date = $divorce_date_obj->format('F j, Y');
//     }
// }



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
if (!empty($valuation_date_raw)) {
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
    $adjust_market = 'shall not';
} else {
    $adjust_market = 'shall';
}

//formal plan name
$formal_plan_name = $form_data['field'][144] ?? '';

//your name fields
$your_name = $form_data['field'][130] ?? [];
$your_first_name = ucfirst($your_name['first'] ?? '');
$your_last_name = ucfirst($your_name['last'] ?? '');

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
                <?php if (!empty($amended_text)) echo esc_html(strtoupper($amended_text)) . ' '; ?>QUALIFIED DOMESTIC RELATIONS ORDER<br><br>
                Re: Empower 401k Plan<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>

	<p style="text-align:center;"><strong><u><?php if (!empty($amended_text)) echo esc_html(strtoupper($amended_text)) . ' '; ?>QUALIFIED DOMESTIC ORDER</u></strong></p>
	<p style="text-indent: 3em;">WHEREAS <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (hereinafter “Participant”)  is a participant in the <?php echo esc_html($formal_plan_name); ?> (the “Plan”), an employee benefit plan established pursuant to and maintained in compliance with the Employee Retirement Income Security Act of 1974, as amended (“ERISA”), 29 U.S.C. § 1001 et seq; and</p>

	<p style="text-indent: 3em;">
		WHEREAS the parties have agreed and this Court has determined that it is just and appropriate for this Court to enter an order awarding a portion of the Participant’s account balance to <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?> (hereinafter “Alternate Payee”);
	</p>

	<p style="text-indent: 3em;">NOW THEREFORE it is AWARDED, ADJUDGED, and DECREED as follows:</p>


	<p style="text-indent:3em;">
		1.	This <?php if (!empty($amended_text)) echo esc_html(ucwords(strtolower($amended_text))) . ' '; ?>Order is intended to be a Qualified Domestic Relations Order (“QDRO”) under Section 414(p) of the Internal Revenue Code of 1986, as amended (the “Code”) and Section 206(d) of ERISA, 29 U.S.C. § 1056(d), and is issued by this court pursuant to Utah Code 30-3-5.
	</p>
	
	
	<p style="text-indent:3em;">
		2.  	Participant Information.  <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (“Participant”) is a participant in the Plan. 
	</p>

	<p>Participant’s information is as follows:</p>

	<p style="padding-left: 6em;">
			Social Security Number: <?php echo esc_html($owner_ssn); ?><br>
			Date of birth: <?php echo esc_html($owner_dob); ?><br>
			Last known mailing address: <?php echo esc_html($owner_full_address); ?><br>
			Telephone Number: <?php echo esc_html($owner_phone); ?><br>
			Email address: <?php echo esc_html($owner_email); ?>
	</p>
	
	
	<p style="text-indent:3em;">
		3.  	Alternate Payee Information.  <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?> ("Alternate Payee") is the alternate payee for purposes of this QDRO.  Alternate Payee’s Information is as follows:
	</p>

	<p style="padding-left: 6em;">
		Social Security Number: <?php echo esc_html($receiver_ssn); ?><br>
		Date of birth: <?php echo esc_html($receiver_dob); ?><br>
		Last known mailing address: <?php echo esc_html($receiver_full_address); ?><br>
		Telephone Number: <?php echo esc_html($receiver_phone); ?><br>
		Email address: <?php echo esc_html($receiver_email); ?>
	</p>

	<p>The Alternate Payee is instructed to keep the Plan advised of any change of mailing address or name by sending written notice, with reference to the Participant’s name, to the Plan Administrator at Empower, c/o QDROS.com, P.O. Box 173764, Denver, CO, 80217-3764; Phone 800-527-8481; Fax 330-722-2735.</p>
	
	
	<p style="text-indent:3em;">4. The Alternate Payee is the Participant’s former spouse of the Participant.</p>

	<p style="text-indent:3em;">5. The Alternate Payee is hereby awarded a portion of the Participant’s account balance in the Plan and the Plan is directed to establish a separate account after this <?php if (!empty($amended_text)) echo esc_html(ucwords(strtolower($amended_text))) . ' '; ?>Order is qualified.</p>

	<p style="text-indent:3em;">
		6. Alternate Payee’s portion is to be calculated as follows:  The Plan shall pay to the Alternate Payee as a separate interest an amount equal to <?php echo esc_html($display_amount); ?> of Participant’s total account balance in the Plan as of the closest valuation date under the terms of the Plan prior to <?php echo esc_html($valuation_date); ?>.  The Alternate Payee’s assignment <?php echo esc_html($adjust_market); ?> include any earnings or losses thereon from the aforesaid valuation date (or the closest valuation date) under the terms of the Plan to the date of distribution.  The Alternate Payee’s separate account shall be distributed in the form of a single lump-sum payment within a reasonable period of time following the Plan Administrator’s receipt of a request for distribution after this <?php if (!empty($amended_text)) echo esc_html(ucwords(strtolower($amended_text))) . ' '; ?>Order is qualified.
	</p>


	<p style="text-indent:3em;">
		7.      The assignment to the Alternate Payee will not be affected by the death of the Participant.  If the Alternate Payee dies after the Plan Administrator approves an Order but before all the assigned account balance has been distributed to the Alternate Payee, the Plan will make any payments due to a beneficiary pursuant to the terms of the Alternate Payee’s beneficiary designation on file with the Plan or, if no beneficiary designation is on file with the Plan, according to the terms of the Plan.
	</p>
	<p style="text-indent:3em;">
		8.    This order is not intended, and is not to be interpreted, to require the Plan to provide any type or form of benefit, or any option, not otherwise provided under the Plan; to require the Plan to provide increased benefits; or to require the payment of benefits to the Alternate Payee which are required to be paid to another alternate payee under another order previously determined to be a QDRO.
	</p>

	<p style="text-indent:3em;">
		9.      The distribution of an assigned account balance to the Alternate Payee is to be governed by all rules of the Plan, including those requiring that all intended recipients submit an application, on a form provided on request by the Plan’s recordkeeper, prior to the desired distribution of the account balance.  The terms and rules governing the Plan shall prevail in the event of any conflict between this Order and the Plan.
	</p>
	
	<p style="text-indent:3em;">
		10. 	This Order, after entry and execution by all Parties, shall be submitted to the Plan Administrator, who shall determine whether the Order constitutes a QDRO for purposes of the Plan.  If the Plan Administrator concludes that the Order is qualified, the Plan Administrator shall honor the Order, in accordance with Section 414(p) of the Code and Section 206(d) of ERISA, 29 U.S.C. § 1056(d).  The Plan Administrator shall be entitled to rely on this Order in payment of benefits to the Alternate Payee and shall be held harmless from any action by the Participant or by any other party arising from the distribution of the assigned account balance to the Alternate Payee, in accordance with this Order.
	</p>
	
	<p style="text-indent:3em;">
		11.	The parties’ signatures below signify their agreement with the division of the Participant’s account balance set forth herein and specifically agree to waive any claim against the Plan Administrator relating to distribution of the account balance, so long as the distribution is made in compliance with the terms of this <?php if (!empty($amended_text)) echo esc_html(ucwords(strtolower($amended_text))) . ' '; ?>Order.
	</p>

	<p style="text-indent:3em;">
		12.	The Court retains jurisdiction over this <?php if (!empty($amended_text)) echo esc_html(ucwords(strtolower($amended_text))) . ' '; ?>Order to amend same, in order to establish or maintain its qualification as a QDRO.
	</p>

<table class="signature-block">
	<tr>
		<td style="padding-left: 3em; vertical-align: top;">Approved as to form: ________________</td>
		<td style="padding-left:3em; vertical-align: top;">
				__________________________________<br>
				<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>, Member<br>
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
