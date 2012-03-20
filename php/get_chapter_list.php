<?php 

require_once('db.php'); 
session_start();

if(isset($_POST['filename']))
	$filename=$_POST['filename'];
else return;

if(isset($_POST['userid'])){
	$userid=$_POST['userid'];
}	
else {
	$userid=$_SESSION['wce']['userid'];
}

if($userid=='') return;

$out='';

$sql="SELECT * FROM `$user_tablname` WHERE `userid` LIKE '".$userid."' AND `filename` LIKE '".$filename."' AND `head`='' GROUP BY `k` ORDER BY `k` ASC";

$res=dbRes($sql); 

$options='';
while($row=mysql_fetch_array($res)){ 
	$options.= '<option value="'.$row['k'].'">'.$row['k'].' </option>';
}
if($options!='')
	$out='<span style="margin-left:20px; color:#fff"> Chapter: </span><select id="select_chapter" onchange="gotoChapter(\''.$filename.'\',this);">'.$options.'</select>'.
	' <input type="button" onclick="chapterBrowse(\''.$filename.'\',-1);" value="<" /> <input type="button" onclick="chapterBrowse(\''.$filename.'\',1);" value=">" /><span style="margin-left:20px; color:#fff"> File: '.$filename.'</span>';
	
//get metadata
$sql="SELECT * FROM `$user_tablname` WHERE `userid` LIKE '".$userid."' AND `filename` LIKE '".$filename."' AND `head`!='' GROUP BY `k` ORDER BY `k` ASC";	
$res=dbRes($sql); 
if($row=mysql_fetch_array($res)){ 
	$header=  $row['head'];
}
	
echo $header.'@@@'.$out;
?>