<?php
/**
 * Template Name: Withdrawal of Counsel Template
 * Version: 1.0
 * Description: A minimalist template that will generate a well-spaced document great for printing. Through the Template tab, you can control the PDF header and footer, change the background color or image, and show or hide the form title, page names, HTML fields and the Section Break descriptions.
 * Author: Gravity PDF
 * Author URI: https://utahqdro.com
 * Group: UtahQDRO
 * License: GPLv2
 * Required PDF Version: 4.0
 * Tags: Header, Footer, Background, Optional HTML Fields, Optional Page Fields, Container Background Color
 */

 /* Prevent direct access to the template (always good to include this) */
if ( ! class_exists( 'GFForms' ) ) {
    return;
}


// Get versions of fields (replace IDs with actual field IDs if different)
$district   = isset( $form_data['field'][141] ) ? strtoupper( $form_data['field'][141] ) : '';
$county     = isset( $form_data['field'][140] ) ? strtoupper( $form_data['field'][140] ) : '';
$court_name = isset( $form_data['field'][139] ) ? strtoupper( $form_data['field'][139] ) : '';

?>

<!-- Any PDF CSS styles can be placed in the style tag below -->
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
	.case-info-table {
		width: 100%;
		margin-top: 20px;
		border-collapse: collapse;
	}
	.case-info-table td {
		border: 1px solid black;
		padding: 15px;
		vertical-align: top;
	}
</style>

<div>
	<p style="line-height:1.3">David J. Hunter (9015)<br>
	3915 Timpview Dr., Provo, UT 84604<br>
	801-473-4444 dave@utahmediations.com
	</p>
	<p style="font-style: italic;">Counsel for {Your name (First):130.3} {Your name (Last):130.6}</p>


	<table class="case-info-table">
		<tr>
			<td colspan="2" style="text-align:center; border-bottom:1px solid black; padding:5px;">
				IN THE <?php echo $district; ?> JUDICIAL DISTRICT COURT IN AND FOR <?php echo $county; ?> COUNTY<br>
				STATE OF UTAH
			</td>
		</tr>
		<tr>
			<td style="padding:20px;">
				In the Matter of the Marriage of<br><br>
				{Party 1 name (First):48.3} {Party 1 name (Last):48.6}, and<br>
				{Party 2 name (First):64.3} {Party 2 name (Last):64.6}.
			</td>
			<td style="padding:20px;">
				WITHDRAWAL OF COUNSEL<br><br>
				Case No. {What is your case number?:142}<br>
				Judge {Who was the judge that signed your decree?:143}
			</td>
		</tr>
	</table>

	<div style="line-height:28px; padding:20px 0;">
		COMES NOW David J. Hunter and withdrawals as limited counsel effective immediately.
	</div>

	<table style="padding:20px 0;">
		<tr>
			<td style="padding-left:3em; vertical-align:top;">DATED <?php date_default_timezone_set('America/Denver'); echo date('F j, Y'); ?>.</td>
			<td style="padding-left:3em">
				<u>/s/ David J. Hunter</u><br/>
				David J. Hunter
			</td>
		</tr>
	</table>


	<div style="padding:20px 0;">
		<u>Certificate of Service E-FILING</u>: The forgoing was served upon opposing counsel of record, if any, via the court’s e-filing service to the email on file on this date.
	</div>

	<table style="padding:20px 0;">
		<tr>
			<td style="padding-left:3em; vertical-align:top;">DATED <?php date_default_timezone_set('America/Denver'); echo date('F j, Y'); ?>.</td>
			<td style="padding-left:3em">
				<u>/s/ David J. Hunter</u><br/>
				David J. Hunter
			</td>
		</tr>
	</table>

	<div style="padding:20px 0;">
		<u>Certificate of Service Email</u>: The forgoing was served upon the following persons via email along with a copy of the signed and certified QDRO on this date:
	</div>

	<table style="padding:20px 0;">
		<tr>
			<td>{Party 1 name (First):48.3} {Party 1 name (Last):48.6}</td>
			<td style="padding-left:2em;">
				{Party 1 email:51}
			</td>
		</tr>
		<tr>
			<td>{Party 2 name (First):64.3} {Party 2 name (Last):64.6}</td>
			<td style="padding-left:2em;">
				{Party 2 email:67}
			</td>
		</tr>
	</table>

	<table style="padding:20px 0;">
		<tr>
			<td style="padding-left:3em; padding-top:20px;">DATED <?php date_default_timezone_set('America/Denver'); echo date('F j, Y'); ?>.</td>
			<td style="padding-left:3em; padding-top:20px;">
				<u>/s/ David J. Hunter</u><br/>
				David J. Hunter
			</td>
		</tr>
	</table>
</div>