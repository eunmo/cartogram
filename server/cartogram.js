'use strict';

const app = require('./app');

const PORT = 3030;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
