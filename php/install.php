<!DOCTYPE html
     PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Database setup</title>
<body>
	<div style="margin: 10px auto 10px auto; width: 80%;">
		<form method="post">
			<input type="checkbox" name="basetext"

			<?php if(isset($_POST['basetext'])) echo 'checked="checked"'; ?> />
			basetext initialize <br /> <input type="checkbox" name="usertext"

			<?php if(isset($_POST['usertext'])) echo 'checked="checked"'; ?> />
			usertext initialize <br /> <input type="checkbox" name="user"

			<?php if(isset($_POST['user'])) echo 'checked="checked"'; ?> /> user
			initialize <br /> <br /> <input type="submit" value="install" />

		</form>
		
		
		
		
 
<?php


if(isset($_POST) && count($_POST)>0){
	require_once('db.php');

	//table for basetext
	if(isset($_POST['basetext'])){
		dbRes ( 'DROP TABLE IF EXISTS  `'.$tablname.'` ') ;
		dbRes ( 'CREATE TABLE IF NOT EXISTS `'.$tablname.'` (
						`id` INT(9) AUTO_INCREMENT,
						`filename` VARCHAR(200),
						`fileid` INT(10),
						`head` LONGTEXT,
						`b` VARCHAR(50),
						`k` INT(10), 
						`text` LONGTEXT, 
						`date` VARCHAR(20),
						PRIMARY KEY  (`id`)
						) ENGINE=MyISAM DEFAULT CHARSET=utf8');     
		echo ':: Table for <span style="color:blue">basetext</span> was created<br />';
		importFiles();
			
	}

	//table for usertext
	if(isset($_POST['usertext'])){
		dbRes ( 'DROP TABLE IF EXISTS  `'.$user_tablname.'` ') ;
		dbRes ( 'CREATE TABLE IF NOT EXISTS `'.$user_tablname.'` (
				`id` INT(9) AUTO_INCREMENT,
				`userid` VARCHAR(200),
				`filename` TEXT,
				`fileid` INT(10),
				`head` LONGTEXT,
				`b` VARCHAR(50),
				`k` INT(10),
				`text` LONGTEXT, 
				`date` VARCHAR(20),
				PRIMARY KEY  (`id`)
				) ENGINE=MyISAM DEFAULT CHARSET=utf8');  
		echo '<br />:: Table for <span style="color:blue">usertext</span> was created';
	}

	//table for user
	if(isset($_POST['user'])){
		dbRes ( 'DROP TABLE IF EXISTS  `wce_user` ') ;
		dbRes ( 'CREATE TABLE IF NOT EXISTS `wce_user` (
				`id` INT(9) AUTO_INCREMENT,
				`givenname` VARCHAR(500),
				`surname`  VARCHAR(500),
				`loginname`  VARCHAR(500),
				`email`  VARCHAR(1000),
				`password` TEXT,
				`class` VARCHAR(50),
				`test_ids` LONGTEXT,
				`create_date` VARCHAR(100),
				`last_login_date` VARCHAR(100),
				PRIMARY KEY  (`id`)
				) ENGINE=MyISAM DEFAULT CHARSET=utf8'); 

		dbRes ( "INSERT INTO `wce_user`(id,loginname,password) VALUE(null,'test','".md5('test')."')");
		echo '<br />:: Table for <span style="color:blue">user</span> was created';
	}

}

function importFiles(){
	global  $tablname;
	$path=	'../basetext';
	$dir = opendir ($path);
	$countFileId=0;
	$fileid=0;
	while ( $filename = readdir ( $dir ) ) {
		if ($filename == '.' || $filename == '..')
		continue;
		//$fileid++;
		if (strpos($filename,'-') === false) {
			$countFileId++;
			$fileid=$countFileId;
		} else {
			$fileid = substr($filename,0,strpos($filename,'-'));
		}
		fileWriteToDB($path, $filename, $fileid);

	}
	closedir ( $dir );

}

