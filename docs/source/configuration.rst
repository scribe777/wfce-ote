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
type of changes they make to the editor.

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
* **transcriptionLanguage** 
* **showLineNumberSidebarOnLoading**
* **toolbar**

Specific menu configurations
----------------------------
* **BookNames**
* **defaultReasonForUnclearText**
* **defaultHeightForCapitals**
* **defaultValuesForSpaceMenu**
* **showMultilineNotesAsSingleEntry**
* **checkOverlineForAbbr**
* **optionsForGapMenu**
* **optionsForMarginaliaMenu**

Presentation of the output
--------------------------
* **addLineBreaks** (boolean) If set to ``true`` this setting will add line breaks in the output before every ``<pb>``,
  ``<cb>`` and ``<lb>`` in the transcription. The default is false.
* **addSpaces** (boolean) If set to ``true`` this setting will add spaces between all tags so that the text is readable 
  if all the tags are removed in the display. The default is false.

Examples
--------









=========================
Integration in a Platform
=========================

Talk about the important link functions getTei setTei