# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Online Transcription Editor'
copyright = '2023, Troy A. Griffitts, Martin Sievers, Catherine Smith, Yu Gan'
author = 'Troy A. Griffitts, Martin Sievers, Catherine Smith, Yu Gan'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = ['sphinx_js']

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', 'venv',]

jsdoc_config_path = 'jsdoc-config.json'
js_source_path = '../../wce-ote/'
primary_domain = 'js'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'furo'
html_static_path = ['_static']
