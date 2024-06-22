#######
Testing
#######

The tests for the OTE are written using Jest and Puppeteer and are run in node.js. The current structure of the code
makes unit tests impossible for the majority of the code so the tests are mostly a mixture of dom based tests and 
functional tests. Coverage is available for the dom tests but not yet for the functional tests. The test can all be 
found in the `__tests__` directory. The functional tests are split between two sub-directories based on whether they
test the default configuration of the OTE or a non-default configuration option.

======================
Requirements and Setup
======================

The tests require node.js to run. The recommended node version is 20.10.0 LTS. 

To install the required packages, in the main directory (wfce-ote) run

.. code-block:: bash

    npm install

=================
Running the Tests
=================

To run all of the tests

.. code-block:: bash

    npm test

To run a specfic test

.. code-block:: bash

    npm test __tests__/path/to/test

To run the tests with coverage (NB: coverage does not currently work for the functional tests)

.. code-block:: bash

    npm test -- --coverage





