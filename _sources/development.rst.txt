###########################
Developing/Adapting the OTE
###########################

This is a brief guide to developing the OTE or adapting it for your own schema. It does not aim to be exhaustive but
rather point to some of the key parts of the code that might need to be adapted or changed. 

============================
Adding/Changing Menu Options
============================

The code that deals with menus and submenus can be found in the ``WCEPlugin`` variable in ``wce-ote/plugin/plugin.js``.
The two key functions that are used to control the behaviours triggered by the menu items are ``doWithDialog`` and 
``doWithoutDialog``. The function which controls the hover over behaviour in the editor itself is ``showWceInfo`` also 
in ``plugin.js``.

=======================
Changing TEI-XML schema
=======================

The functions which translate the XML into HTML in the editor and which translate the HTML into XML can be found in
``wce-ote/wce_tei.js``. The functions are ``getHtmlByTei`` and ``getTeiByHtml`` respectively. Within each of these main
functions there are functions which deal with individual tags/elements. Changes to the schema must be made in both 
directions to enable transciptions to be edited.

