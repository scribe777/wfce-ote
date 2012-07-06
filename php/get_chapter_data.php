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
	$search = '<span class="chapter_number"> 0</span>';
	$replace = '<span class="chapter_number"> inscriptio</span>';
	
	$output = str_replace($search, $replace, $row['text']);
	$last = $_POST['totalchapters'];
	$search = '<span class="chapter_number"> '.$last.'</span>';
	$replace = '<span class="chapter_number"> subscriptio</span>';
	
	echo str_replace($search, $replace, $output);
}

?>