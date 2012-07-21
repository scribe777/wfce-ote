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

if($row=mysql_fetch_array($res)){
	$search = '<span wce="chapter_number" class="chapter_number"> 0</span>';
	$replace = '<span wce="chapter_number" class="chapter_number"> inscriptio</span>';
	
	$output = str_replace($search, $replace, $row['text']);
	$last = $_POST['totalchapters'];
	$search = '<span wce="chapter_number" class="chapter_number"> '.$last.'</span>';
	$replace = '<span wce="chapter_number" class="chapter_number"> subscriptio</span>';
	
	echo str_replace($search, $replace, $output);
}

?>