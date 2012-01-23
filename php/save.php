<?php 
require_once('db.php');
session_start();

//test
if(isset($_POST['userid'])){
	$userid=$_POST['userid'];
}else{	
	$userid= $_SESSION['wce']['userid'];
}

if($userid==''){
	die('Error: no userid');
}
 

$text=$_POST['text']; 
$text=preg_replace('/<span\s*class="verse_number">\s*<\/span>/','',$text);

$sql="UPDATE `$user_tablname` SET `text`='".$text."' WHERE `userid`='".$userid."' AND `filename`='".$_POST['filename']."' AND `k`='".$_POST['chapter']."' AND `head`=''";  
dbRes($sql);  

?>