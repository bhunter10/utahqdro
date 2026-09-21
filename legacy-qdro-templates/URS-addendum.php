<?php
/**
 * Template Name: URS Addendum Template
 * Version: 1.0
 * Description: A compliant Gravity PDF template for URS QDROs that supports multi-page expansion.
 * Group: UtahQDRO
 * Required PDF Version: 4.0
 */

if ( ! class_exists( 'GFForms' ) ) {
    return;
}

// Court info
$court_district = $form_data['field'][141] ?? ''; // e.g. "Fourth Judicial District"
$county = $form_data['field'][140] ?? '';
$court_name = $form_data['field'][139] ?? '';

// Account owner selection (label, since "Show Values" is off)
$account_owner_value = rgar( $entry, '109' );
if ( empty( $account_owner_value ) ) {
    $account_owner_value = $form_data['field'][109] ?? '';
}

// Default names
$owner_first_name = 'Unknown';
$owner_last_name  = 'Owner';
$owner_address_line1 = 'Unknown Address';
$owner_address_line2 = '';
$owner_city = '';
$owner_state = '';
$owner_zip = '';

// Party 1 and Party 2 data
$party1_name = $form_data['field'][48] ?? [];
$party1_social = $form_data['field'][53] ?? [];
$party1_dob = $form_data['field'][55] ?? [];
$party1_phone = $form_data['field'][50] ?? '';
$party1_email = $form_data['field'][51] ?? '';
$party1_address = $form_data['field'][49] ?? [];

$party2_name = $form_data['field'][64] ?? [];
$party2_social = $form_data['field'][69] ?? [];
$party2_dob = $form_data['field'][65] ?? [];
$party2_phone = $form_data['field'][68] ?? '';
$party2_email = $form_data['field'][67] ?? '';
$party2_address = $form_data['field'][66] ?? [];

