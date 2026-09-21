<?php
/**
 * Template Name: TSP Template
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

//TSP account type
$tsp_account_type = $form_data['field'][177] ?? '';


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
                <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>RETIREMENT BENEFITS COURT ORDER<br><br>
                Re: Thrift Savings Plan<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>

    <p style="text-align:center">RETIREMENT BENEFITS COURT ORDER</p>

    <p>This order is entered pursuant to the authority granted under the applicable domestic relations laws of the state of Utah.</p>

    <p><strong>1. Plan</strong></p>

    <p>This order applies to the Thrift Savings Plan (the "Plan"):</p>

    <p style="padding-left:3em;">
        <?php echo ($tsp_account_type === 'Civilian Account') ? 'X' : '__'; ?> Civilian Account<br>
        <?php echo ($tsp_account_type === 'Uniformed Services Account') ? 'X' : '__'; ?> Uniformed Services Account<br>
        <?php echo ($tsp_account_type === 'Beneficiary Participant Account') ? 'X' : '__'; ?> Beneficiary Participant Account
    </p>

    <p><strong>2. Participant</strong></p>

    <p>The name, address, and Social Security Number of the participant as as follows:
</p>

    <p style="padding-left:3em;">
        Name: <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
        Address: <?php echo esc_html($owner_full_address); ?><br>
        Social Security Number:	<u>See Attached Addendum</u>
    </p>

    <p><strong>3. Payee</strong></p>

    <p>The person named as payee meets the requirements of the definition of payee as set forth in Section 4 of this order. The payee's name, address, Social Security number, and relationship to the participant are as follows:</p>

    <p style="padding-left:3em;">
        Name: <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
        Address: <?php echo esc_html($receiver_full_address); ?><br>
        Social Security Number:	<u>See Attached Addendum</u><br>
        Relationship to Participant: Former Spouse
    </p>

    <p>The payee shall be responsible for notifying the Plan in writing of any changes in his or her mailing address after the submission of this order.</p>

    <p><strong>4. Definitions</strong></p>

    <p>
        <strong>Payee</strong> - The payee is any spouse, former spouse, child, or other dependent of a participant who is recognized by a domestic relations order as having a right to receive all or a portion of the benefits payable under the Plan with respect to the participant.
    </p>

    <p><strong>Date of Distribution</strong> - The date on which the awarded benefit is distributed to the payee.</p>

    <p><strong>Liquidation Date</strong> - The liquidation date is the date the amount assigned to the payee is transferred from the participant's vested account balance to a separate account established for the payee in accordance with the terms of the RBCO. An assignment as of the liquidation date assigns a portion of the participant's current vested account balance.</p>

    <p><strong>Valuation Date</strong> - The valuation date is the date on which the participant's vested account balance will be valued to determine the payee's designated portion in accordance with the terms of this order. Accounts are valued daily. The valuation date for this order is <?php echo esc_html($valuation_date); ?>.</p>

    <p><strong>Vested Account Balance</strong> - The participant's vested account balance is the dollar amount the participant has a nonforfitable right to rfeceive from the Plan.</p>

    <p><strong>5. Benefit Payable to the Payee</strong></p>
    
    <p>
        The order assigns to the payee an amount equal to <?php echo esc_html($display_amount); ?> of the participant's vested account balance under the Plan (identified in Section 1) as of <?php echo esc_html($valuation_date); ?> (the valuation date).
        <?php if ($division_type === 'percentage'): ?>
        If there is a loan on the account, the participant's vested balance will/will not be reduced by the value of outstanding loans before the payee's portion of the benefit is determined.
        <?php endif; ?>
    </p>

    <p>From the valuation date to the liquidation date, the amount assigned to the payee <?php echo esc_html($adjust_market); ?> include earnings and losses.</p>

    <p><strong>6. Form of Payment</strong></p>

    <p>The payee shall receive the portion of the plan benefits assigned to the payee in a single lump-sum payment. Such amount shall be adjusted for earnings and losses from the liquidation date to the date of distribution to the payee.</p>

    <p><strong>7. Commencement</strong></p>

    <p>The payee shall be eligible to receive payment as soon as administratively reasonable following the determination that this order is qualified, but in no event earlier than 30 days after the date of the decision letter.</p>

    <p><strong>8. Death Procedures</strong></p>

    <p>If the participant predeceases the payee prior to payment of the payee's assigned benefits under the RBCO, the payee's benefits will not be affected. In the event of the participant's death, the account balance, which remains the property of the participant, will be payable to the participant's designated beneficiary or in accordance with Plan provisions. This order does not require the participant to name the payee as the beneficiary for the benefits not assigned to the payee.</p>

    <p>In case of the death of the payee prior to distribution of the payee's benefits under the RBCO, the assigned benefits will be paid to the payee's estate, unless otherwise specified by the court order. A distribution to the estate of a deceased court order payee will be reported as income to the decedent's estate.</p>

    <p><strong>9. Retention of Jurisdiction</strong></p>

    <p>This matter arises from an action for divorce or legal separation in this court under the case number set forth at the beginning of this order. Accordingly, this court has jurisdiction to issue this order.</p>

    <p>In the event that this order is not a qualified Retirement Benefits Court Order, both parties shall cooperate with the Plan in making any changes needed for it to become qualified. This includes signing all necessary documents. For this purpose, this court expressly reserves jurisdiction over the dissolution proceeding involving the participant, the payee, and the participant's interest in the Plan.</p>

    <p><strong>10.	Limitations</strong></p>

    <p>Pursuant to Section 414(p)(3) of the Code and except as provided by Section 414(p)(4), this order:</p>

    <p style="padding-left:3em;">
        i)	Does not require the Plan to provide any type or form of benefit, or any option, not otherwise provided under the Plan;
    </p>

    <p style="padding-left:3em;">(ii)	Does not require the Plan to provide increased benefits; and</p>

    <p style="padding-left:3em;">(iii)		Does not require the payment of benefits to a payee that is required to be paid to another payee under another order previously determined to be a Retirement Benefits Court Order.</p>

    <p><strong>11. Taxation</strong></p>

    <p>For purposes of Sections 402 and 72 of the Code, any payee who is the spouse or former spouse of the participant shall be treated as the distributee of any distributions or payments made to the payee under the terms of the order and, as such, will be required to pay the appropriate federal, state, and local income taxes on such distributions.</p>

    <p><strong>12. Constructive Receipt</strong></p>

    <p>If the Plan inadvertently pays to the participant any benefit that is assigned to the payee pursuant to the terms of this order, the participant will immediately reimburse the Plan to the extent the participant has received such benefit payments from the Plan within ten (10) days of receipt.
    </p>

    <p>If the Plan inadvertently pays to the payee any benefit that is actually payable to the participant, the payee must make immediate reimbursement. The payee must reimburse the Plan to the extent he or she has received such benefit payments from the Plan within ten (10) days of receipt.
    </p>

    <p><strong>13.	Certification of Necessary Information</strong></p>

    <p>All payments made pursuant to this order shall be conditioned on the certification by the Payee and the participant to the Plan of such information as the Plan may reasonably require from such parties to make the necessary calculation of the benefit amounts contained herein.
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
				Payee<br>
				(Signed Electronically)
		</td>
	</tr>
</table>

<p style="text-align:center; padding-top:30px"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
