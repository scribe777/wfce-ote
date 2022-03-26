![Tests](https://github.com/github/docs/actions/workflows/ci-jest-tests.yml/badge.svg)


Workspace for Collaborative Editing
-----------------------------------
Online Transcription Editor (OTE)

The WCE-OTE is written as a plugin for and distributed with a bundle of TinyMCE.

License information is available in the main repository and in each of the subfolders for TinyMCE and for the wfce-ote code.

This code was originally written as part of the Workspace for Collaborative Editing project (AHRC/DFG collaborative project 2010-2013). A collaboration between Institute for Textual Scholarship and Electronic Editing (ITSEE) at the University of Birmingham, the Institut für Neutestamentliche Textforschung (INTF) at the University of Münster and the Trier Center for Digital Humanities (TCDH) at the University of Trier.

The main development of the OTE was undertaken by Martin Sievers and Yu Gan at the [Trier Center for Digital Humanities](https://www.tcdh.uni-trier.de).

The original repository used for this project is available at https://sourceforge.net/projects/wfce-ote/.

In February 2022 active development and maintenance was moved to this github repository.


Installation
------------

If obtaining source from repo, the tinymce bundle needs to be unzipped
to the root of the source distribution (this folder).  There is a Makefile to do this.
Simply type:

```bash
make
```

to clean things up again:

```bash
make clean
```

to build the distribution bundle, type:

```bash
make release
```
