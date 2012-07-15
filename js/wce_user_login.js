/**
* Toolbar for user (login, logout, open-file, import file, save text)
*/
function WceUserToolbar(parent_container_id) {
	var parent_container = $('#' + parent_container_id);

	// current chapter
	var curr_chapter = '';

	// current book
	var curr_usertext_name = '';

	// current user id
	var curr_user_id = '';

	// current user name
	var curr_user_name = '';
	
	

	// html init
	var t_html = '<input type="button" onclick="saveDB();" id="save_button"  value="Save" /><input id="login_button" type="button" value="Login" /><input id="open_file_button" type="button" disabled value="Open" /><div id="open_file_box" style="border: 1px solid #000; display: none; padding: 1px; width: 450px; height: 400px; position: absolute; z-index: 2; background-color: #efefef;"><div style="width: 100%; height: 100%; position: relativ; padding-left: 10px"><div id="import_file_box" style="display: none; position: absolute; height: 80%; top: -10px; width: 80%; z-index: 3; right: 0px; background-color: #ddd; border: 1px solid #000"><div style="text-align: right"><input type="button" value="Close" id="import_cancel" /> <input type="button" value="OK" id="import_ok" /></div><div id="base_file_list_wrap" style="padding: 10px; overflow: auto; height: 80%"></div></div>Usertext:<div id="user_file_list_wrap" style="padding: 10px; overflow: auto; height: 340px;"></div><div style="position: absolute; bottom: 10px"><input type="button" value="OK" id="open_file_ok" /> <input type="button" value="Close" id="open_file_cancel" />&nbsp;&nbsp;&nbsp;&nbsp; <input type="button" value="Rename" id="open_file_rename" /> <input type="button" value="Delete" id="open_file_delete" /> <input type="button" value="Import base text" id="open_file_import" /></div></div></div><input type="button" id="userSetup" onclick="wceUserSetup(this);" value="Setup" style="display:none" /> <span id="tool_span"></span>';
	$(parent_container).html(t_html);

	// read user info
	$(function() {
		$.ajax({
			type : 'POST',
			url : 'php/user.get.curr.php',
			success : function(msg) {
				if (msg != null) {
					var a = msg.split('@');
					if (typeof a[0] != 'undefined') {
						curr_user_name = decodeURIComponent(a[0].replace(/\+/ig, ' '));
					}
					if (typeof a[1] != 'undefined') {
						curr_user_id = a[1];
						user_id=curr_user_id;
					}
				} else {
				}

				if (curr_user_name != '') {
					$(document).ready(function() {
						$('#login_button').val('User:' + curr_user_name);
						$('#open_file_button').attr('disabled', false);
					});
					
					if(curr_user_name=='gan' || curr_user_name=='martin'){
						$('#userSetup').show();
					}else{
						$('#userSetup').hide();
					}
					
				} else {
					$(document).ready(function() {
						$('#login_button').val('Login');
						$('#open_file_button').attr('disabled', true);

					});
				}
			}
		});
		

		wceUserSetup = function(bt, event) {
			var createUserBox = document.getElementById('createUserBox');

			if (typeof (createUserBox) != 'undefined' && createUserBox != null) {
				if ($('#createUserBox').css('display') == 'none') {
					$('#createUserBox').slideDown();
					getUserList();
				} else {
					$('#createUserBox').slideUp();
				}

				return;
			}

			var x = $(bt).offset().left;
			var y = $(bt).offset().top + $(bt).height() + 10;
			var newDiv = document.createElement('div');
			var newDivHtml = '<div id="createUserBox" style=" border:1px solid #000000; padding:0px; display:none; width:370px; top:'
					+ y
					+ 'px; left:'
					+ x
					+ 'px; background-color:#D9B38C; position:absolute; font-size:12px; z-index:998;"><div><form><table cellspacing="10" border="0" style="padding:5px;width:100%"><tr><td>Loginname:</td><td><input type="text" name="newlogingname" id="newloginname" value=""  /></td></tr><tr><td>Email:</td><td><input name="email1" id="email1" type="text" value="" /></td></tr><tr><td> Email again:</td> <td><input name="email2" id="email2" type="text" value="" /></td></tr><tr><td><input type="button" value="create user" onclick="wcecreateUser()"; /></td><td style="text-align:right"><input type="reset" id="createUserBoxReset" value="Reset" /> <input type="button" style="margin-left:10px;" onclick="$(\'#createUserBox\').slideUp();" value="Close"></td></tr>';

			newDivHtml += '</table></form></div><div id="userlistbox"></div></div>';

			newDiv.innerHTML = newDivHtml;
			$(document.body).append(newDiv);
			getUserList();
			$('#createUserBox').slideDown();
		}

		wcecreateUser = function() {
			var e1 = $('#email1').val();
			var e2 = $('#email2').val();
			if (typeof e1 == 'undefined' || typeof e2 == 'undefined' || e1 == '' || e2 == '' || (!e1.match(/.*@.*/)) || (!e2.match(/.*@.*/))) {
				alert('Email not available');
				return;
			}

			if (e1 != e2) {
				alert('Email not same');
				return;
			}

			var u1 = $('#newloginname').val();
			if (typeof u1 == 'undefined' && u1 == '') {
				return;
			}

			$.ajax({
				url : "php/user.php",
				type : "GET",
				data : "type=new&loginname=" + u1 + "&email=" + e1,
				success : function(msg) {
					if (msg != '') {
						if (msg == 1) {
							alert('new user ' + u1 + ' are created and email  are sent to ' + e1);
							$('#createUserBoxReset').click();
							getUserList();
						} else
							alert(msg);

					}
					return;
				}
			});
		}
	});

	wceUserLogin = function(bt, event) {
		event = event ? event : window.event;
		if (curr_user_id > 0) {
			var logoutBox = document.getElementById('logoutBox');

			if (typeof (loginBox) != 'undefined' && loginBox != null) {
				if ($('#logoutBox').css('display') == 'none') {
					$('#logoutBox').slideDown();
				} else {
					$('#logoutBox').slideUp();
				}

				return;
			}

			var x = $(bt).offset().left;
			var y = $(bt).offset().top + $(bt).height() + 10;
			var newDiv = document.createElement('div');
			var newDivHtml = '<div id="logoutBox" style=" border:1px solid #000000; padding:0px; display:none; width:370px; top:'
					+ y
					+ 'px; left:'
					+ x
					+ 'px; background-color:#D9B38C; position:absolute; font-size:12px; z-index:998;"><div><table cellspacing="10" border="0" style="padding:5px;width:100%"><tr><td><input type="button"  onclick="userLogout();" value="Logout" /></td><td style="text-align:right"><input type="button" style="margin-left:10px;" onclick="$(\'#logoutBox\').slideUp();" value="Cancel"></td></tr>';

			if (typeof curr_user_name != 'undefined' && curr_user_name != 'test')
				newDivHtml += '<tr><td></td><td></td></tr><tr><td colspan="2">Change your password:</td></tr><tr><td align="right">New password: </td><td><input id="newpassword1" type="password" style="width:200px" name="newpassword1" value="" /></td></tr><tr><td align="right">Password again:</td><td><input id="newpassword2" type="password" style="width:200px" name="newpassword2" value="" /></td></tr><tr><td align="center"></td><td><input type="button" onclick="tologin(3);" value="Change" /> </td></tr><tr><td colspan="2" ></td></tr>';

			newDivHtml += '</table></div></div></div>';

			newDiv.innerHTML = newDivHtml;
			$(document.body).append(newDiv);
			$('#logoutBox').slideDown();
			return;

		}

		var loginBox = document.getElementById('loginBox');

		if (typeof (loginBox) != 'undefined' && loginBox != null) {
			if ($('#loginBox').css('display') == 'none') {
				$('#loginBox').slideDown();
			} else {
				$('#loginBox').slideUp();
			}

			return;
		}

		var x = $(bt).offset().left;
		var y = $(bt).offset().top + $(bt).height() + 10;
		var newDiv = document.createElement('div');
		newDiv.innerHTML = '<div id="loginBox" style=" border:0px solid #000000; padding:0px; display:none; width:470px; top:'
				+ y
				+ 'px; left:'
				+ x
				+ 'px; background-color:#D9B38C; position:absolute; font-size:12px; z-index:998;"><div><table cellspacing="10" border="0" style="padding:5px;width:100%"><tr><td align="right">user: </td><td><input id="login_username" type="text" style="width:200px" name="login_username" value="" /> <input type="button" onclick="$(\'#login_username\').val(\'test\');$(\'#login_password\').val(\'test\');" value="test user" /></td></tr><tr><td align="right">password:</td><td><input id="login_password" type="password" style="width:200px" name="login_password" value="" /></td></tr><tr><td align="center"></td><td><input type="button" onclick="tologin(1);" value="OK" /> <input type="button" style="margin-left:10px;" onclick="$(\'#loginBox\').slideUp();" value="Cancel"></td></tr><tr><td colspan="2" ></td></tr><tr><td colspan="2"  align="left"><a href="javascript:void(0)">Register</a> <a  href="javascript:void(0)" style="float:right">Forgot your password?</a></td></tr></table><div id="mail_div" style="display:none; padding:10px; margin-top:10px; border:1px solid #aaab9c; background-color:#D9B38C; z-index:2"><div style="margin-top:0px;"><a style="float:right" href="javascript:void(0);" onclick="" class="gLinksB"> <img  title="close" style="float:right;" border="0" src="images/close.gif" /> </a> Aus Sicherheitsgr¨¹nden speichern wir Ihr Passwort verschl¨¹sselt und k?nnen es Ihnen daher nicht per E-Mail schicken. Um ein neues Passwort zu erhalten, tragen Sie unten bitte Ihre Email-Adresse ein. Wir werden Ihnen daraufhin eine E-Mail schicken, in der das weitere Vorgehen beschrieben ist.</div>E-Mail: <input type="text" id="emailAdresse" value="" size="20" /> <input type="button" onclick=" " value=" Email anfordern" /></div></div></div>';
		$(document.body).append(newDiv);
		$('#loginBox').slideDown();
	}

	userLogout = function() {
		if (!confirm('Are you sure you want to log out?'))
			return;

		tologin(0);
		return;

	}

	tologin = function(_type) {
		var user, psw;

		if (_type == 3) {
			var p1 = $('#newpassword1').val();
			var p2 = $('#newpassword2').val();
			if (typeof p1 == 'undefined' || typeof p2 == 'undefined' || p1 == '' || p2 == '') {
				alert('password not available');
				return;
			}

			if (p1 != p2) {
				alert('password not same');
				return;
			}
			psd = $('#newpassword1').val();
			user = curr_user_name;
		} else {
			psd = $('#login_password').val();
			user = $('#login_username').val();
		}

		$.ajax({
			url : "php/login.php",
			type : "GET",
			data : "type=" + _type + "&user=" + user + "&psd=" + psd,
			success : function(msg) {
				if (msg == 1) {
					if (_type == 1)
						alert('You are logged in as ' + $('#login_username').val());

					if (_type == 3) {
						alert('You password are changed');
						$('#logoutBox').slideUp();
					} else
						window.location.reload();
				} else if (_type == 1) {
					alert('user or password not right');
				}
			}
		});
	}

	getUserList = function() {
		$.ajax({
			url : "php/user.php",
			type : "GET",
			data : "type=list",
			success : function(msg) {
				$('#userlistbox').html(msg);
			}
		});

	}

	delUser = function(_id) {
		if (!confirm('Are you sure you want to delete the user?'))
			return;

		$.ajax({
			url : "php/user.php",
			type : "GET",
			data : "type=del&id=" + _id,
			success : function(msg) {
				getUserList();
			}
		});

	}

	gotoChapter = function(usertext_name, sele) {
		readfile(usertext_name, $(sele).val(), 0);
	}

	chapterBrowse = function(usertext_name, n) {
		var k = $('#select_chapter').val();
		var options = $('#select_chapter option');
		var sele_index = 0;
		for ( var i = 0; i < options.length; i++) {
			if (options[i].value == k) {
				sele_index = i - 0 + n;
				break;
			}
		}

		if (sele_index < 0) {
			sele_index = 0;
		} else if (sele_index > options.length) {
			sele_index = options.length - 1;
		}
		
		k = options[sele_index].value;

		$('#select_chapter').val(k);
		readfile(usertext_name, k, 0);
	}

	readfile = function(usertext_name, k, start) { 
		testBeforeChapterNavi();
		if (usertext_name == '' || typeof (usertext_name) == 'undefined')
			return;

		//tinyMCE.activeEditor.setContent('<img src="images/loading.gif"  />');
		 
		if (start)
			$.ajax({
				type : 'POST',
				url : 'php/get_chapter_list.php',
				data : 'userid=' + curr_user_id + '&filename=' + usertext_name,
				success : function(msg) {  
					if (msg == 'ERROR') {
						$('#tool_span').html('');
					} else{
						var attr=msg.split('@@@');
						if(attr[0]){
							setMetaData(attr[0]);
						}
						if(attr[1]){
							$('#tool_span').html(attr[1]);
						}
						curr_chapter=$('#select_chapter').val();
					}
				}
			});
	
		if (k != '')
			curr_chapter = k;
		 
		curr_usertext_name = usertext_name;
		
		//index.html
		user_text_name=usertext_name;

		$.ajax({
			type : 'POST',
			url : 'php/get_chapter_data.php',
			data : {
				'filename' : usertext_name,
				'userid' : curr_user_id,
				'k' : k,
				 'totalchapters' : $('#select_chapter option').length-1
			},
			success : function(msg) {  
				if (msg == 'ERROR') {  
					$('#tool_span').html('');
					setData('');
					return;
				}
				setData(msg);
				setEditorNotDirty(1);
			}
		});
	}

	importBaseToUser = function() {
		var ids = '';
		var check_list = $('#import_file_box input:checkbox:checked');
		for ( var i = 0; i < check_list.length; i++) {
			ids += $(check_list[i]).val() + '@';
		}

		$.ajax({
			type : 'POST',
			url : 'php/import.base.to.user.php',
			data : 'ids=' + ids,
			success : function(msg) { 
				getFileList('usertext', true);
			}
		});
	}

	testBeforeChapterNavi = function() {
		if (isEditorDirty()) {
			if (confirm('Your changes have not been saved yet.\nClick "OK" to save them or "Cancel" to discard changes.')) { // has to be localized
				saveDB();
			}
		}
	}

	saveDB = function() {
		saveDataToDB(curr_usertext_name, curr_chapter, curr_user_id);
	}

	userFileModify = function(_type) { // promt("a","b");
		var old_name = $('#open_file_box input:radio:checked').val();
		var newName = '';
		if (typeof (old_name) == 'undefined' || old_name == '')
			return;

		var new_name;
		if (_type == 'prerename') {
			var bt = $('#open_file_rename');
			var x = $(bt).offset().left;
			var y = $(bt).offset().top - 100;
			var newDiv = document.getElementById('filerenamediv');
			if (typeof (newDiv) == 'undefined' || newDiv == null) {
				newDiv = document.createElement('div');
				newDiv.id = 'filerenamediv';
				newDiv.innerHTML = 'new name:<br />'
						+ '<input type="text" id="new_name_of_file" style="margin-bottom:8px" value="" /><br /><input type="button" size="100" onclick="userFileModify(\'rename\');" value ="OK" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <input type="button" value="Cancel" onclick="$(this).parent().hide();" />';
				$(document.body).append(newDiv);
				$(newDiv).css({
					'padding' : '10px',
					'background-color' : '#bbb',
					'position' : 'absolute',
					'border' : '1px solid #000',
					'z-index' : 999,
					'top' : y,
					'left' : x
				});
			}
			$(newDiv).show();
			$('#new_name_of_file').val(old_name);
			$('#new_name_of_file').select();
			$('#new_name_of_file').focus();
			return;

		} else if (_type == 'delete') {
			if (!confirm('Are you sure?'))
				return;
		} else if (_type == 'rename') {
			new_name = $('#new_name_of_file').val();
		}

		$.ajax({
			type : 'POST',
			url : 'php/userfile_modi.php',
			data : {
				'type' : _type,
				'filename' : old_name,
				'newname' : new_name
			},

			success : function(msg) {
				if (msg == '') {
					if (_type == 'rename')
						$('#filerenamediv').hide();
					getFileList('usertext', true);
				} else { 
					if (_type == 'rename') {
						$('#new_name_of_file').select();
						$('#new_name_of_file').focus();
					}
				}

			}
		});
	}

	getFileList = function(list_type, new_read) {
		var content_div;
		if (list_type == 'usertext') {
			content_div = '#user_file_list_wrap';
		} else
			content_div = '#base_file_list_wrap';

		if ($(content_div).html() == '')
			new_read = true;

		if (!new_read)
			return;

		$(content_div).html("");
		// get file list
		$.ajax({
			type : 'POST',
			url : "php/get_file_list.php",
			data : "type=" + list_type + "&userid=" + curr_user_id,
			success : function(msg) {
				$(content_div).html(msg);
			}
		});

	}

	$(document).ready(function() {
		$('#open_file_button').bind('click', function() {  
			tinyMCE.activeEditor.hide();
			getFileList('usertext', false); 
			$('#open_file_box').toggle();
		});

		$('#open_file_cancel').bind('click', function() {
			$('#open_file_box').hide();
			if(tinyMCE.activeEditor.isHidden()){
				tinyMCE.activeEditor.show();
			}
		});

		$('#open_file_ok').bind('click', function() {
			$('#open_file_box').hide();
			if(tinyMCE.activeEditor.isHidden()){
				tinyMCE.activeEditor.show();
			}
			readfile($('#open_file_box input:radio:checked').val(), '', true);
		});

		$('#open_file_rename').bind('click', function() {
			userFileModify('prerename');
		});

		$('#open_file_delete').bind('click', function() {
			userFileModify('delete');
		});

		$('#open_file_import').bind('click', function() {
			$('#import_file_box').toggle();
			getFileList('basetext', false);
		});

		$('#import_cancel').bind('click', function() {
			$('#import_file_box').hide();
		});

		$('#import_ok').bind('click', function() {
			$('#import_file_box').hide();
			importBaseToUser();
		});

		$('#login_button').bind('click', function(event) {
			wceUserLogin(this, event);
		});
	});

}