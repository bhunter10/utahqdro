<?php
/**
 * Template Name: DMBA 401k Template
 * Version: 1.0
 * Description: A compliant Gravity PDF template for URS QDROs that supports multi-page expansion.
 * Group: UtahQDRO
 * Required PDF Version: 4.0
 */

if ( ! class_exists( 'GFForms' ) ) {
    return;
}

//amended text field
$amended_text = trim($form_data['field'][174] ?? '');

//your name fields
$your_name = $form_data['field'][130] ?? [];
$your_first_name = ucfirst($your_name['first'] ?? '');
$your_last_name = ucfirst($your_name['last'] ?? '');

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
$marriage_date_raw = $form_data['field'][56] ?? '';
$divorce_date_raw  = $form_data['field'][57] ?? '';

// Format the dates if set
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

//interest, gains, and losses (field 146)
$interest_gains_losses_raw = strtolower(trim($form_data['field'][146] ?? ''));

if ( $interest_gains_losses_raw === 'yes' ) {
    $adjust_market = 'shall';
} else {
    $adjust_market = 'shall not';
}


// Field 153 stores selected plan types as array
$selected_plans = $form_data['field'][153] ?? [];

// Define display labels for each plan option
$plans = [
    '401k plan'    => '401k plan',
    '457 plan'     => '457 plan',
    'IRA Roth'     => 'IRA Roth',
    'IRA Simple'   => 'IRA Simple',
];

// amounts
$fixed_amount = trim($form_data['field'][27] ?? '');
$percent_amount = trim($form_data['field'][33] . '%' ?? '');

// Generate output for each selected plan
$plan_output = '';
if (is_array($selected_plans)) {
    foreach ($selected_plans as $selected_plan) {
        $key = strtolower(trim($selected_plan));
        $label = $plans[$key] ?? $selected_plan;
        
        if ( $division_type === 'percentage' && !empty($percent_amount) ) {
            $plan_output .= "<p>{$label}<br>{$percent_amount}</p>\n";
        } elseif ( $division_type === 'fixed' && !empty($fixed_amount) ) {
            $plan_output .= "<p>{$label}<br>$" . number_format($fixed_amount, 2) . "</p>\n";
        } else {
            $plan_output .= "<p>{$label}<br>Amount not provided</p>\n";
        }
    }
}

// Fallback if no plans selected
if (empty($plan_output)) {
    $plan_output = '<p>No URS DC Savings Plan selected.</p>';
}


//death benefit value
$death_benefit_value = '';

if ($division_type === 'fixed' && !empty($fixed_amount)) {
    $death_benefit_value = '$' . number_format((float)$fixed_amount, 2);
} elseif ($division_type === 'percentage' && !empty($percent_amount)) {
    $death_benefit_value = $percent_amount . '%';
} else {
    $death_benefit_value = '_____%';
}

// Field 153 - URS Plan types (comma delimited with 'and')
$plan_types_raw = $form_data['field'][153] ?? [];
$plan_types_list = '';
if (is_array($plan_types_raw) && count($plan_types_raw) > 0) {
    if (count($plan_types_raw) == 1) {
        $plan_types_list = $plan_types_raw[0];
    } elseif (count($plan_types_raw) == 2) {
        $plan_types_list = $plan_types_raw[0] . ' and ' . $plan_types_raw[1];
    } else {
        $last = array_pop($plan_types_raw);
        $plan_types_list = implode(', ', $plan_types_raw) . ', and ' . $last;
    }
} else {
    $plan_types_list = $plan_types_raw;
}


