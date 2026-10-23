<?php
/**
 * Plugin Name: UtahQDRO Login Migration
 * Description: Temporary private credential bridge for the new client portal.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

add_action('rest_api_init', function () {
    register_rest_route('utahqdro-migration/v1', '/verify', array(
        'methods' => 'POST',
        'permission_callback' => function ($request) {
            $secret = defined('UTAHQDRO_MIGRATION_SECRET') ? UTAHQDRO_MIGRATION_SECRET : '';
            return is_ssl() && strlen($secret) >= 32
                && hash_equals($secret, (string) $request->get_header('x-utahqdro-migration-secret'));
        },
        'callback' => function ($request) {
            $data = $request->get_json_params();
            $email = isset($data['email']) && is_string($data['email']) ? strtolower(trim($data['email'])) : '';
            $password = isset($data['password']) && is_string($data['password']) ? $data['password'] : '';
            if (!is_email($email) || !$password || strlen($password) > 4096) {
                return new WP_Error('invalid_credentials', 'Unable to sign in.', array('status' => 401));
            }
            // Use WordPress authentication so installed account restrictions still apply.
            $user = wp_authenticate($email, $password);
            if (is_wp_error($user) || strtolower($user->user_email) !== $email) {
                return new WP_Error('invalid_credentials', 'Unable to sign in.', array('status' => 401));
            }
            $response = new WP_REST_Response(array(
                'id' => (string) $user->ID,
                'email' => strtolower($user->user_email),
                'displayName' => $user->display_name
            ));
            $response->header('Cache-Control', 'no-store');
            return $response;
        }
    ));
});
