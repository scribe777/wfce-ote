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
aspects of the interface or its function. 


.. autofunction:: setWceEditor(_id, [clientOptions, baseURL, callback])

=========================
Integration in a Platform
=========================

Talk about the important link functions getTei setTei