<?php 
session_start();

require_once('db.php');


if(!isset($_POST['type']) || !isset($_POST['filename']) || !isset($_SESSION['wce']['userid'])) return;

$userid=$_SESSION['wce']['userid']; 
$filename=$_POST['filename'];  
 
if($_POST['type']=='delete')
	$sql="DELETE FROM `$user_tablname` WHERE `userid`='".$userid."' AND  `filename` LIKE '".$filename."' ";
	
else if($_POST['type']=='rename' && isset($_POST['newname'])){
	$newname=addslashes($_POST['newname']);
	$sql="SELECT * FROM `$user_tablname`  WHERE `userid`='".$userid."' AND  `filename` LIKE '".$newname."' ";
	 
	$res=dbRes($sql);
	if(mysql_num_rows($res)>0)
		die("Filename exist");
	
	$sql="UPDATE `$user_tablname` SET `filename`='".$newname."' WHERE `userid`='".$userid."' AND  `filename` LIKE '".$filename."' "; 
}

if($sql!='')
	$res=dbRes($sql);

?>