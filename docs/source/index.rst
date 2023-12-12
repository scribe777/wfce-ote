#####################################
The Online Transcription Editor (OTE)
#####################################


========
Overview
========

The WCE-OTE is a WYSIWYM editor was designed to allow users to make TEI/XML transcriptions of New Testament manuscripts
without needing to learn XML or type any XML tags. It follows the XML transcription guidelines published by the 
International Greek New Testament Project (IGNTP) which are available at 
`http://epapers.bham.ac.uk/4301/ <http://epapers.bham.ac.uk/4301/>`_. It does not support all features of TEI, only
those used in the IGNTP schema. The OTE is designed to be included in larger platforms and, as such, does not provide 
any file storage, saving or uploading functionality. For evaluation purposes an HTML file is provided 
(see `Getting Started`_ below).

The WCE-OTE is written as a plugin for, and distributed with a bundle of, TinyMCE. It is currently using TinyMCE 4.5.6.


===============
Getting Started
===============

To use the OTE it must be made available via a webpage. A sample webpage is provided in the repository. 

If you have obtained the code from the github source repository, then first follow the :ref:`build` instructions
to build TinyMCE and then move onto the section :ref:`use`. 

If you are using a distribution version of the code, then skip straight to the :ref:`use` section.

.. _build:

Build
-----

If obtaining the source from repo, then the TinyMCE bundle needs to be unzipped to the root of the source distribution 
(this folder).  There is a Makefile to do this.
Simply type:

.. code-block:: bash

   make install


to clean things up again:

.. code-block:: bash

   make clean


to build the distribution bundle, type:

.. code-block:: bash

   make release


.. _use:

Using the OTE
-------------

A sample webpage is provided in the repository to make it easy to explore and evaluate the OTE it is not intended for 
use in production. If you decide to use the OTE in your own project then you will need to embed the OTE in your own 
webpages. A How to Guide for this and for the configuration options in the OTE is provided on the :doc:`/configuration`
page.

To work properly the sample webpage needs to be run via an http server. You can just open the file in your browser but
if you do this the menus will not all appear correctly and some functions may not work. A simple python server can be
run on any system with python installed, before running the command below make sure you are in the wfce-ote folder 
(on some systems you may need to use python rather than python3):

.. code-block:: bash
   
   python3 -m http.server

This will start a server and you can then access the webpage in your browser at: 

http://localhost:8000/wce-ote/


=====
About
=====

This code was originally written as part of the Workspace for Collaborative Editing project (AHRC/DFG collaborative 
project 2010-2013). A collaboration between Institute for Textual Scholarship and Electronic Editing (ITSEE) at the 
University of Birmingham, the Institut für Neutestamentliche Textforschung (INTF) at the University of Münster and 
the Trier Center for Digital Humanities (TCDH) at the University of Trier.

The main development of the OTE was undertaken by Martin Sievers and Yu Gan at the 
`Trier Center for Digital Humanities <https://www.tcdh.uni-trier.de>`_.

The original repository used for this project is available on 
`sourceforge <https://sourceforge.net/projects/wfce-ote/>`_.

In February 2022 active development and maintenance was moved to this github repository. The maintainers are Troy
A. Griffitts and Catherine Smith.

=======
License
=======

Both the OTE plugin and TinyMCE are released under the GNU Lesser General Public License 2.1.

For the full license see the text in the wfce-ote/wce-ote folder for the OTE license and the wfce-ote folder for the 
TinyMCE license (once TinyMCE has been unzipped).


.. toctree::
   :maxdepth: 2
   :hidden:

   configuration
   testing
   development

