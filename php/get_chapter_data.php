<?php 
 
require_once('db.php');
 

$sql="SELECT * FROM `$user_tablname` WHERE `filename` LIKE '".$_POST['filename']."' AND `userid`='".$_POST['userid']."' AND `head`='' ";

if($_POST['k']!=''){
	$sql.="AND `k` LIKE '".$_POST['k']."'";
}else{
	$sql.="  ORDER by `k` LIMIT 1"; 
}
 
$res=dbRes($sql);
if(mysql_num_rows($res)==0)
	echo 'ERROR';

while($row=mysql_fetch_array($res)){
	echo $row['text'];
}

?>