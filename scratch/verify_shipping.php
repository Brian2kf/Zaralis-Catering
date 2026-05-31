<?php
function calc($km) {
    $min = 16000; $t1 = 2000; $t2 = 2500; $thr = 20;
    $km = ceil($km * 10) / 10;
    if ($km <= $thr) $c = $km * $t1;
    else             $c = ($thr * $t1) + (($km - $thr) * $t2);
    return max($min, (int) round($c));
}
$tests = [7, 10, 20, 20.1, 22, 35];
foreach ($tests as $km) {
    echo $km . " km -> Rp " . number_format(calc($km)) . "\n";
}
