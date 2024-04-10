Prerequirements
Node.js v20.5.1
ionic version 6.20.8


Give me your email to send an invite to the repository.
Checkout the dev2023 branch of the ionic app repository. In the case of backend repositories checkout master branch.
Create a new branch to work in the new requirement.
Edit environments/environment.ts file with the next information.

export const environment = {
  production: false,
  url: 'https://eh-roofing-gateway.herokuapp.com/api',
  // url: 'http://localhost:8080/api'
  
  /** dropbox keys */
  //appKey:"57lwsplp5auk44k",
  //appSecret:"0nzbfv5z7j5fdin",
  //refreshToken: "Z4H5zFAg7yUAAAAAAAAAAdQOd00n0gisv-6vKvLuQjDpN1-T36joeLqPGaAoeFFe",

  appKey:"bmcndlzkv83uina",
  appSecret:"1gz4tozto32djyr",
  refreshToken: "KcJhVPxutlwAAAAAAAAAAS7xYPGSg8_k9VGlilxNZeDKTCdEHkfa1u68_Vkygm-f",
};


Run the project with ionic serve (frontend) or tic & nom run start (backend)
Now you can test it in Web.

To get access to DB use the next configuration:
Host: ehroofing-qa.cwuyecc9jbsi.us-west-2.rds.amazonaws.com
user: postgres
password: admin1234