// Determine owner info based on selected party
if ( $account_owner_value === 'Party 1 (First person named in your case)' ) {
    $owner_first_name = $party1_name['first'] ?? 'Unknown';
    $owner_last_name  = $party1_name['last'] ?? 'Owner';
    $owner_social  = $party1_social ?? 'xxx-xx-xxxx';
    $owner_dob  = $party1_dob ?? 'xx/xx/xxxx';
    $owner_phone = $party1_phone ?? '(xxx) xxx-xxxx';
    $owner_email = $party1_email ?? 'no email provided';

    // address
    $owner_address_line1 = $party1_address['street1'] ?? $party1_address['street'] ?? 'Unknown Address';
    $owner_address_line2 = $party1_address['street2'] ?? $party1_address['line2'] ?? '';
    $owner_city          = $party1_address['city']    ?? '';
    $owner_state         = $party1_address['state']   ?? '';
    $owner_zip           = $party1_address['zip']     ?? '';

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    $owner_first_name = $party2_name['first'] ?? 'Unknown';
    $owner_last_name  = $party2_name['last'] ?? 'Owner';
    $owner_social  = $party2_social ?? 'xxx-xx-xxxx';
    $owner_dob  = $party2_dob ?? 'xx/xx/xxxx';
    $owner_phone = $party2_phone ?? '(xxx) xxx-xxxx';
    $owner_email = $party2_email ?? 'no email provided';
    // address
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

// Determine other party (not selected in field 109)
if ( $account_owner_value === 'Party 1 (First person named in your case)' ) {
    // Receiver is Party 2
    $receiver_first_name = $party2_name['first'] ?? 'Unknown';
    $receiver_last_name  = $party2_name['last'] ?? 'Receiver';
    $receiver_social = $party2_social ?? 'xxx-xx-xxxx';
    $receiver_dob  = $party2_dob ?? 'xx/xx/xxxx';
    $receiver_phone = $party2_phone ?? '(xxx) xxx-xxxx';
    $receiver_email = $party2_email ?? 'no email provided';

} elseif ( $account_owner_value === 'Party 2 (Second person named in your case)' ) {
    // Receiver is Party 1
    $receiver_first_name = $party1_name['first'] ?? 'Unknown';
    $receiver_last_name  = $party1_name['last'] ?? 'Receiver';
    $receiver_social  = $party1_social ?? 'xxx-xx-xxxx';
    $receiver_dob  = $party1_dob ?? 'xx/xx/xxxx';
    $receiver_phone = $party1_phone ?? '(xxx) xxx-xxxx';
    $receiver_email = $party1_email ?? 'no email provided';
}

// Requesting person info
$requesting_name = $form_data['field'][130] ?? [];
$requesting_full_name = trim(ucfirst($requesting_name['first'] ?? '') . ' ' . ucfirst($requesting_name['last'] ?? ''));

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

<div>
    <h3>Approved Domestic Relations Order</h3>
    <div class="subheading">Defined Benefit / Defined Contribution Savings Plans</div>

    <div class="addendum-banner">
        <strong>PRIVATE SEPARATE ADDENDUM</strong> » This addendum must accompany all proposed domestic relations orders submitted to URS for pre-approval or approval.
    </div>

    <table class="table">
        <tr>
            <td>Case Name:</td>
            <td>In the Matter of the Marriage of<br>
            <?php echo esc_html($party1_name['first'] ?? '') . ' ' . esc_html($party1_name['last'] ?? ''); ?>, and <?php echo esc_html($party2_name['first'] ?? '') . ' ' . esc_html($party2_name['last'] ?? ''); ?></td>
        </tr>
        <tr>
            <td>County/City and Court:</td>
            <td><?php echo $court_district . ', ' . $court_name . ', ' . $county; ?></td>
        </tr>
        <tr>
            <td>Case No.:</td>
            <td><?php echo $form_data['field'][142] ?? ''; ?></td>
        </tr>
        <tr>
            <td colspan="2" class="section-header">
                MEMBER INFORMATION
            </td>
        </tr>
        <tr>
            <td>Member Name:</td>
            <td><?php echo esc_html( $owner_first_name . ' ' . $owner_last_name ); ?></td>
        </tr>
        <tr>
            <td>Member Social Security Number:</td>
            <td><?php echo esc_html( $owner_social  ); ?></td>
        </tr>
        <tr>
            <td>Member Date of Birth:</td>
            <td><?php echo esc_html($owner_dob); ?></td>
        </tr>
        <tr>
            <td>Member Phone Number:</td>
            <td><?php echo esc_html($owner_phone); ?></td>
        </tr>
        <tr>
            <td>Member Email:</td>
            <td><?php echo esc_html($owner_email); ?></td>
        </tr>
        <tr>
            <td colspan="2" class="section-header">
                ALTERNATE PAYEE INFORMATION
            </td>
        </tr>
        <tr>
            <td>Alternate Payee Name:</td>
            <td><?php echo esc_html( $receiver_first_name . ' ' . $receiver_last_name ); ?></td>
        </tr>
        <tr>
            <td>Alternate Payee Social Security Number:</td>
            <td><?php echo esc_html( $receiver_social ); ?></td>
        </tr>
        <tr>
            <td>Alternate Payee Date of Birth:</td>
            <td><?php echo esc_html($receiver_dob); ?></td>
        </tr>
        <tr>
            <td>Alternate Payee Phone Number:</td>
            <td><?php echo esc_html($receiver_phone); ?></td>
        </tr>
        <tr>
            <td>Alternate Payee Email:</td>
            <td><?php echo esc_html($receiver_email); ?></td>
        </tr>
    </table>

    <p style="padding-top:20px;">This information provided by:</p>

    <div class="signature-line"><span class="field-label">Signature:</span> ___________________________________________________</div>
    <div class="field"><span class="field-label">Print Name:</span> <?php echo esc_html($requesting_full_name); ?></div>
</div>
