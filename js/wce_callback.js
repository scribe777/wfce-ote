function wceExecCommandHandler(editor_id, elm, command, user_interface, value) {
	var ed = tinyMCE.getInstanceById(editor_id);

	switch (command) {
	case "getWceTei":
		var teiContent = getWceTei(user_interface[0], user_interface[1]);
		ed.TEI = teiContent;
		return true;

	case "setWceTei":
		setWceTei(value);
		return true;
	}

	return false;
}
