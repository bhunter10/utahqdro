<?php
/**
 * Template Name: URS Template
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

// Determine owner info based on selected party
if ( $account_owner_value === 'Party 1 (First person named in your case)' ) {
    $owner_first_name = $party1_name['first'] ?? 'Unknown';
    $owner_last_name  = $party1_name['last'] ?? 'Owner';

    // address
    $owner_address_line1 = $party1_address['street1'] ?? $party1_address['street'] ?? 'Unknown Address';
    $owner_address_line2 = $party1_address['street2'] ?? $party1_address['line2'] ?? '';
    $owner_city          = $party1_address['city']    ?? '';
    $owner_state         = $party1_address['state']   ?? '';
    $owner_zip           = $party1_address['zip']     ?? '';

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    $owner_first_name = $party2_name['first'] ?? 'Unknown';
    $owner_last_name  = $party2_name['last'] ?? 'Owner';

    $owner_address_line1 = $party2_address['street1'] ?? $party2_address['street'] ?? 'Unknown Address';
    $owner_address_line2 = $party2_address['street2'] ?? $party2_address['line2'] ?? '';
    $owner_city          = $party2_address['city']    ?? '';
    $owner_state         = $party2_address['state']   ?? '';
    $owner_zip           = $party2_address['zip']     ?? '';
}

// Combine full address for display
$owner_full_address = trim($owner_address_line1);
if ($owner_address_line2) {
    $owner_full_address .= ",\n" . trim($owner_address_line2);
}
$owner_full_address .= ",\n" . trim("{$owner_city}, {$owner_state} {$owner_zip}");


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
    $receiver_first_name = $party2_name['first'] ?? 'Unknown';
    $receiver_last_name  = $party2_name['last'] ?? 'Receiver';

    $receiver_address_line1 = $party2_address['street1'] ?? $party2_address['street'] ?? 'Unknown Address';
    $receiver_address_line2 = $party2_address['street2'] ?? $party2_address['line2'] ?? '';
    $receiver_city          = $party2_address['city']    ?? '';
    $receiver_state         = $party2_address['state']   ?? '';
    $receiver_zip           = $party2_address['zip']     ?? '';

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    // Receiver is Party 1
    $receiver_first_name = $party1_name['first'] ?? 'Unknown';
    $receiver_last_name  = $party1_name['last'] ?? 'Receiver';

    $receiver_address_line1 = $party1_address['street1'] ?? $party1_address['street'] ?? 'Unknown Address';
    $receiver_address_line2 = $party1_address['street2'] ?? $party1_address['line2'] ?? '';
    $receiver_city          = $party1_address['city']    ?? '';
    $receiver_state         = $party1_address['state']   ?? '';
    $receiver_zip           = $party1_address['zip']     ?? '';
}

// Combine full address for display
$receiver_full_address = trim($receiver_address_line1);
if ($receiver_address_line2) {
    $receiver_full_address .= ",\n" . trim($receiver_address_line2);
}
$receiver_full_address .= ",\n" . trim("{$receiver_city}, {$receiver_state} {$receiver_zip}");


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
				Re: Utah Retirement Systems 401(k)<br><br>
				Case No. {What is your case number?:142}<br>
				Judge {Who was the judge that signed your decree?:143}
			</td>
		</tr>
	</table>

	<div class="section">
		<p style="text-indent: 3em;">This <?php if (!empty($amended_text)) echo esc_html($amended_text) . ' '; ?>Order is intended to meet the requirements of a "Domestic Relations Order" (DRO) relating to the defined contribution (“DC”) savings plans, 401(k), 457 and Individual Retirement Accounts ("Savings Plan") administered by Utah Retirement Systems ("URS".)  The DRO is made pursuant to Utah Code 49-11-612, and rules promulgated there under.  {Party 1 name (First):48.3} {Party 1 name (Last):48.6} is not represented by counsel for purposes of this DRO. {Party 2 name (First):64.3} {Party 2 name (Last):64.6} is not currently represented by counsel for purposes of this DRO.</p>

		<p style="text-align:center;"><strong>BACKGROUND INFORMATION</strong></p>
        <p style="text-indent: 3em;"><?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?> is a Member (“MEMBER”) of the Defined Benefit Plans of the Utah Retirement Systems (“URS”), administered by the URS, whose last known address is <?php echo esc_html( $owner_full_address ); ?>. The Alternate Payee’s date of birth and Social Security Number have been provided under separate private addendum.</p>

		<p style="text-indent: 3em;"><?php echo esc_html($receiver_first_name . ' ' . $receiver_last_name); ?> is the Alternate Payee (“Alternate Payee”) of the Defined Benefit Plans of the Utah Retirement Systems (“URS”), administered by the URS, <?php echo esc_html($receiver_full_address); ?>. The Member’s date of birth and Social Security Number have been provided under a separate private addendum.</p>

		<p style="text-indent: 3em;">The Member and the Alternate Payee were married on <?php echo esc_html($marriage_date); ?>.  The Member and Alternate Payee were divorced as of <?php echo esc_html($divorce_date); ?>, pursuant to a Decree of Divorce entered in the case of In the Matter of the Marriage of: {Party 1 name (First):48.3} {Party 1 name (Last):48.6} and {Party 2 name (First):64.3} {Party 2 name (Last):64.6}, Case No. {What is your case number?:142}.</p>

		<p style="text-indent: 3em;">The Participant’s URS DC Savings Plan(s) is/are in the form of a <?php echo esc_html($plan_types_list); ?>.</p>

		<p><strong>IT IS HEREBY ORDERED THAT:</strong></p>

		<p>I. BENEFITS</p>
		<p style="text-indent: 3em;">1. URS shall distribute the amount from the Participant’s account(s) to the Alternate Payee as follows:</p>

		<p style="text-indent: 6em;">A.</p>


		<div style="text-align: center; margin: 10px 0;">
		    <?php echo $plan_output; ?>
		</div>

		<p style="text-indent: 6em;">B. Participants Account(s) should be valued as of: <?php echo esc_html($valuation_date); ?>.</p>
		
		<p style="text-indent: 6em;">C. The Alternate Payee’s interest <?php echo esc_html($adjust_market); ?> be adjusted for market fluctuations, which include changes in the stock market, bond market, and other forces which affect the Participant’s account between the date to be valued and the date segregated pursuant to this DRO.</p>
		

		<p style="text-indent: 6em;">D. For purposes of this DRO, the Participant’s Account is the Participant’s account under a Savings Plan (including elective deferrals and all other employee and employer contributions, transfers, rollovers, gains or losses), less: the outstanding balance of any Savings Plan loans or withdrawals taken by the Participant as of the valuation date indicated in paragraph I. B. above.</p>

		<p style="text-indent: 6em;">E. Upon URS approval of this DRO and within a practicable period of time, URS shall divide the Participant’s Account(s) to reflect the Participant’s and Alternate Payee’s interests under this DRO.  If, prior to segregation of the Participant’s Account, the account balance has been reduced below the value awarded to the Alternate Payee as described (due to loans, withdrawals, market impact etc.), the Alternate Payee will be awarded the remaining funds in the account.  The Alternate Payee’s share shall be taken proportionately from each investment in the Participant’s Account. The Alternate Payee’s share shall be held in such investments until the Alternate Payee takes a distribution or provides new investment directions.  The Participant and Alternate Payee shall each have sole authority to invest the vested monies in their own account under the parameters of the 401(k), 457, Roth IRA and Traditional IRA Plan Documents and other governing rules and laws.</p>

		<p style="text-indent: 6em;">
			F. On the date that URS segregates the Alternate Payee’s assigned share of the benefits as set forth above, to the extent there are not sufficient funds in the Participant’s accounts to satisfy the award of benefits to the Alternate Payee, then this DRO shall be interpreted as an award of One Hundred Percent (100%) of the Participant’s account balance under the Savings Plan as of such segregation date. 
		</p>

		<p style="margin-top: 3em;">II. TIME OF BENEFIT RECEIPT</p>

		<p style="text-indent: 3em;">A. URS will distribute the Alternate Payee’s segregated account at the following time, payable in the following manner:</p>
			
		
		<p style="text-indent: 6em; margin-top:0;">1. The Alternate Payee may elect to receive the vested portion of his or her segregated account from the Savings Plan at any time.</p>
		<p style="text-indent: 6em; margin-top:0;">2. The Alternate Payee's portion held within a brokerage window will be transferred to the core funds prior to segregation.  This may require URS to liquidate securities held in the brokerage account.</p>
		<p style="text-indent: 6em; margin-top:0;">3. The Alternate Payee's benefit may be paid in any form of payment permitted by the Savings Plan and selected by the Alternate Payee.</p>
		<p style="text-indent: 6em; margin-top:0;">4. The Alternate Payee may leave his or her segregated account in the Savings Plan, subject to the same rules and required distributions applicable to the Savings Plan.</p>
		<p style="text-indent: 6em; margin-top:0;">5. After segregation, the Alternate Payee’s funds are not allowed to be transferred into a brokerage window.</p>
			
		<p style="text-indent: 3em; margin-top:0;">B. If the Alternate Payee dies before the segregated account is depleted, the Alternate Payee’s segregated account balance will be paid to the Alternate Payee’s most recent beneficiary designation form on file with URS and according to the provisions of the Savings Plan.</p>
		

		<p style="margin-top: 3em;">III. DEATH OF PARTICIPANT</p>
		<p style="margin-top:0;">1. If the Participant dies actively employed with a URS participating employer and a lump sum death benefit is payable pursuant to U.C.A. §§ 49-22-501, 49-23-501.   URS shall distribute benefits as follows:</p>
		
		<p style="text-indent: 3em; margin-top:0;">A. If the Participant dies prior to retirement, and a death benefit is payable in a lump sum, the Alternate Payee is awarded <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> of the Participant's benefits accrued during the marriage.  This percentage is to be used in the following formula:</p>

		<p style="padding-left: 3em;">
			Years of Credited Service<br>
			Accrued During Marriage<br>
			-------------------------------------------- X <?php echo ($division_type === 'fixed') ? '50%' : esc_html($percent_amount); ?> = Alternate Payee’s Portion<br>
			Total Years of Retirement Credit
		</p>
		
		<p style="margin-top: 3em;">IV. LIMITATIONS OF THIS DRO</p>
		<p style="text-indent: 3em;">A. Nothing contained in this DRO shall be construed to require the Savings Plan, Plan administrator and/or URS:</p>
		<ol style="text-indent: 6em;">
			<li>To provide to the Alternate Payee any type or form of benefit or any investment option not otherwise available to the Participant under the applicable Savings Plan.</li>
			<li>To pay any benefits to the Alternate Payee which are required to be paid to another Alternate Payee under another order determined by the Savings Plan administrator to be a DRO.</li>
			<li>To provide the Alternate Payee a benefit or interest which exceeds the value of the account.</li>
		</ol>
		<p style="text-indent: 3em;">B. If a Participant or Alternate Payee receives any distribution that should not have been paid under this DRO, the Participant or Alternate Payee is designated a constructive trustee for the amount received and shall immediately notify URS and comply with written instructions as to the disposition of the amount received.</p>
		
		<p style="text-indent: 3em;">C. The Alternate Payee is ordered to report any payments received on any applicable income tax return in accordance with the Internal Revenue Code provisions or regulations in effect at the time any payments are issued by URS.  URS will issue applicable tax forms on any direct payment made to the Alternate Payee.  The Participant and Alternate Payee must comply with Internal Revenue Code and any applicable regulations.</p>
		
		<p style="text-indent: 3em;">D. The Alternate Payee is ordered to provide the Savings Plan prompt written notification of any changes in the Alternate Payee's mailing address.  URS shall not be liable for failing to make payments to the Alternate Payee if URS does not have a current mailing address for the Alternate Payee at the time of payment.</p>
		
		<p style="text-indent: 3em;">E.	A certified copy of this DRO shall be furnished to URS.  URS’ contact information is:</p>
		
		<p style="padding-left: 6em;">Utah Retirement Systems<br>
		Defined Contribution Department<br>
		P.O. Box 1590, Salt Lake City, Utah 84110-1590<br>
		Phone 801-366-7720<br>
		Fax 801-366-7733<br>
		Email dcplans@urs.org<br>
		</p>

		<p style="text-indent: 3em;">
			F.	The Court retains jurisdiction over this DRO so that it will constitute a Domestic Relations Order under the Savings Plan even though all other matters incidental to this action or proceeding have been fully and finally adjudicated.  URS will not accept an Amended DRO if under the original finalized DRO the account or accounts have been divided.  URS will accept a new DRO that provides a fixed dollar division of accounts that have been previously divided. If URS determines at any time that changes in the law, administration of the Savings Plan, or any other circumstances make it impractical to calculate the portion of a distribution awarded to an Alternate Payee by this DRO and so notifies the parties, either or both parties shall immediately petition the Court for a reformation of this DRO with fixed dollar amounts only.
		</p>
			
		<p style="text-indent: 3em;">
			G.	Any DRO requiring market adjustments of more than 7 years must be in a fixed dollar amount with no market adjustment.	
		</p>
	</div>

	
	<table class="signature-block">
		<tr>
			<td style="vertical-align: top;">Approved as to form: ________________</td>
			<td style="vertical-align: top;">
					__________________________________<br>
					<?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?>, Member<br>
					(Signed Electronically)
			</td>
		</tr>
		<tr>
			<td style="vertical-align: top; padding-top:3em;">Approved as to form: ________________</td>
			<td style="vertical-align: top; padding-top:3em;">
					__________________________________<br>
					<?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?>, Alternate Payee<br>
					(Signed Electronically)
			</td>
		</tr>
	</table>

	<p style="text-align:center; padding-top:30px"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
