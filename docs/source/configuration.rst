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

minimal html and js



=============
Configuration
=============

There are many configuration options for the initial set up of the OTE. Some change very small things, others larger
aspects of the interface or its function.  


=========================
Integration in a Platform
=========================

Talk about the important link functions getTei setTei