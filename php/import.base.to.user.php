<?php 
session_start();
require_once('db.php');

if(!isset($_POST['ids'])) return;

$id_arr=explode('@',$_POST['ids']);
	
foreach($id_arr AS $fileid){ 
	if($fileid!='')
		importBaseFile($fileid);
} 
 
function getFileName($fileid){
	global $tablname, $user_tablname;
	
	//get base textname
	$sql="SELECT DISTINCT `filename` FROM `$tablname` WHERE `fileid` LIKE '$fileid'";
	$res=dbRes($sql);
	$name='';
	if($row=mysql_fetch_array($res))
			$name= $row['filename'];
			
	if($name=='') return '';
	
	$userid=$_SESSION['wce']['userid'];
	
	$res2=dbRes("SELECT DISTINCT `filename`  FROM `$user_tablname` WHERE `userid`='".$userid."'");
	$name_arr=array();  
	while($row2=mysql_fetch_array($res2)){ 
		array_push($name_arr,$row2['filename']);
	} 
 	 
	if(count($name_arr>0)){
		$tempname=$name; 
		$i=0;
		while(in_array($tempname,$name_arr)){	 
			$i++; 
			$tempname=$name.'_'.$i;  
		}
	    $name=$tempname;
		
	}
	return $name;
	
}

function importBaseFile($fileid){ 
	global $tablname, $user_tablname;

	//name von basetext
	$name=getFileName($fileid);  
	
	if($name=='') 
		return; 
		
	if(!$_SESSION['wce']['userid']) return;
	
	$userid=$_SESSION['wce']['userid'];

	if($userid=='') return;
	
	//copy
	$res_basetext=dbRes("SELECT * FROM `$tablname` WHERE `fileid` LIKE '$fileid' ORDER BY `id` ASC");
	while($r=mysql_fetch_array($res_basetext)){	 
		$sql="INSERT INTO  `$user_tablname`(`id`,`userid`,`filename`,`fileid`,`head`,`b`,`k`,`text`,`date`)";
		$sql.="VALUE(null,'".$userid."','$name','$fileid','".$r['head']."','".$r['b']."','".$r['k']."','".$r['text']."','".$r['date']."')";
		dbRes($sql); 
	}
	 
} 

?>