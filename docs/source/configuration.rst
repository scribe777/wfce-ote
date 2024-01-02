###########################################
Installation, Configuration and Integration
###########################################

The OTE is intended for use in larger web based platforms: it is not a standalone solution. Along with the TinyMCE GUI 
functions are provided to take a TEI-XML string and load it into the editor and to convert the contents of the editor 
into a TEI-XML string. No solution for storage is included, this needs to be provided by the wider platform. The OTE
does add a minimal header for validation purposes but this will also need to be replaced in the wider platform. 

============
Installation
============

To use the OTE in your own platform it needs to be embedded in an HTML page and initialised in JavaScript. 

The OTE is added to a webpage as a ``<textarea>`` element with an id. The editor is then initialised once the page
has loaded by calling ``setWceEditor`` with the id of the textarea element.

The minimal html file required for this is given below.

.. code-block:: html

    <html>
        <head>
            <meta charset="utf-8"/>
            <script type="text/javascript" src="jquery.js"></script>
            <script type="text/javascript" src="wce_tei.js"></script>
            <script type="text/javascript" src="wce_callback.js"></script>
            <script type="text/javascript" src="../js/tinymce/tinymce.js"></script>
            <script type="text/javascript" src="wce_editor.js"></script>
        </head>
        <body>
            <textarea id="wce_editor" rows="28" cols="80" style="width: 100%;"></textarea>
        </body>
        <script type="text/javascript">
            $(document).ready(function() {
                setWceEditor('wce_editor');
            });
        </script>
    </html>


Additional arguments can be passed to ``setWceEditor``. These are:

* A clientOptions object which controls the configuration as described in the `configuration`_ section below.
* A string representing the baseURL of the editor which explicitly sets TinyMCEs base URL.
* a callback function which will be run once the editor is activated. This is mostly used for setting the contents of 
  the editor either with a base text or with an existing transcription.

=============
Configuration
=============

There are many configuration options for the initial set up of the OTE. Some change very small things, others larger
aspects of the interface or its function. In the following configuration documentation the functions are divided by the
type of changes they make to the editor. The confirgutation options were added as a second stage of development. Where 
possible the default settings have been selected to retain exsiting behaviour and therefore the default settings will
somtimes not be the best setting to use.

General interface
-----------------
* **language** (string) [en|de] Specified the language of the interface. Currently supported languages are English (en)
  and German (de). Default is English.

* **rtl** (boolean) This setting should be set to true if you are transcribing languages which are read from right to
  left. For left-to-right the default can be used. 

* **getWitness** (function|string) Either a function that returns the sigla of the witnesses being transcribed or, if 
  the sigla is already known at the initialisation stage, the sigla can be provided directly as a string. 

* **getWitnessLang** (function|string) Either a function that returns the ISO language code of the witnesses being 
  transcribed or, if the language is already known at the initialisation stage, the ISO language code can be provided 
  directly as a string.

* **transcriptionLanguage** (string) This setting specifies the css files that are used for the editor. The options are
  currently coptic and greek. The default is greek which should be okay for most languages.

* **showLineNumberSidebarOnLoading** (boolean) A boolean to determine whether to display the line number sidebar when
  the editor is initialised. The user will always have the option to show and hide the sidebar with the checkbox. when
  making long transcriptions the sidebar can cause the editor to run very slowly so if the transcriptions are of 
  multiple pages it is recommended that the line number side bar is hidden on load. The default is true which means the 
  sidebar will be shown.

* **toolbar** The string to use to configure the toolbar. It should be a subset of the default provided. A | in 
  the string puts a divider at that point in the toolbar. The default string is ``undo redo wcecharmap | code | save 
  print contextmenu cut copy paste fullscreen | breaks correction illegible decoration abbreviation paratext note 
  punctuation versemodify | showTeiByHtml help | info showHtmlByTei``

* **showMultilineNotesAsSingleEntry** (boolean) If set to true this combines multiline untranscribed commentary and 
  lectionary notes into a single line (this does not change the XML output just the appearance in the interface). It
  can be useful to set this to true for long commentary/lectionary manuscripts because the additional lines can slow 
  down the editor. Default is false.

