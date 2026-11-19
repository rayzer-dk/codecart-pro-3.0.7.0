<?php
declare(strict_types=1);
$root = dirname(__DIR__);
require_once $root . '/upload/system/library/codecart/src/CompatibilityAdapterInterface.php';
require_once $root . '/upload/system/library/codecart/src/Unishop2Compatibility.php';
$path = 'catalog/model/catalog/product.php';
$anchor = 'if (isset($data[\'sort\']) && in_array($data[\'sort\'], $sort_data)) {';
$payload = "\n\$uniset = \$this->config->get('config_unishop2');\n\$sort_qty = '';\nif(\$uniset['sort_qty'] == 1){if(isset(\$data['sort'])&&\$data['sort']=='p.sort_order'){\$sort_qty='(p.quantity > 0) DESC,';}}elseif(\$uniset['sort_qty'] == 2){\$sort_qty='(p.quantity > 0) DESC,';}\n";
foreach (['3.6.6.0', '3.6.9.0'] as $version) {
    $normalized = \CodeCart\Core\Unishop2Compatibility::normalizeOcmodAdd('UniShop2 template', $version, $path, $anchor, $payload);
    if (substr_count($normalized, "?? 0") !== 2) {
        fwrite(STDERR, "FAIL stock sorting adaptation for {$version}\n");
        exit(1);
    }
    $safe = \CodeCart\Core\Unishop2Compatibility::normalizeOcmodAdd('UniShop2 template', $version, $path, '$sql .= " ORDER BY', '$sql .= " ORDER BY ".$sort_qty."');
    if (strpos($safe, "?? ''") === false) {
        fwrite(STDERR, "FAIL uninitialized sort variable mitigation for {$version}\n");
        exit(1);
    }
}
$xml = new DOMDocument();
if (!$xml->load($root . '/experiments/bootstrap5-fa7/unishop2-3.6.9/compatibility.ocmod.xml', LIBXML_NONET)) {
    throw new RuntimeException('Invalid UniShop2 compatibility OCMOD');
}
$ops = $xml->getElementsByTagName('operation');
if ($ops->length !== 3) {
    throw new RuntimeException('Unexpected UniShop2 compatibility operation count');
}
foreach (['uniset','lang_id','route'] as $i => $property) {
    $op = $ops->item($i);
    $find = trim((string)$op->getElementsByTagName('search')->item(0)->textContent);
    $replace = trim((string)$op->getElementsByTagName('add')->item(0)->textContent);
    if ($find !== 'static $' . $property . ';' || $replace !== 'private $' . $property . ';') {
        throw new RuntimeException('Unexpected OCMOD operation for ' . $property);
    }
}
echo "PASS UniShop2 3.6.6 and 3.6.9 stock-sort adapters and PHP 8.2 OCMOD structure\n";
