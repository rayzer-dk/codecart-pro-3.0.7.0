#!/usr/bin/env bash
# Isolated experiment only. Generates updated composer.lock / vendor assets for review.
set -euo pipefail
cd "$(dirname "$0")/../../.."
composer update symfony/filesystem symfony/deprecation-contracts --no-interaction --no-scripts --with-all-dependencies
composer require 'guzzlehttp/guzzle:8.5.2' 'guzzlehttp/promises:^3.1' 'guzzlehttp/psr7:^3.4' --no-interaction --no-scripts --with-all-dependencies
composer validate --no-check-publish
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php -r '$data=json_decode(file_get_contents("composer.lock"),true); $wanted=["guzzlehttp/guzzle"=>"8.5.2"];; foreach($data["packages"] as $package){ if(isset($wanted[$package["name"]])){ if($wanted[$package["name"]]!==$package["version"])exit(2); unset($wanted[$package["name"]]); }} if($wanted)exit(3); require "upload/system/storage/vendor/autoload.php"; if(!class_exists("GuzzleHttp\\Client"))exit(4); echo "Updated Guzzle packages verified".PHP_EOL;'
php -r '$data=json_decode(file_get_contents("composer.lock"),true);foreach($data["packages"] as $package){if($package["name"]==="symfony/filesystem"){if(!preg_match("/^v?7\\.4\\./",$package["version"]))exit(5);echo "Symfony filesystem ".$package["version"]." verified".PHP_EOL;exit(0);}}exit(6);'
echo "Review composer.json, composer.lock and generated vendor files before committing to experiment branch."