Specific menu configurations
----------------------------
* **BookNames** (array) A list of OSIS book abbreviations to use in the select dropdown of the V menu. If this list is 
  not supplied the form will have a text box for manual entry.

* **defaultReasonForUnclearText** (string) The default option to pre-select in the reason box for unclear text. 
  Default pre-selects nothing. If the provided value is not available in the dropdown list 'other' will be selected and
  the value added in the text box.

* **checkOverlineForAbbr** (boolean) If set to true this will check the 'add overline' option in the abbreviation form 
  when it is loaded. Default is false.

* **defaultHeightForCapitals** (number) If a number is supplied with this settings then it is used to prepopulate the 
  height box in the Ornamentation/capitals submenu. If it is not supplied then the box is not prepopulated.

* **defaultValuesForSpaceMenu** (JSON) This setting provides up to two pre-selected options in the spaces menu. If no
  value is supplied the option will not be prepopulated and in the case of a dropdown menu will default to the first 
  item in the list.

  * **unit** (string) The unit to pre-select. If the provided value is not available in the dropdown list 'other' will be selected and
    the value added in the text box.

  * **extent** (number) The number to use as the pre-populated value for the extent box.

* **optionsForGapMenu** (JSON) The options used to create and to set defaults in the gap menu.

  * **reason** (string) The option to select by default for the reason for the gap. options are
    ``illegible, lacuna, unspecified, inferredPage``.

  * **suppliedSource** (string) The option to use for the source of the supplied text.

  * **sourceOptions** (array) An optional list of sources to use for the supplied source dropdown. ``None`` and 
    ``other`` are always present and cannot be changed by this setting the remaining default are most relevant to Greek 
    New Testament. Each item in the array must be a JSON object containing the following three keys:

    * **value** (string) The value to record in the XML for this supplied source.

    * **labelEn** (string) The visible label to use for this entry in the English interface.
    
    * **labelDe** (string) The visible label to use for this entry in the German interface.

* **optionsForMarginaliaMenu** (JSON) The options used to create and to set defaults in the marginalia menu. This 
  currently only allows a single value to be pre-selected. 

  * **type** (string) The option to select by default for the 'Marginalia' (fw_type) dropdown in the marginalia menu.

Presentation of the output
--------------------------
* **addLineBreaks** (boolean) If set to ``true`` this setting will add line breaks in the output before every ``<pb>``,
  ``<cb>`` and ``<lb>`` in the transcription. The default is false.

* **addSpaces** (boolean) If set to ``true`` this setting will add spaces between all tags so that the text is readable 
  if all the tags are removed in the display. The default is false.

Examples
--------

These are some examples of initialising the editor with different combinations of settings.

Example 1
+++++++++

Preset the transcription language and sigla. Hide the line number sidebar and add line breaks in the export

.. code-block:: javascript

  setWceEditor('wce_editor', {getWitness: '01',
                              getWitnessLang: 'grc',
                              showLineNumberSidebarOnLoading: false,
                              addLineBreaks: true});

Example 2
+++++++++

Provide default values for the space menu.

.. code-block:: javascript

  setWceEditor('wce_editor', {optionsForGapMenu: {unit: 'char', extent: 1}});


Example 3
+++++++++

Provide options for the gap menu.

.. code-block:: javascript

  setWceEditor('wce_editor', 
               {defaultValuesForSpaceMenu: {reason: 'lacuna', 
                                            suppliedSource: 'transcriber',
                                            sourceOptions: [{value: 'transcriber',
                                                              labelEn: 'transcriber',
                                                              labelDe: 'Vorschlag des Transkribenten'}
                                                            ]}});

=========================
Integration in a Platform
=========================

Aside from the initialisation function discussed above there are two key functions that will be needed to interact
with the OTE in a platform.

.. autofunction:: setTEI()

.. autofunction:: getTEI()
