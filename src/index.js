// Point d'entrée unique — enregistre les 4 Cloud Functions HTTP (Gen 2).
// Chaque function est déployable séparément via --entry-point=<nom> sur cette même source.
//
//   fnDiscover → fnFetch → fnExtract → fnLoad
//
// L'orchestration (ordre, retries, états) est gérée par Cloud Workflows,
// voir workflows/price-observatory.workflow.yaml

import { http } from '@google-cloud/functions-framework';

import { discover } from './discover.js';
import { fetchPage } from './fetch.js';
import { extract } from './extract.js';
import { load } from './load.js';

http('fnDiscover', discover);
http('fnFetch', fetchPage);
http('fnExtract', extract);
http('fnLoad', load);
