#####################################
The Online Transcription Editor (OTE)
#####################################


========
Overview
========

The WCE-OTE is a WYSIWYM editor was designed to allow users to make TEI/XML transcriptions of New Testament manuscripts
without needing to learn XML or type any XML tags. It follows the XML transcription guidelines published by the 
International Greek New Testament Project which are available at 
`http://epapers.bham.ac.uk/4301/ <http://epapers.bham.ac.uk/4301/>`_. The OTE is designed to be included in larger 
platforms and, as such, does not provide any file saving or uploading functionality. For evaluation purposes there is 
an XML button in the header which allow the XML output to be copied and pasted to a file.

The WCE-OTE is written as a plugin for, and distributed with a bundle of, TinyMCE. It is currently using TinyMCE 4.5.6.


===============
Getting Started
===============

To use the OTE it must be made available via a webpage. A sample webpage is provided in the repository. 



If you have obtained the code from the github source repository, then first follow the :ref:`installation` instructions
to build TinyMCE and then move onto the section :ref:`use`. 

If you are using a distribution version of the code, then skip straight to the :ref:`use` section.

.. _installation:

Installation
------------

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



=======
History
=======

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
TinyMCE license.


.. toctree::
   :maxdepth: 2
   :hidden:

