#################
Running the Tests
#################

The tests for the OTE are written using Jest and Puppeteer and are run in node.js. The current structure of the code
makes unit tests impossible for the majority of the code so the tests are mostly a micture of dom based tests and 
functional tests. Coverage is available for the dom tests but not yet for the functional tests.

======================
Requirements and Setup
======================

The tests require node.js to run. This was tested on node.js 20.10.0 LTS. 