// Requesting person info
$requesting_name = $form_data['field'][130] ?? [];
$requesting_full_name = trim(($requesting_name['first'] ?? '') . ' ' . ($requesting_name['last'] ?? ''));


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
	h3 {
        font-family: Arial, sans-serif;
        font-size: 16pt;
        color: #2E3C66;
        font-weight: bold;
        margin-bottom:0;
    }
	.subheading {
        font-family: Arial, sans-serif;
        margin-top:0;
        font-size: 10pt;
        font-style: italic;
    }

    .addendum-banner {
        font-family: Arial, sans-serif;
        background-color: #1A3765;
        color: #fff;
        padding: 8px 12px;
        font-size: 10pt;
        margin: 20px 0;
        border: 1px solid #1A3765;
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

	.table {
        border:1px solid #000;
        border-collapse:collapse;
        width:100%;
    }

    .table td {
        border:1px solid #000;
        border-collapse:collapse;
        font-size: 11pt;
        padding: 5px;
        vertical-align:top;
        width: 50%;
    }

    .section-header {
       text-align:center;
    }

    .field-label {
        font-family: Arial, sans-serif;
        vertical-align: top;
        font-weight: bold;
    }

    .field {
        margin-bottom: 10px;
    }

    .signature-line {
        margin-top: 20px;
        margin-bottom: 10px;
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
                Re: DMBA 401k<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>

	<p style="text-align:center;"><strong>I.<br>RECITALS</strong></p>

	<p>1.	A judgment, decree or order providing for child support, alimony or marital property rights to <?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>’s spouse, former spouse, child or other dependent has been previously entered in this matter pursuant to state domestic relations laws.</p>

	<p>2.	The Court intends this <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order to be a Qualified Domestic Relations Order (“QDRO”) within the meaning of § 414(p) of the Internal Revenue Code of 1986, as amended (“CODE”) and § 206(d) of the Employee Retirement Income Security Act of 1974, as amended (“ERISA”).</p>

	<p>3.	The Court enters this QDRO pursuant to its authority under Utah law.</p>

	<p>4.	This Order creates and recognizes the existence of <?php echo esc_html($receiver_first_name . ' ' . $receiver_last_name); ?>’s right to receive a portion of the benefits of a certain Plan or Plans Maintained by the Deseret Mutual Employee Pension Plan Trust and administered by Deseret Mutual Benefit Administrators, and payable with respect to the Plan(s) thereunder.</p>

	<p style="text-align:center"><strong>II.<br>STATEMENT OF FACTS PURSUANT TO<br>CODE §414(p)/ERISA §206(d)</strong></p>

	5.	This QDRO applies to the Deseret 401(k) Plan (“Plan”) administered by Deseret Mutual Benefit Administrators.

	6.	<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> (“Participant”) is a participant in the Plan(s).  Participant’s information is as follows: 
		
	<p style="padding-left:3em;">
		Social Security Number: <?php echo esc_html($owner_ssn); ?><br>
		Date of birth: <?php echo esc_html($owner_dob); ?><br>
		Last known mailing address: <?php echo esc_html($owner_full_address); ?><br>
		Telephone Number: <?php echo esc_html($owner_phone); ?><br>
		Email address: <?php echo esc_html ($owner_email) ?>
	</p>

	7.	<?php echo esc_html($receiver_first_name . ' ' . $receiver_last_name); ?> (“Alternate Payee”) is the alternate payee for purposes of this QDRO.  Alternate Payee’s Information is as follows:
	<p style="padding-left:3em;">
		Social Security Number: <?php echo esc_html($receiver_ssn); ?><br>
		Date of birth: <?php echo esc_html($receiver_dob); ?><br>
		Last known mailing address: <?php echo esc_html($receiver_full_address); ?><br>
		Telephone Number: <?php echo esc_html($receiver_phone); ?><br>
		Email address: <?php echo esc_html($receiver_email); ?><br>
	</p>

	<p>8.	The Participant’s Deseret 401(k) Plan benefit payable to the Alternate Payee under this QDRO is <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the value of the Plan at the time the QDRO is qualified. Alternate Payee is not responsible for any obligation that may be owed to the Plan.</p>

	<p>9.	The Alternate Payee recognizes that the benefits will only be payable upon qualification and processing of this QDRO by the Plan Administrator and no benefits will be retroactively administered.</p>

	<p style="text-align:center;"><strong>III.<br>RECITALS PURSUANT TO CODE §414(p)(3)/ERISA §206(d)(3)(D)</strong></p>

	<p>10.	This QDRO does not require the Plan(s) to provide any type or form of benefit, or any option, the Plan(s) does not otherwise provide.</p>

	<p>11.	This QDRO does not require the Plan(s) to provide increased benefits.</p>

	<p>12.	This QDRO does not require the Plan(s) to pay any benefits that another Order previously determined to be a qualified domestic relations order requires the Plan(s) to pay to another Alternate Payee.</p>

	<p style="text-align:center;"><strong>IV.<br>TIME AND MANNER OF PAYMENT</strong></p>

	<p>13.	The Plan(s) shall pay, in lump sum or as may be allowed by the Plan(s), the percentage or amount described above, to the Alternate Payee, and the Plan(s) shall pay these amounts as soon as administratively feasible. Any allocable earnings or losses of these amounts will be calculated from the date the QDRO is qualified by Deseret Mutual to the present-day, and not from the date the divorce decree was signed or any other date.</p>

	<p>14.	This QDRO does not require the consent of the Participant or the Alternate Payee to any distribution required hereunder, and the Plan(s) may distribute the amount described above without obtaining any further consent from either the Participant or the Alternate Payee.</p>

	<p>15.	If the Plan(s) does not permit an immediate distribution of the amount described above, the Plan(s) shall pay that amount at Participant’s earliest retirement age as defined by Code § 414(p)(4)(B)/ERISA § 206(d)(3)(E).</p>

	<p>16.	After payment of the amount required by this QDRO, Alternate Payee shall have no further claim against Participant’s interest in the Plan(s).</p>

	<p>17.	Alternate Payee assumes sole responsibility for the tax consequences of his/her distributions under this QDRO.</p>

	<p>18.	Until the Plan(s) completes payment of all benefits pursuant to this QDRO, the Plan(s) shall treat the Alternate Payee as a surviving spouse for purposes of Code § 401(a)(11) and 417, but Alternate Payee shall receive, as surviving spouse, only the amount described above.  The sole purpose of this paragraph is to insure payment to Alternate Payee in case of Participant’s death prior to payment of the Plan(s) of the amounts described above.</p>

	<p>19.	In case of Alternate Payee’s death, payment shall be made as provided for by the Plan(s).</p>

	<p style="text-align:center"><strong>V.<br>PROCEDURE FOR PROCESSING THIS QDRO</strong></p>

	<p>20.	The Plan(s) shall treat this QDRO in accordance with Code §414(p)(7)/ERISA § 206(d)(3)(H), and while the Plan(s) is determining whether this order is a qualified domestic relations order, the Plan Administrator shall separately account for the amounts which would have been payable to Alternate Payee.</p>

	<p>21.	The Plan Administrator shall promptly notify Participant and Alternate Payee of the receipt of this QDRO, shall notify Participant and Alternate Payee of the Plan’s procedures for determining the qualified status of this QDRO, shall determine the qualified status of this QDRO, and shall notify Participant and Alternate Payee of the determination within a reasonable period of time after receipt of this QDRO.</p>

	<p>22.	In the event the Administrator does not approve the form of this Order, all parties shall cooperate to devise a form of this Order that is acceptable to the Administrator.</p>

	<p>23.	The Court retains jurisdiction over this matter as provided by law.</p>


	<table class="signature-block">
		<tr>
			<td style="padding-left: 3em; vertical-align: top;">Approved as to form: ________________</td>
			<td style="padding-left:3em; vertical-align: top;">
					____________________________________<br>
					<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?><br>
					Member<br>
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
