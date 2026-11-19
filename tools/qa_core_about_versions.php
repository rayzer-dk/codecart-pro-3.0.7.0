<?php
/**
 * CodeCart PRO 3.0.7.0 - System/About component metadata contracts.
 * Static assertions only: no database or external services are touched.
 */
declare(strict_types=1);

$root = dirname(__DIR__);
$errors = array();
$check = static function (bool $ok, string $description) use (&$errors): void {
    if (!$ok) {
        $errors[] = $description;
        fwrite(STDERR, "FAIL: " . $description . PHP_EOL);
    }
};
$read = static function (string $path) use ($root, $check): string {
    $full = $root . '/' . $path;
    if (!is_file($full)) {
        $check(false, "Missing file: " . $path);
        return '';
    }
    return (string)file_get_contents($full);
};
$controller = $read('upload/admin/controller/tool/codecart_core.php');
$composer = json_decode($read('composer.lock'), true);
$check(is_array($composer), 'composer.lock JSON is valid');
$packages = array();
foreach (($composer['packages'] ?? array()) as $package) {
    if (isset($package['name'], $package['version'])) {
        $packages[(string)$package['name']] = ltrim((string)$package['version'], 'v');
    }
}
foreach (array(
    'guzzlehttp/guzzle' => '8.5.2',
    'twig/twig' => '3.30.0',
    'symfony/filesystem' => '7.4.23',
    'guzzlehttp/promises' => '3.1.0',
    'guzzlehttp/psr7' => '3.5.0'
) as $package => $version) {
    $check(($packages[$package] ?? null) === $version, 'Locked ' . $package . ' = ' . $version);
}
$check(strpos($controller, "'product' => 'CodeCart PRO 3.0.7.0'") !== false, 'System name reflects 3.0.7.0');
$check(strpos($controller, "version_compare(PHP_VERSION, '8.2.0', '>=')") !== false, 'PHP minimum is 8.2');
$check(strpos($controller, "'5.3.9 default / 3.4.1 fallback'") !== false, 'Bootstrap 5 default and fallback');
$check(strpos($controller, "'4.1.0 default / 3.8.0 fallback'") !== false, 'jQuery 4 default and fallback');
$check(strpos($controller, "'4.0.2 default / 3.6.0 fallback'") !== false, 'jQuery Migrate default and fallback');
$check(strpos($controller, 'Air Datepicker 3.6.0 + Day.js 1.11.23 opt-in') !== false, 'Datepicker opt-in status');
$check(strpos($controller, "'Symfony Filesystem'") !== false, 'Symfony Filesystem reported');
foreach (array('uk-ua', 'ru-ru', 'en-gb') as $locale) {
    $lang = $read('upload/admin/language/' . $locale . '/tool/codecart_core.php');
    foreach (array('cmp_jquery_modes', 'cmp_migrate_modes', 'cmp_bootstrap_modes',
                   'cmp_codemirror_modes', 'cmp_datepicker_modes', 'cmp_legacy_assets') as $key) {
        $check(strpos($lang, "\$_['" . $key . "']") !== false, $locale . ' has ' . $key);
    }
    $check(strpos($lang, '4.1.0') !== false, $locale . ' names jQuery 4.1.0');
    $check(strpos($lang, '5.3.9') !== false, $locale . ' names Bootstrap 5.3.9');
    $check(strpos($lang, '7.3.1') !== false, $locale . ' names Font Awesome 7.3.1');
    $check(strpos($lang, '3.7.1 everywhere') === false && strpos($lang, '3.7.1 скрізь') === false && strpos($lang, '3.7.1 везде') === false, $locale . ' has no obsolete default jQuery claim');
}
$check(strpos($read('README.md'), 'CodeCart PRO 3.0.7.0') !== false, 'README product name');
if ($errors) {
    fwrite(STDERR, 'Core/About contracts failed: ' . count($errors) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, 'PASS CodeCart PRO 3.0.7.0 Core/About version contracts.' . PHP_EOL);
