<?php
/**
 * Template Name: URS Pension Template
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
                URS DEFINED BENEFIT PLAN<br><br>
				Re: URS Pension<br><br>
                Case No. {What is your case number?:142}<br>
                Judge {Who was the judge that signed your decree?:143}
            </td>
        </tr>
    </table>


	<p style="text-indent: 3em;">This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order is intended to meet the requirements of a “Domestic Relations Order” (“DRO”) relating to the Defined Benefit Plans (“Plans”) administered by the Utah Retirement Systems (“URS”.)  The DRO is made pursuant to U.C.A. § 49-11-612, and rules promulgated there under.</p>

	
	<p style="text-indent: 3em;"><?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> is not represented by counsel for purposes of this DRO. <?php echo esc_html($receiver_first_name . ' ' . $receiver_last_name); ?> is not currently represented by counsel for purposes of this DRO.</p>
	
	<p style="text-align:center;"><strong>BACKGROUND INFORMATION</strong></p>
	
	
	<p style="text-indent: 3em;"><?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> is a Member (“MEMBER”) of the Defined Benefit Plans of the Utah Retirement Systems (“URS”), administered by the URS, whose last known address is <?php echo esc_html($owner_full_address); ?>.  The Member’s date of birth and Social Security Number have been provided under separate private addendum.</p>
	
	<p style="text-indent: 3em;"><?php echo esc_html($receiver_first_name . ' ' . $receiver_last_name); ?> is the Alternate Payee (“Alternate Payee”) whose last known address is <?php echo esc_html($receiver_full_address); ?>.  The Alternate Payee’s date of birth and Social Security Number have been provided under separate private addendum.</p>

	<p style="text-indent: 3em;">The Member and the Alternate Payee were married on <?php echo esc_html($marriage_date); ?>.  The Member and Alternate Payee were divorced as of <?php echo esc_html($divorce_date); ?> pursuant to a Decree of Divorce entered in the Matter of the Marriage of
            <?php echo esc_html($party1_name['first'] ?? '') . ' ' . esc_html($party1_name['last'] ?? ''); ?>, and <?php echo esc_html($party2_name['first'] ?? '') . ' ' . esc_html($party2_name['last'] ?? ''); ?>, Case No. {What is your case number?:142}.

	<p style="text-indent: 3em;">The Member is entitled to retirement benefits under the Defined Benefit Plan.</p>

	<p><strong>IT IS HEREBY ORDERED THAT:</strong></p>

	<p><strong>I. MONTHLY BENEFITS</strong></p>

	<p style="text-indent: 3em;">1.	URS shall distribute benefits under the Defined Benefit Plan as follows:</p>

	<p style="text-indent: 3em;">A.	The Alternate Payee is awarded <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the Member’s benefits accrued during the marriage.  This percentage is to be used in the following formula:</p>

	<p style="padding-left: 3em; font-size: 0.8em;">
		Years of Credited Service<br>
		Accrued During Marriage<br>
		-------------------------------------------- X <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> = Alternate Payee’s Portion<br>
		Total Years of Retirement Credit
	</p>

	<p style="text-indent: 3em;">
		The Alternate Payee’s share of the Member’s accrued benefits shall be converted to an actuarially equivalent amount based on the life expectancy of the Alternate Payee for their life.
	</p>

    <p style="text-indent: 3em;">
        2.  If the Member elects a Partial Lump Sum Option (PLSO) at the time of retirement and the Alternate Payee is to receive a percentage of the monthly benefit, the Alternate Payee will receive the same percentage of the PLSO.  The Alternate Payee will not receive a portion of the PLSO if the Alternate Payee is to receive a specific dollar amount.
    </p>

    <p style="text-indent: 3em;">
        3.  For Members of the Tier I Public Employees’ Contributory or Noncontributory System(s) and the Tier II Public Employees’ and Public Safety and Firefighter Contributory Hybrid System(s) who divorce after retirement and elected a continuing spousal benefit for the Alternate Payee at the time of retirement, the actuarial present value of the remaining payments under the current option will be determined as of the effective date of the DRO.  Based on the court ordered percentage, this amount is then divided between the two parties, and then converted to two separate life annuities, one for the Member and one for the Alternate Payee.  The continuing spousal benefit will no longer be payable.  At the Member’s death, the amount of the monthly benefit being paid to the Alternate Payee will not change.  At the Alternate Payee’s death, the amount of the monthly benefit being paid to the Member will not change.
    </p>

	<p><strong>II. ESTABLISHMENT OF BENEFITS</strong></p>
	
	<p style="text-indent: 3em;">URS shall begin monthly payments to the Alternate Payee when the Alternate Payee files with URS the appropriate form and the earliest of the following occurs:</p>


	<p style="text-indent: 6em;">1. The Member terminates employment, qualifies for retirement, and applies for benefits; or</p>

	<p style="text-indent: 6em;">2. The month following receipt of an acceptable DRO by URS when the Member is currently retired and receiving benefits under the Plan.</p>

	<p><strong>III.	DURATION OF PAYMENTS TO ALTERNATE PAYEE</strong></p>

	<p style="text-indent: 3em;">After monthly payments begin to an Alternate Payee, URS shall cease payments at the death of the Alternate Payee.  The Alternate Payee’s portion does not revert to the Member.</p>



	<p><strong>IV. MEMBER WITHDRAWS FROM RETIREMENT SYSTEM</strong></p>

	<p style="text-indent: 3em;">A. If the Member discontinues employment and withdraws the Member’s account in a lump sum, the Alternate Payee shall receive  <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the Member account which accrued during the marriage.  The percentage is to be used in the following formula:</p>

	<p style="padding-left: 6em; font-size: 0.8em;">
		Years of Credited Service<br>
		Accrued During Marriage<br>
		-----------------------------------------------  X  <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> = Alternate Payee’s Portion<br>
		Total Years of Retirement Credit
	</p>

	<p><strong>V.	DEATH OF MEMBERS</strong></p>

	<p style="text-indent: 3em;">1.	If the Member dies prior to retirement and a continuing monthly benefit is created by the death of the Member, the Alternate Payee shall receive such portions of that benefit as granted under Section I – Monthly Benefits if the Alternate Payee meets the definition of surviving spouse pursuant to U.C.A. § 49-11-102(51), which requires that a valid DRO is on file with URS prior to the Member’s death date.</p>

	<p style="text-indent: 3em;">2.	If the Member dies prior to retirement and a refund of the contribution account is part of the death benefit, the Alternate Payee’s share will be calculated in accordance with Section IV – Member Withdraws from the Retirement System.</p>

	<p style="text-indent: 3em;">3.	If the Member dies prior to retirement and a lump sum death benefit is payable pursuant to U.C.A. §§ 49-12-501, 49-13-501, 49-14-501, 49-15-501, 49-16-501, 49-17-501, 49-18-501, 49-19-501, 49-22-501 or 49-23-501. URS shall distribute benefits as follows:</p>

	<p style="text-indent: 6em;">A.	If the Member dies prior to retirement, and a death benefit is payable in a lump sum, the Alternate Payee is awarded <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the Member’s benefits accrued during the marriage.  This percentage is to be used in the following formula:</p>

	<p style="padding-left: 6em; font-size: 0.8em;">
		Years of Credited Service<br>
		Accrued During Marriage<br>
		-----------------------------------------------  X  <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> = Alternate Payee’s Portion<br>
		Total Years of Retirement Credit
	</p>

	<p><strong>VI.	LIMITATIONS OF THIS DRO</strong></p>

	<p style="text-indent: 3em;">
		A.	The provisions of this DRO shall not apply to long term disability benefits that the participating Member may be entitled to receive.
	</p>
	<p style="text-indent: 3em;">
		B.	If the Alternate Payee dies prior to when monthly benefits should have begun based upon the effective date established by URS under this DRO, the Member’s benefit will not be reduced by this DRO.
	</p>
	<p style="text-indent: 3em;">
		C. If the Alternate Payee dies after monthly benefits should have or have begun based upon the effective date established by URS under this DRO, the Alternate Payee’s portion of the benefit does not revert to the Member.
	</p>
	<p style="text-indent: 3em;">
		D.	The Alternate Payee may not assign his/her rights to benefits under this DRO.
	</p>
	<p style="text-indent: 3em;">
		E.	Nothing contained in this DRO shall be construed to require any Plan or Plan administrator:
	</p>
	<p style="text-indent: 6em;">
		1. To provide to the Alternate Payee any type or form of benefit or any option not otherwise available to the Member under any Plan.
	</p>
	<p style="text-indent: 6em;">
		2. To provide the Alternate Payee benefits, as determined on the basis of actuarial value, not available to the Member.
	</p>
	<p style="text-indent: 6em;">
		3. To pay any benefits to the Alternate Payee which are required to be paid to another Alternate Payee under another order determined by the Plan administrator to be a DRO.
	</p>
	<p style="text-indent: 6em;">
		4. To provide the Alternate Payee a benefit or interest which exceeds the value of the account.
	</p>
	<p style="text-indent: 3em;">
		F.	If a Member or Alternative Payee receive any distribution that should not have been paid under this DRO, the Member or Alternate Payee is designated a constructive trustee for the amount received and shall immediately notify URS and comply with written instructions as to the distribution of the amount received.
	</p>
	<p style="text-indent: 3em;">
		G.	The Alternate Payee is ordered to report any payments received on any applicable income tax return in accordance with the Internal Revenue Code provisions or regulations in effect at the time any payments are issued by URS.  URS will issue applicable tax forms on any direct payment made to the Alternate Payee.  The Member and Alternate Payee must comply with Internal Revenue Code and any applicable regulations.
	</p>
	<p style="text-indent: 3em;">
		H.	The Alternate Payee is ordered to provide the plan prompt written notification of any changes in the Alternate Payee’s mailing address.  URS shall not be liable for failing to make payments to the Alternate Payee if URS does not have a current mailing address for the Alternate Payee at the time of payment.
	</p>
	<p style="text-indent: 3em;">
		I.	Once an Alternate Payee begins receiving monthly payments from the URS defined benefit plan pursuant to the DRO, the amount to be paid or the period for which payments are being made under the original DRO may not be altered.  
	</p>
	<p style="text-indent: 3em;">
		J.	Pursuant to U.C.A. § 49-11-1401 an Alternate Payee will forfeit any benefit under a DRO if the Member/Employee has a forfeiture of retirement benefits for employment related felony convictions.
	</p>
	<p style="text-indent: 3em;">
		K.	A certified copy of this DRO shall be furnished to URS.
	</p>
	<p style="text-indent: 3em;">
		L.	The Court retains jurisdiction to amend this DRO so that it will constitute a DRO under the defined benefit plan even though all other matters incidental to this action or proceeding have been fully and finally adjudicated.  If URS determines at any time that changes in the law, the administration of the plan, or any other circumstances make it impossible to calculate the portion of a distribution awarded to an Alternate Payee by this DRO and so notifies the parties, either or both parties shall immediately petition the Court for an amended DRO.
	</p>

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
