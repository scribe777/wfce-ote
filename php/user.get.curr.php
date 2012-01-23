<?php 
session_start(); 

echo urlencode($_SESSION['wce']['user']).'@'.$_SESSION['wce']['userid'].'@'.$_SESSION['wce']['class'];
?>