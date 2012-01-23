<?php 
require_once('db.php');
session_start();  

if(isset($_GET['type']) && $_GET['type']==0){
	$_SESSION['wce']=array(); 
	die('1');
}
 
$lifeTime =36000000;
setcookie(session_name(), session_id(), time() + $lifeTime, "/");   
//user 
if(isset($_GET['user']) && isset($_GET['psd'])){ 
	 	
	$loginname=trim($_GET['user']);
	$loginpassword=trim($_GET['psd']);
	if($_GET['type']==3){
		$sql="UPDATE `wce_user` SET  `password`='".md5($loginpassword)."' WHERE `loginname`='".$loginname."'";
		dbRes($sql);
	}
	
	$sql="SELECT * FROM `wce_user` WHERE `loginname`='".$loginname."' AND `password`='".md5($loginpassword)."'";
	
	$res=dbRes($sql);	
	if($row=mysql_fetch_array($res)){ 
		$_SESSION['wce']=array();
		$_SESSION['wce']['user']=$loginname;
		$_SESSION['wce']['userid']=$row['id'];
		$_SESSION['wce']['class']=$row['class']; 
		die('1');
	} 
	$_SESSION['wce']=array();
}
die('0');

?>