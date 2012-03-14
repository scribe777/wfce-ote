<?php 
require_once('db.php');
session_start();   
 
$lifeTime =36000000;
setcookie(session_name(), session_id(), time() + $lifeTime, "/");   
//user 

$type=$_GET['type']; //neu user erstell

if($type=='list'){ 
	$sql="SELECT * FROM `wce_user`";
	$res=dbRes($sql);
	$out='';
	while($row=mysql_fetch_array($res)){
		$out.='<li><img src="images/close.gif" title="Delete User"  style="vertical-align:center; cursor:pointer" border="0" onclick="delUser(\''.$row['id'].'\')" /> '.$row['loginname'].'</li>';
	}
	if($out!='')
		$out='<ul>'.$out.'</ul>';
	die($out);
	
}

if($type=='del'){ 
	if(!isset($_GET['id'])) die;
	
	$id=$_GET['id'];
	
	$sql="DELETE  FROM `wce_user` WHERE `id`='".$id."'";   
	$res=dbRes($sql);
	die();
	
}

if(isset($_GET['loginname']) && isset($_GET['email'])){ 
	$mail = $_GET['email']; 
	$name=trim($_GET['loginname']);
	$password=neuPass(4);
	
	if(hasUser($name)){ 
	 	die('user exisitert');		
	} 
 
	$sql="INSERT INTO `wce_user` SET  `loginname`='".$name."', `email`='".$mail."', `password`='".md5($password)."' ";	
	dbRes($sql);
	
	if(hasUser($name)){ 
		if(sendEmail($name,$password,$mail)==true){
			die('1');
		}
		else{
			die('send email error');
		}
	}else{
		die( 'Error');
	}
	 
}

die('0');



//Passwort erzeugen.
function neuPass($length) {
 $hash = '';
 $chars = '0123456789abcdefghijklmnopqrstuvwxyz';
 $max = strlen($chars) - 1;
 mt_srand((double)microtime() * 1000000);
 for($i = 0; $i < $length; $i++) {
  $hash .= $chars[mt_rand(0, $max)];
 }
 return $hash;
}


// testen ober loginname da ist.
function hasUser($loginname){
	$sql="SELECT * FROM `wce_user` WHERE `loginname` LIKE '".$loginname."'";
	$res=dbRes($sql);  
	if(mysql_num_rows($res)>0) return true;
	
	return false; 
}

function sendEmail($username, $passwort, $to){  
	$subject = 'New account for WCE-Online  ';
	$href='http://urts173.uni-trier.de/~gany2d01/test/wce_1/';
	$msg ='A new accout for WCE-Online <a href="'.$href.'">'.$href.'</a> was created.
	<br /><br />
	
	user:  '.$username.'<br />
	password:  '.$passwort.'<br /><br />
	 
	The password can be changed after login. <br /> 
	
	* This email is sent automatically by WCE-Online system. 

	<br />'	;

 	$re='gany2d01@uni-trier.de';
	$p="ganbeargan"; 
 
  	require_once('class.phpmailer.php'); 

	$mail = new PHPMailer(true); // the true param means it will throw exceptions on errors, which we need to catch

	$mail->IsSMTP(); // telling the class to use SMTP 
	try {
	 
	  $mail->Host       = "smtp.uni-trier.de"; // SMTP server
	//  $mail->SMTPDebug  = 2;                     // enables SMTP debug information (for testing)
	  $mail->SMTPAuth   = true;                  // enable SMTP authentication
	  $mail->Host       = "smtp.uni-trier.de"; // sets the SMTP server  
	  $mail->Username   = $re; // SMTP account username
	  $mail->Password   = $p;        // SMTP account password
	  $mail->AddReplyTo($re, 'Yu Gan');
	  $mail->AddAddress($to);
	  $mail->SetFrom($re, 'Yu Gan');
	  $mail->AddReplyTo($re, 'Yu Gan');
	  $mail->Subject = $subject;
	  $mail->CharSet  =  "utf-8"; 
	  $mail->MsgHTML($msg );
	    
	  
	  $mail->Send();
	 // echo "Message Sent OK</p>\n";
	  return true;
	} catch (phpmailerException $e) {
	  echo $e->errorMessage(); //Pretty error messages from PHPMailer
	} catch (Exception $e) {
	  echo $e->getMessage(); //Boring error messages from anything else!
	}

}


?>