function fileWriteToDB($path, $filename, $fileid){
	global  $tablname;

	$pattern_started=$head_writed=false;
	$book=$chapter=$verse=$text=$pattern=$pattern_type=$index='';

	$file = fopen ($path.'/'.$filename,'r');
	$str='';

	ob_flush();
	flush();

	$data=array();
	if (strpos($filename,'-') === false) {
		$sfilename = $filename;
	} else {
		$sfilename=substr($filename,strpos($filename,'-')+1);
	}
	$data['filename']=$filename; //Extract sort part


	while (!feof($file)) {
		$c = fgetc($file);


		//wenn <
		if ($c=='<') {
			$pattern_started=true;

			if ($head_writed==false  &&  $text!='') {
				//save head
				dbRes ( " INSERT INTO `".$tablname."`(`id`,`filename`,`fileid`,`head`,`b`,`k`,`text`,`date`) ".
			 		  "VALUE(null,'".$filename."','".$fileid."','".trim($text)."','$book','','','')"); 
					
				$head_writed=true;
				$text='';

			}
			$pattern=$c;
			continue;
		}

		if ($pattern_started==true){
			if ($pattern=='<B' || $pattern=='<b') {
				$pattern_type='b';
			}else if ($pattern=='<K' || $pattern=='<k' ) {
				$pattern_type='k';
				if ($book!='' && $chapter!='' && $verse!='') {
					//save verse echo 'b'.$book.'k'.$chapter.'v'.$verse.'@@@-'.$text.'-<br />';
					$text=str_filter($text);
					dbRes (" INSERT INTO `".$tablname."`(`id`,`filename`,`fileid`,`head`,`b`,`k`,`text`,`date`) ".
			 		  "VALUE(null,'".$filename."','".$fileid."','','$book','$chapter','$text','')");
					$text='';

				}
			}else if ($pattern=='<V' || $pattern=='<v') {
				$pattern_type='v';
			}
		}

		//wenn >
		if ($c=='>' &&  $pattern_started==true && $pattern_type!='' && $pattern!=''){
			$index=preg_replace('/\D*/i','',$pattern);
			if($pattern_type=='b'){
				$book=$index;
			}else if($pattern_type == 'k'){
				$chapter=$index;
				$text.='<span class="chapter_number"> '.$chapter.'</span><br />';
			}else if($pattern_type=='v'){
				$verse=$index;
				$text=str_replace( "\r\n", "",$text);
				$text=str_replace( "\n", "",$text);
				$text.='<span class="verse_number"> '.$verse.'</span>';
			}



			$pattern_started=false;
			$pattern='';
			continue;
		}

		if ($pattern_started==true) {
			$pattern.=$c;
		} else {
			$text.=$c;
		}

		if (feof($file) ){
			//end
			$text=str_filter($text);
			dbRes (" INSERT INTO `".$tablname."`(`id`,`filename`,`fileid`,`head`,`b`,`k`,`text`,`date`) ".
			 		  "VALUE(null,'".$filename."','".$fileid."','','$book','$chapter','$text','')");
		}
	}

	echo 'import <span style="color:blue">'.$sfilename.' </span>OK<br />';
	fclose ( $file );

}


function str_filter($str){ 
	$overline_class='<span class="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;otherabbrtype=&amp;add_overline=overline" style="border: 1px  dotted #f00; margin: 0px 1px 0px 1px; padding: 0; text-decoration: overline;">';
 
	$word_a=explode(' ',$str);
	$temp='';
	foreach($word_a AS $w){
		if(preg_match('/.{2}¬/',$w)){
			 $w=preg_replace('/¬/','',$w); 
			 $w=$overline_class.$w.'</span>';
		}
		$temp.=$w.' ';
	}
	
	$str=$temp;
	 
	$arr=array();
	$arr['[ns][ol]']=$overline_class;
	$arr['[/ol][/ns]']='</span>';

	foreach($arr AS $k=>$v){
		$str=str_replace($k,$v,$str);
	}

	return trim($str);

}

?>
  
 <br /><br /><a href="../">Home </a>
</div>
</body>

</html>
