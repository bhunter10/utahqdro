<?php
/**
 * Template Name: IHC - Pension Template
 * Version: 1.0
 * Description: A compliant Gravity PDF template for Empower QDROs.
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
                Re: Empower 401k Plan<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>

	<p style="text-indent: 3em;">This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>QUALIFIED DOMESTIC RELATIONS ORDER (“QDRO”) provides for the division and disposition of part of the benefits due to <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (the “participant”) under the Intermountain Healthcare Pension Plan (the “Plan”) and grants to <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?> (the “Alternate Payee”) rights in those benefits on the terms set forth in this QDRO.</p>

	<p style="text-indent: 3em;">The Court has previously granted and entered its Decree of Divorce in the above-captioned cause.  The Decree provides for the issuance of a supplemental order in the form of a QDRO.</p>

    <p style="text-indent: 3em;">This QDRO is issued pursuant to state domestic relations law, of the State of Utah, found in Utah Code 81-1-204.  This QDRO relates to the provision of child support, alimony payments and/or marital property rights of the Alternate Payee, who is the spouse of the Participant.
This QDRO is intended  to meet the requirements of Section 414(p) of the Internal Revenue Code and Section 206(d) of the Employee Retirement Income Security Act of 1974 (“ERISA”).</p>

    <p style="text-indent: 3em;">The Court has examined the records and pleadings on file and being fully advised in the premises, and good cause having been shown,</p>

    <p style="text-indent: 3em;">IT IS HEREBY ORDERED:</p>

    <p style="padding-left: 3em;">1.	<u>Amount to be Paid to Alternate Payee</u></p>

    <p style="padding-left: 5em;">a.	The Plan shall pay a benefit to the Alternate Payee in the amount, at the time and in the manner set forth in this Order.</p>
    <p style="padding-left: 7em;">(1)	<u>Time and Manner of Distribution</u>:  The benefit payable to the Alternate Payee shall be distributable at the earliest date a benefit could be paid to the Participant under the terms of the Plan, without regard to whether the Participant has terminated employment or elected to commence receiving benefits.  Distribution to the Alternate Payee may commence at any time thereafter as elected by the Alternate Payee. Payment should be made in a manner consistent with the Plan’s distribution options available for alternate payees and the terms and conditions of the Plan prevailing at that time, based upon the Alternate Payee’s life expectancy, and as elected by the Alternate Payee.  In no event will payments to the Alternate Payee commence later than the earlier of: (A) the Participant’s normal retirement date, or (B) the Participant’s actual retirement date.</p>

    <p style="padding-left: 7em;">(2)	<u>Amount of Benefit</u>:  <strong>This Order assigns to Alternate Payee a monthly amount equal to <?php echo esc_html($display_amount); ?> of the Marital Portion of Participant's vested Accrued Benefit (as such term is defined in the Plan) determined as of the earlier of the date: (i) Participant's benefit accruals cease, or (ii) Alternate Payee's benefits commence. The Marital Portion shall be determined by multiplying Participant's vested Accrued Benefit by a fraction (less than or equal to 1.0), the numerator of which is the Participant's Benefit Service (as such term is defined in the Plan) earned during the marriage (from the date of the marriage on <?php echo esc_html($marriage_date); ?> to the date of the divorce on <?php echo esc_html($divorce_date); ?>) and the denominator of which is the total number of months of Participant's Benefit Service credited under the Plan as of the earlier of the date: (i)Participant's benefit accruals cease, or (ii) Alternate Payee's benefits commence.</strong> Such monthly amount shall be adjusted to reflect the actuarial adjustments described in subparagraphs (4) and (5) below.</p>

    <p style="padding-left: 7em;">(3)	<u>Request for Distribution</u>: At the time of distribution, the Alternate Payee shall provide to the Plan such written requests for distribution, elections, consents to distribution and receipts as the Plan’s Administrator may require.</p>

    <p style="padding-left: 7em;">(4)	<u>Actuarial Valuation</u>: The Alternate Payee’s benefit will be actuarially adjusted using the Plan factors in effect at the time benefits commence so that the present value of the benefit payable to the Alternate Payee will be equal to the present value of such benefit if it were payable to the Participant.  In determining such present value where the commencement of benefits to the Alternate Payee is before the Participant retires, it shall be assumed that the Participant’s annuity starting date shall be the later of age 65 or the Participant’s current age.  The actuarial adjustment shall take into account the age difference between the Alternate Payee and the Participant.  The Participant’s accrued benefit under the Plan shall be reduced actuarially by the equivalent value of the benefit payable to the Alternate Payee, determined as of the earlier of the date benefit payments are commenced to the Alternate Payee or the date benefit payments are commenced to the Participant.
	<p style="padding-left: 7em;">If the benefit of the Alternate Payee commences prior to the annuity starting date of the benefits of the Participant, the benefit of the Alternate Payee shall not include any benefit subsidy or supplement (including any subsidy for early retirement) and shall not be adjusted subsequently to reflect any subsidy or supplement subsequently payable to the Participant.  If the benefit of the Alternate Payee commences concurrently with or after the annuity starting date of the benefits of the Participant, the Alternate Payee shall share proportionately in any benefit subsidy or supplement (including any subsidy for early retirement) subsequently payable to the Participant.</p>

    <p style="padding-left: 7em;">(5)	<u>Actuarial Assumptions</u>:  Any actuarial calculations made pursuant to this QDRO shall be performed by or on behalf of the Plan’s Administrator in accordance with the actuarial assumptions and methods used for similar calculations under the Plan.</p>

    <p style="padding-left: 7em;">(6)	<u>No Prior Order</u>: There is no prior QDRO which has awarded amounts to another alternate payee which this QDRO awards the Alternate Payee.</p>

    <p style="text-indent: 5em;">2.	<u>Names and Addresses</u></p>

    <p style="padding-left: 7em;">a.	<u>Participant</u>:  The name, current mailing address, social security number, date of birth, phone and email of the Participant are:</p>

    
    <p style="padding-left: 9em;">
        Name: <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
        Address: <?php echo esc_html($owner_full_address); ?><br>
        Social Security Number:	<?php echo esc_html($owner_ssn); ?><br>
        Birth Date:	<?php echo esc_html($owner_dob); ?><br>
        Telephone: <?php echo esc_html($owner_phone); ?><br>
        Email: <?php echo esc_html($owner_email); ?>
    </p>

    <p style="padding-left: 7em;">b.	<u>Alternate Payee</u>:  The name, current mailing address, social security number, and date of birth of the Alternate Payee are:</p>

    <p style="padding-left: 9em;">
        Name: <?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?><br>
        Address: <?php echo esc_html($receiver_full_address); ?><br>
        Social Security Number:	<?php echo esc_html($receiver_ssn); ?><br>
        Birth Date:	<?php echo esc_html($receiver_dob); ?><br>
        Telephone: <?php echo esc_html($receiver_phone); ?><br>
        Email: <?php echo esc_html($receiver_email); ?>
    </p>

    <p style="padding-left: 7em;">c.	The Participant and Alternate Payee shall inform the Plan Administrator of any change in mailing address or legal name from those set forth, respectively.  The Plan Administrator contact information is:</p>

    <p style="padding-left: 9em;">
        Intermountain Retirement Program<br>
        5245 South College Drive<br>
        Murray, UT 84123<br>
        Phone: (801) 442-7547<br>
        Email:  AskHR@imail.org
    </p>

<p style="text-indent: 5em;">3.	<u>Death</u></p>
<p style="padding-left: 7em;">a. <u>Alternate Payee</u>:  If the Alternate Payee dies before the Alternate Payee has commenced receiving benefits from the Plan, then the share allocated to the Alternate Payee shall revert to the Participant.  If the Alternate Payee is in pay status at the time of the Alternate Payee’s death then all benefit payments shall cease.  After benefit commencement, the death of the Alternate Payee shall not result in any increase in the value of the Participant’s benefit under the Plan.</p>
<p style="padding-left: 7em;">b.	<u>Participant</u>:  In the event the Participant dies at any time under circumstances which would give rise to payment under the Plan of a qualified pre-retirement survivor annuity if the Participant were married, then unless the Alternate Payee is in pay status, the Alternate Payee shall be treated as the Participant’s surviving spouse with respect to all benefits accrued by the Participant under the Plan except any portion thereof:</p>

<p style="padding-left: 9em;">(1)	Previously paid to the Alternate Payee under this QDRO</p>
<p style="padding-left: 9em;">(2)	With respect to which another spouse has been awarded “surviving spouse” status under a prior QDRO</p>
<p style="padding-left: 9em;">(3)	Accruing after the date of the divorce, that is, the portion of the Participant’s accrued benefit after such date, which exceeds the benefit the Participant would have had if the participant had terminated employment on that date with a fully vested benefit.</p>
<p style="padding-left: 7em;">The benefit payable to the Alternate Payee shall be the qualified pre-retirement survivor annuity, or if permitted by the Plan and if larger, the benefit payable pursuant to this QDRO.  The benefit will commence on the Participant’s date of death.</p>
<p style="text-indent: 5em;">4.	<u>Additional Provisions</u></p>
<p style="padding-left: 7em;">a.	No provision in this QDRO shall be constructed to require the Plan, the Plan Administrator of the Plan, or any trustee or other fiduciary with respect to the Plan to take any action, which is inconsistent with any provision of the Plan as now in effect or hereafter amended.  In case of conflict between the terms of this QDRO and the terms of the Plan, the terms of the Plan shall prevail.</p>
<p style="padding-left: 7em;">b.	This QDRO is not intended to provide benefits to the Alternate Payee which are required to be paid to another alternate payee under a prior qualified domestic relations order.  To the extent any previous qualified domestic relations order has awarded amounts to another alternate payee which this QDRO awards to the Alternate Payee, the duplicate amount awarded hereunder shall not be payable.</p>
<p style="padding-left: 7em;">c.	This QDRO shall not require the Plan to provide any increased benefits (in actuarial value) over those benefits otherwise provided for under the Plan.</p>
<p style="padding-left: 7em;">d.	The Alternate Payee shall be a “beneficiary” of the Plan for purposes of the Employee Retirement Income Security Act of 1974 (“ERISA”).</p>
<p style="padding-left: 7em;">e.	This QDRO applies to the Plan designated in the initial paragraph of this QDRO and all subsequent employer Plan(s) to which liability for payment of the benefit described in this QDRO may be transferred.  Changes in Plan Sponsor, Plan Administrator or change of Plan Name shall not affect this QDRO.</p>
<p style="padding-left: 7em;">f.	The Participant and the Alternate Payee shall each be responsible for his or her own federal, state and local income and other taxes attributable to any and all payments from the Plan, which are received by the Participant and the Alternate Payee, respectively.  The Plan shall provide to the Participant and the Alternate Payee in accordance with its customary procedures such information as is normally provided to participants in the Plan with respect to the taxability of distributions from the Plan.</p>
<p style="padding-left: 7em;">g.	The Plan and its sponsor and fiduciaries shall not be responsible for any attorney’s fees incurred by the Participant or the Alternate Payee in connection with obtaining and enforcing this QDRO.</p>


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
